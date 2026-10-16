import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Plus } from "lucide-react";
import { useTransactions } from "@/hooks/use-omni";
import { catById, downloadCsv, groupBy, monthly, rangeStart, totals, usd, type Category, type Range } from "@/lib/omni";
import { CompareBars, Kpi, PageHeader, Panel, RangePicker, TrendChart } from "@/components/omni/ui";
import { TxTable } from "@/components/omni/TxTable";
import { TxDialog } from "@/components/omni/TxDialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/category/$cat")({
  beforeLoad: ({ params }) => { if (!catById(params.cat)) throw notFound(); },
  head: ({ params }) => {
    const l = catById(params.cat)?.label ?? "Business";
    return { meta: [{ title: `${l} — OmniTrack` }, { name: "description", content: `Statistics for ${l}.` }, { property: "og:title", content: `${l} — OmniTrack` }, { property: "og:description", content: `Statistics for ${l}.` }] };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { cat } = Route.useParams();
  const c = catById(cat)!;
  const { data = [] } = useTransactions();
  const [range, setRange] = useState<Range>("12m");
  const [adding, setAdding] = useState(false);
  const rows = useMemo(() => { const s = rangeStart(range); return data.filter((r) => r.category === cat && (!s || r.tx_date >= s)); }, [data, cat, range]);
  const t = totals(rows);
  const byPlat = [...groupBy(rows, (r) => r.platform).entries()].map(([name, rs]) => { const x = totals(rs); return { name, revenue: Math.round(x.revenue), net: Math.round(x.net) }; });
  const restricted = cat === "tax_refund";

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title={c.label} subtitle={restricted ? "Restricted: visible to admins and tax officers only" : "Business line statistics"}
        actions={<><RangePicker value={range} onChange={setRange} />
          <Button variant="outline" onClick={() => downloadCsv(`${cat}-report.csv`, rows)}><Download className="h-4 w-4" />CSV</Button>
          <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add</Button></>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={restricted ? "Service fees" : "Revenue"} value={usd(t.revenue)} hint={`${t.count} records`} />
        <Kpi label="Net profit" value={usd(t.net)} tone={t.net >= 0 ? "good" : "bad"} />
        <Kpi label="Pending payments" value={usd(t.pending)} tone="warn" />
        <Kpi label={restricted ? "Applications completed" : "Completed"} value={`${t.completed} / ${t.count}`} hint={`${t.openTasks} open`} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Monthly trend"><TrendChart data={monthly(rows)} /></Panel>
        <Panel title="By platform"><CompareBars data={byPlat} /></Panel>
      </div>
      <Panel title="Records" className="mt-6"><TxTable rows={rows} /></Panel>
      <TxDialog open={adding} onOpenChange={setAdding} defaultCategory={cat as Category} />
    </div>
  );
}
