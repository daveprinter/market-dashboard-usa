import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GW = "https://connector-gateway.lovable.dev";

async function gw(connector: "meta_ads" | "tiktok", path: string, init?: RequestInit) {
  const lk = process.env['LOVABLE_API_KEY'];
  const ck = connector === "meta_ads" ? process.env['META_ADS_API_KEY'] : process.env['TIKTOK_API_KEY'];
  if (!lk || !ck) throw new Error(`${connector} is not connected`);
  const res = await fetch(`${GW}/${connector}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${lk}`, "X-Connection-Api-Key": ck, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  let body: any = null;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok || body?.error?.message) {
    const msg = body?.error?.error_user_msg || body?.error?.message || text;
    if (!(connector === "tiktok" && body?.error?.code === "ok")) throw new Error(`[${res.status}] ${msg}`);
  }
  return body;
}

async function assertManager(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("admin") && !roles.includes("manager")) throw new Error("Only admins and managers can change ads");
}

export const getAdsOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const safe = async <T,>(f: () => Promise<T>) => { try { return { ok: true as const, data: await f() }; } catch (e) { return { ok: false as const, error: (e as Error).message }; } };
    const [accounts, pages, tiktok, videos] = await Promise.all([
      safe(() => gw("meta_ads", "v26.0/me/adaccounts?fields=id,name,currency,account_status,amount_spent,timezone_name")),
      safe(() => gw("meta_ads", "v26.0/me/accounts?fields=id,name,link,fan_count,picture{url},instagram_business_account{id,username,followers_count,media_count,profile_picture_url}")),
      safe(() => gw("tiktok", "user/info/?fields=open_id,display_name,avatar_url,follower_count,following_count,video_count,likes_count,profile_deep_link,bio_description")),
      safe(() => gw("tiktok", "video/list/?fields=id,title,cover_image_url,share_url,view_count,like_count,comment_count,create_time", { method: "POST", body: JSON.stringify({ max_count: 8 }) })),
    ]);
    return {
      adAccounts: accounts.ok ? (accounts.data.data ?? []) as any[] : [],
      pages: pages.ok ? (pages.data.data ?? []) as any[] : [],
      tiktok: tiktok.ok ? tiktok.data.data?.user ?? null : null,
      videos: videos.ok ? (videos.data.data?.videos ?? []) as any[] : [],
      errors: { meta: accounts.ok ? null : accounts.error, tiktok: tiktok.ok ? null : tiktok.error },
    };
  });

const acct = z.string().regex(/^act_\d+$/);

export const getCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { accountId: string }) => z.object({ accountId: acct }).parse(d))
  .handler(async ({ data }) => {
    const r = await gw("meta_ads", `v26.0/${data.accountId}/campaigns?limit=50&fields=id,name,objective,status,effective_status,daily_budget,lifetime_budget,created_time,insights.date_preset(last_30d){spend,impressions,clicks,reach}&effective_status=["ACTIVE","PAUSED","IN_PROCESS","WITH_ISSUES","CAMPAIGN_PAUSED"]`);
    return (r.data ?? []).map((c: any) => ({
      id: c.id as string, name: c.name as string, objective: c.objective as string, status: c.status as string,
      effective_status: c.effective_status as string,
      daily_budget: c.daily_budget ? Number(c.daily_budget) / 100 : null,
      spend: Number(c.insights?.data?.[0]?.spend ?? 0), impressions: Number(c.insights?.data?.[0]?.impressions ?? 0),
      clicks: Number(c.insights?.data?.[0]?.clicks ?? 0), reach: Number(c.insights?.data?.[0]?.reach ?? 0),
    }));
  });

export const updateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    id: z.string().regex(/^\d+$/), status: z.enum(["ACTIVE", "PAUSED"]).optional(),
    dailyBudget: z.number().min(1).max(100000).optional(), name: z.string().trim().min(1).max(200).optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertManager(context.supabase, context.userId);
    const body: { status?: string; name?: string; daily_budget?: number } = {};
    if (data.status) body.status = data.status;
    if (data.name) body.name = data.name;
    if (data.dailyBudget) body.daily_budget = Math.round(data.dailyBudget * 100);
    await gw("meta_ads", `v26.0/${data.id}`, { method: "POST", body: JSON.stringify(body) });
    return { ok: true };
  });

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    accountId: acct, name: z.string().trim().min(1).max(200),
    objective: z.enum(["OUTCOME_TRAFFIC", "OUTCOME_AWARENESS", "OUTCOME_ENGAGEMENT", "OUTCOME_LEADS", "OUTCOME_SALES"]),
    dailyBudget: z.number().min(1).max(100000),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertManager(context.supabase, context.userId);
    const r = await gw("meta_ads", `v26.0/${data.accountId}/campaigns`, {
      method: "POST",
      body: JSON.stringify({ name: data.name, objective: data.objective, status: "PAUSED", special_ad_categories: [], daily_budget: Math.round(data.dailyBudget * 100), bid_strategy: "LOWEST_COST_WITHOUT_CAP" }),
    });
    return { id: r.id as string };
  });
