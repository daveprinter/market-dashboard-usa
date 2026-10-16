import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe, useTransactions } from "@/hooks/use-omni";
import { CATEGORIES, downloadCsv, totals, usd, US_STATES, type Category } from "@/lib/omni";
import { PageHeader, Panel } from "@/components/omni/ui";
import { TxTable } from "@/components/omni/TxTable";
import { TxDialog } from "@/components/omni/TxDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({ meta: [{ title: "Transactions — OmniTrack" }, { name: "description", content: "Every recorded transaction." }, { property: "og:title", content: "Transactions — OmniTrack" }, { property: "og:description", content: "Every recorded transaction." }] }),
  component: TxPage,
});

const sel = "h-9 rounded-md border border-input bg-card px-3 text-sm";

function TxPage() {
  const { data = [] } = useTransactions();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [st, setSt] = useState("");
  const [pay, setPay] = useState("");
  const [src, setSrc] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => data.filter((r) =>
    (!cat || r.category === cat) && (!st || r.state_code === st) && (!pay || r.payment_status === pay) &&
    (!src || (src === "demo" ? r.is_demo : r.source === src)) && (!from || r.tx_date >= from) && (!to || r.tx_date <= to) &&
    (!q || `${r.ref} ${r.platform} ${r.description}`.toLowerCase().includes(q.toLowerCase()))), [data, cat, st, pay, src, from, to, q]);
  const t = totals(rows);

  async function importCsv(file: File): Promise<void> {
    const text = await file.text();
    const [head, ...lines] = text.trim().split(/\r?\n/);
    const cols = (head ?? "").split(",").map((c) => c.trim().toLowerCase().replace(/"/g, ""));
    const need = ["category", "state", "platform", "date", "gross"];
    if (!need.every((n) => cols.includes(n))) { toast.error(`CSV needs columns: ${need.join(", ")} (optional: expenses, commission, refunds, payment, completion, description)`); return; }
    const valid = new Set(CATEGORIES.map((c) => c.id));
    const recs = [];
    for (const line of lines.slice(0, 2000)) {
      const v = line.split(",").map((x) => x.trim().replace(/^"|"$/g, ""));
      const g = (k: string) => v[cols.indexOf(k)] ?? "";
      const category = g("category") as Category;
      if (!valid.has(category) || !US_STATES[g("state").toUpperCase()] || !/^\d{4}-\d{2}-\d{2}$/.test(g("date"))) continue;
      const num = (k: string) => Math.max(0, Number(g(k)) || 0);
      recs.push({
        category, state_code: g("state").toUpperCase(), platform: g("platform").slice(0, 80) || "Unknown", tx_date: g("date"), description: g("description").slice(0, 300),
        gross: num("gross"), expenses: num("expenses"), commission: num("commission"), refunds: num("refunds"),
        payment_status: (["pending", "paid", "failed", "refunded"].includes(g("payment")) ? g("payment") : "paid") as "paid",
        completion_status: (["open", "in_progress", "completed", "cancelled"].includes(g("completion")) ? g("completion") : "completed") as "completed",
        source: "import" as const, created_by: me!.id,
      });
    }
    if (!recs.length) { toast.error("No valid rows found"); return; }
    const { error } = await supabase.from("transactions").insert(recs);
    if (error) { toast.error(error.message); return; }
    toast.success(`Imported ${recs.length} of ${lines.length} rows`);
    qc.invalidateQueries({ queryKey: ["transactions"] });
  }

  async function clearDemo(): Promise<void> {
    if (!confirm("Delete all demo records? Your real records stay.")) return;
    const { error } = await supabase.from("transactions").delete().eq("is_demo", true);
    if (error) { toast.error(error.message); return; }
    toast.success("Demo records removed");
    qc.invalidateQueries({ queryKey: ["transactions"] });
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Transactions" subtitle={`${rows.length} records · ${usd(t.revenue)} gross · ${usd(t.net)} net`}
        actions={<>
          {me?.isAdmin && data.some((r) => r.is_demo) && <Button variant="ghost" onClick={clearDemo}><Trash2 className="h-4 w-4" />Remove demo data</Button>}
          <input ref={fileRef} type="file" accept=".csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ""; }} />
          <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" />Import CSV</Button>
          <Button variant="outline" onClick={() => downloadCsv("omnitrack-transactions.csv", rows)}><Download className="h-4 w-4" />Export</Button>
          <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add</Button>
        </>} />
      <Panel title="Filters" className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search ref, platform, note" value={q} onChange={(e) => setQ(e.target.value)} className="w-56 bg-card" />
          <select className={sel} value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All businesses</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.short}</option>)}</select>
          <select className={sel} value={st} onChange={(e) => setSt(e.target.value)}><option value="">All states</option>{Object.entries(US_STATES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select className={sel} value={pay} onChange={(e) => setPay(e.target.value)}><option value="">Any payment</option>{["pending", "paid", "failed", "refunded"].map((s) => <option key={s}>{s}</option>)}</select>
          <select className={sel} value={src} onChange={(e) => setSrc(e.target.value)}><option value="">Any source</option><option value="manual">Manual</option><option value="import">Imported</option><option value="api">API sync</option><option value="demo">Demo only</option></select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40 bg-card" aria-label="From" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40 bg-card" aria-label="To" />
        </div>
      </Panel>
      <Panel title="Records"><TxTable rows={rows} /></Panel>
      <TxDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}
