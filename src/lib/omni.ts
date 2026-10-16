import type { Database } from "@/integrations/supabase/types";

export type Tx = Database["public"]["Tables"]["transactions"]["Row"];
export type Category = Database["public"]["Enums"]["biz_category"];
export type Role = Database["public"]["Enums"]["app_role"];

export const CATEGORIES: { id: Category; label: string; short: string; color: string; platforms: string[] }[] = [
  { id: "marketplace", label: "Facebook Marketplace", short: "Marketplace", color: "var(--chart-1)", platforms: ["Facebook Marketplace"] },
  { id: "event_space", label: "Event Space Sales", short: "Event Spaces", color: "var(--chart-2)", platforms: ["Peerspace", "Giggster", "Direct booking"] },
  { id: "online", label: "Online Products & Services", short: "Online", color: "var(--chart-3)", platforms: ["Shopify", "Etsy", "Fiverr", "Website"] },
  { id: "tax_refund", label: "Tax Refund Applications", short: "Tax Refunds", color: "var(--chart-4)", platforms: ["In-house filing"] },
  { id: "tickets", label: "Online Ticket Sales", short: "Tickets", color: "var(--chart-5)", platforms: ["Ticketmaster", "StubHub", "SeatGeek", "AXS"] },
];
export const catById = (id: string) => CATEGORIES.find((c) => c.id === id);

export const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

export const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

/** Net profit = gross − expenses − commission − refunds (each counted once). */
export const netOf = (t: Pick<Tx, "gross" | "expenses" | "commission" | "refunds">) =>
  Number(t.gross) - Number(t.expenses) - Number(t.commission) - Number(t.refunds);

export type Totals = {
  revenue: number; expenses: number; commission: number; refunds: number; net: number;
  pending: number; completed: number; openTasks: number; count: number;
};

export function totals(rows: Tx[]): Totals {
  const t: Totals = { revenue: 0, expenses: 0, commission: 0, refunds: 0, net: 0, pending: 0, completed: 0, openTasks: 0, count: rows.length };
  for (const r of rows) {
    t.revenue += Number(r.gross);
    t.expenses += Number(r.expenses);
    t.commission += Number(r.commission);
    t.refunds += Number(r.refunds);
    t.net += netOf(r);
    if (r.payment_status === "pending") t.pending += Number(r.gross);
    if (r.completion_status === "completed") t.completed += 1;
    if (r.completion_status === "open" || r.completion_status === "in_progress") t.openTasks += 1;
  }
  return t;
}

export function groupBy<K extends string>(rows: Tx[], key: (r: Tx) => K) {
  const m = new Map<K, Tx[]>();
  for (const r of rows) {
    const k = key(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(r);
  }
  return m;
}

export function monthly(rows: Tx[]) {
  const m = groupBy(rows, (r) => r.tx_date.slice(0, 7));
  return [...m.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, rs]) => {
      const t = totals(rs);
      const label = new Date(month + "-01T00:00:00").toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      return { month: label, revenue: Math.round(t.revenue), net: Math.round(t.net), expenses: Math.round(t.expenses + t.commission + t.refunds) };
    });
}

export type Range = "30d" | "90d" | "ytd" | "12m" | "all";
export const RANGES: { id: Range; label: string }[] = [
  { id: "30d", label: "30 days" }, { id: "90d", label: "90 days" }, { id: "ytd", label: "Year to date" },
  { id: "12m", label: "12 months" }, { id: "all", label: "All time" },
];
export function rangeStart(r: Range, now = new Date()): string | null {
  const d = new Date(now);
  if (r === "all") return null;
  if (r === "ytd") return `${d.getFullYear()}-01-01`;
  d.setDate(d.getDate() - (r === "30d" ? 30 : r === "90d" ? 90 : 365));
  return d.toISOString().slice(0, 10);
}

export function toCsv(rows: Tx[]) {
  const head = ["ref", "category", "state", "platform", "date", "gross", "expenses", "commission", "refunds", "net", "payment", "completion", "source", "demo"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.ref, catById(r.category)?.label, r.state_code, r.platform, r.tx_date, r.gross, r.expenses, r.commission, r.refunds, netOf(r).toFixed(2), r.payment_status, r.completion_status, r.source, r.is_demo ? "yes" : "no"].map(esc).join(","),
  );
  return [head.join(","), ...lines].join("\n");
}

export function downloadCsv(name: string, rows: Tx[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
