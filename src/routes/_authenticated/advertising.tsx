import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Facebook, Instagram, Music2, Pause, Play, Plus, RefreshCw } from "lucide-react";
import { getAdsOverview, getCampaigns, updateCampaign, createCampaign } from "@/lib/ads.functions";
import { useMe } from "@/hooks/use-omni";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/advertising")({
  head: () => ({ meta: [
    { title: "Advertising — OmniTrack" },
    { name: "description", content: "Connected Facebook, Instagram and TikTok accounts and live ad campaigns." },
    { property: "og:title", content: "Advertising — OmniTrack" },
    { property: "og:description", content: "Manage your company's real ad campaigns." },
  ] }),
  component: AdvertisingPage,
});

const fmt = (n: number) => n.toLocaleString("en-US");
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function AdvertisingPage() {
  const { data: me } = useMe();
  const canManage = !!me && (me.isAdmin || me.roles.includes("manager"));
  const overviewFn = useServerFn(getAdsOverview);
  const ov = useQuery({ queryKey: ["ads-overview"], queryFn: () => overviewFn(), staleTime: 5 * 60_000 });
  const [accountId, setAccountId] = useState<string>("");
  useEffect(() => { if (!accountId && ov.data?.adAccounts[0]) setAccountId(ov.data.adAccounts[0].id); }, [ov.data, accountId]);

  const page = ov.data?.pages[0];
  const ig = page?.instagram_business_account;
  const tt = ov.data?.tiktok;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Advertising</h1>
          <p className="text-sm text-muted-foreground">Live data from your company's connected accounts.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => ov.refetch()} disabled={ov.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${ov.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
      </div>

      {ov.isLoading ? <p className="text-sm text-muted-foreground">Loading accounts…</p> : ov.error ? <p className="text-sm text-destructive">{(ov.error as Error).message}</p> : (
        <div className="grid gap-4 md:grid-cols-3">
          <AccountCard icon={<Facebook className="h-5 w-5" />} title="Facebook" connected={!!page}
            name={page?.name} link={page?.link ?? (page ? `https://www.facebook.com/${page.id}` : undefined)} img={page?.picture?.data?.url}
            stats={page ? [["Followers", fmt(page.fan_count ?? 0)], ["Ad accounts", String(ov.data!.adAccounts.length)]] : []}
            note={ov.data?.errors.meta ?? (!page ? "No Facebook Page was shared." : undefined)} />
          <AccountCard icon={<Instagram className="h-5 w-5" />} title="Instagram" connected={!!ig}
            name={ig ? `@${ig.username}` : undefined} link={ig ? `https://instagram.com/${ig.username}` : undefined} img={ig?.profile_picture_url}
            stats={ig ? [["Followers", fmt(ig.followers_count ?? 0)], ["Posts", fmt(ig.media_count ?? 0)]] : []}
            note={!ig ? "No Instagram business account is linked to your Facebook Page. Link one in Meta, then reconnect." : undefined} />
          <AccountCard icon={<Music2 className="h-5 w-5" />} title="TikTok" connected={!!tt}
            name={tt ? `@${tt.display_name}` : undefined} link={tt?.profile_deep_link} img={tt?.avatar_url}
            stats={tt ? [["Followers", fmt(tt.follower_count ?? 0)], ["Likes", fmt(tt.likes_count ?? 0)], ["Videos", fmt(tt.video_count ?? 0)]] : []}
            note={ov.data?.errors.tiktok ?? undefined} />
        </div>
      )}

      {ov.data && ov.data.adAccounts.length > 0 && (
        <section className="space-y-3 rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Facebook & Instagram campaigns</h2>
              <p className="text-xs text-muted-foreground">Last 30 days. Changes go live on Meta immediately.</p>
            </div>
            <div className="flex items-center gap-2">
              <select className="h-9 rounded-md border bg-background px-2 text-sm" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {ov.data.adAccounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
              </select>
              {canManage && accountId && <NewCampaign accountId={accountId} />}
            </div>
          </div>
          {accountId && <Campaigns accountId={accountId} canManage={canManage} />}
        </section>
      )}

      {ov.data && ov.data.videos.length > 0 && (
        <section className="space-y-3 rounded-xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Recent TikTok videos</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ov.data.videos.map((v) => (
              <a key={v.id} href={v.share_url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border hover:border-primary">
                {v.cover_image_url && <img src={v.cover_image_url} alt={v.title || "TikTok video"} className="aspect-[9/12] w-full object-cover" loading="lazy" />}
                <div className="p-2 text-xs">
                  <p className="line-clamp-1 font-medium">{v.title || "Untitled"}</p>
                  <p className="text-muted-foreground">{fmt(v.view_count ?? 0)} views · {fmt(v.like_count ?? 0)} likes</p>
                </div>
              </a>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">TikTok ad campaigns can't be managed from here yet — that needs a separate TikTok for Business connection.</p>
        </section>
      )}
    </div>
  );
}

function AccountCard(p: { icon: React.ReactNode; title: string; connected: boolean; name?: string; link?: string; img?: string; stats: [string, string][]; note?: string }) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">{p.icon}{p.title}</div>
        <Badge variant={p.connected ? "default" : "secondary"}>{p.connected ? "Linked" : "Not linked"}</Badge>
      </div>
      {p.connected && (
        <div className="flex items-center gap-3">
          {p.img && <img src={p.img} alt="" className="h-10 w-10 rounded-full object-cover" />}
          {p.link ? <a href={p.link} target="_blank" rel="noreferrer" className="truncate font-medium hover:underline">{p.name}</a> : <span className="font-medium">{p.name}</span>}
        </div>
      )}
      {p.stats.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {p.stats.map(([k, v]) => <div key={k}><p className="text-lg font-semibold">{v}</p><p className="text-xs text-muted-foreground">{k}</p></div>)}
        </div>
      )}
      {p.note && <p className="text-xs text-muted-foreground">{p.note}</p>}
    </div>
  );
}

function Campaigns({ accountId, canManage }: { accountId: string; canManage: boolean }) {
  const fn = useServerFn(getCampaigns);
  const upd = useServerFn(updateCampaign);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["campaigns", accountId], queryFn: () => fn({ data: { accountId } }) });
  const m = useMutation({
    mutationFn: (v: { id: string; status?: "ACTIVE" | "PAUSED"; dailyBudget?: number }) => upd({ data: v }),
    onSuccess: () => { toast.success("Saved on Meta"); qc.invalidateQueries({ queryKey: ["campaigns", accountId] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading campaigns…</p>;
  if (q.error) return <p className="text-sm text-destructive">{(q.error as Error).message}</p>;
  if (!q.data?.length) return <p className="text-sm text-muted-foreground">No campaigns in this ad account yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-muted-foreground"><tr>
          <th className="py-2">Campaign</th><th>Status</th><th className="text-right">Daily budget</th><th className="text-right">Spend</th><th className="text-right">Reach</th><th className="text-right">Clicks</th>{canManage && <th />}
        </tr></thead>
        <tbody>
          {q.data.map((c) => (
            <tr key={c.id} className="border-t">
              <td className="py-2"><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.objective.replace("OUTCOME_", "").toLowerCase()}</p></td>
              <td><Badge variant={c.effective_status === "ACTIVE" ? "default" : "secondary"}>{c.effective_status.toLowerCase().replace(/_/g, " ")}</Badge></td>
              <td className="text-right">{c.daily_budget != null ? usd(c.daily_budget) : "—"}</td>
              <td className="text-right">{usd(c.spend)}</td>
              <td className="text-right">{fmt(c.reach)}</td>
              <td className="text-right">{fmt(c.clicks)}</td>
              {canManage && (
                <td className="space-x-1 whitespace-nowrap text-right">
                  {c.daily_budget != null && <Button size="sm" variant="ghost" onClick={() => {
                    const v = window.prompt("New daily budget (USD)", String(c.daily_budget));
                    const n = Number(v); if (v && n >= 1) m.mutate({ id: c.id, dailyBudget: n });
                  }}>Budget</Button>}
                  <Button size="sm" variant="outline" disabled={m.isPending} onClick={() => {
                    const next = c.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
                    if (next === "ACTIVE" && !window.confirm("Turning this on will start spending money. Continue?")) return;
                    m.mutate({ id: c.id, status: next });
                  }}>{c.status === "ACTIVE" ? <><Pause className="mr-1 h-3 w-3" />Pause</> : <><Play className="mr-1 h-3 w-3" />Resume</>}</Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NewCampaign({ accountId }: { accountId: string }) {
  const fn = useServerFn(createCampaign);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("OUTCOME_TRAFFIC");
  const [budget, setBudget] = useState("10");
  const m = useMutation({
    mutationFn: () => fn({ data: { accountId, name, objective: objective as any, dailyBudget: Number(budget) } }),
    onSuccess: () => { toast.success("Campaign created (paused)"); setOpen(false); setName(""); qc.invalidateQueries({ queryKey: ["campaigns", accountId] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" />New campaign</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New campaign</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} /></div>
            <div className="space-y-1"><Label>Goal</Label>
              <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={objective} onChange={(e) => setObjective(e.target.value)}>
                <option value="OUTCOME_TRAFFIC">Website visits</option><option value="OUTCOME_AWARENESS">Awareness</option>
                <option value="OUTCOME_ENGAGEMENT">Engagement</option><option value="OUTCOME_LEADS">Leads</option><option value="OUTCOME_SALES">Sales</option>
              </select>
            </div>
            <div className="space-y-1"><Label>Daily budget (USD)</Label><Input type="number" min={1} value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
            <p className="text-xs text-muted-foreground">Created paused, so nothing spends until you add ads in Meta and resume it.</p>
          </div>
          <DialogFooter><Button disabled={!name.trim() || Number(budget) < 1 || m.isPending} onClick={() => m.mutate()}>{m.isPending ? "Creating…" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
