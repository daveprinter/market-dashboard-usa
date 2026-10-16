import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useTransactions } from "@/hooks/use-omni";
import { CATEGORIES, groupBy, monthly, rangeStart, totals, usd, US_STATES, type Range } from "@/lib/omni";
import { CompareBars, Kpi, PageHeader, Panel, RangePicker, TrendChart } from "@/components/omni/ui";
import { TxTable } from "@/components/omni/TxTable";
import { TxDialog } from "@/components/omni/TxDialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Overview — OmniTrack" }, { name: "description", content: "Company-wide revenue and profit." }, { property: "og:title", content: "Overview — OmniTrack" }, { property: "og:description", content: "Company-wide revenue and profit." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data = [], isLoading } = useTransactions();
  const [range, setRange] = useState<Range>("12m");
  const [adding, setAdding] = useState(false);
  const rows = useMemo(() => { const s = rangeStart(range); return s ? data.filter((r) => r.tx_date >= s) : data; }, [data, range]);
  const t = totals(rows);
  const byCat = groupBy(rows, (r) => r.category);
  const catData = CATEGORIES.filter((c) => byCat.has(c.id)).map((c) => { const ct = totals(byCat.get(c.id)!); return { id: c.id, name: c.short, revenue: Math.round(ct.revenue), net: Math.round(ct.net), count: ct.count }; });
  const topStates = [...groupBy(rows, (r) => r.state_code).entries()].map(([s, rs]) => ({ s, net: totals(rs).net })).sort((a, b) => b.net - a.net).slice(0, 5);
  const demo = data.some((r) => r.is_demo);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="Company overview" subtitle="All businesses, all states" actions={<><RangePicker value={range} onChange={setRange} /><Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" />Add record</Button></>} />
      {demo && <div className="mb-6 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">Sample records marked <b>Demo</b> are shown so you can explore. Remove them from Transactions when you start entering real numbers.</div>}
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Total revenue" value={usd(t.revenue)} hint={`${t.count} records`} />
            <Kpi label="Total costs" value={usd(t.expenses + t.commission)} hint={`Expenses ${usd(t.expenses)} · Fees ${usd(t.commission)}`} />
            <Kpi label="Net profit" value={usd(t.net)} tone={t.net >= 0 ? "good" : "bad"} hint={t.revenue ? `${Math.round((t.net / t.revenue) * 100)}% margin` : undefined} />
            <Kpi label="Pending payments" value={usd(t.pending)} tone="warn" />
            <Kpi label="Completed" value={String(t.completed)} />
            <Kpi label="Open tasks" value={String(t.openTasks)} />
            <Kpi label="Refunds" value={usd(t.refunds)} tone="bad" />
            <Kpi label="Active states" value={String(groupBy(rows, (r) => r.state_code).size)} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Panel title="Monthly performance" className="lg:col-span-2"><TrendChart data={monthly(rows)} /></Panel>
            <Panel title="Top states by profit" action={<Link to="/states" className="text-xs text-primary">All states</Link>}>
              <ol className="space-y-3">
                {topStates.map((s, i) => (
                  <li key={s.s} className="flex items-center justify-between text-sm">
                    <span><span className="mr-2 text-muted-foreground">{i + 1}.</span>{US_STATES[s.s] ?? s.s}</span>
                    <span className="tabular font-medium">{usd(s.net)}</span>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Panel title="Business comparison" className="lg:col-span-2"><CompareBars data={catData} /></Panel>
            <Panel title="By business">
              <ul className="space-y-3">
                {catData.map((c) => (
                  <li key={c.id}><Link to="/category/$cat" params={{ cat: c.id }} className="flex items-center justify-between rounded-lg p-2 text-sm hover:bg-muted">
                    <span>{c.name}<span className="ml-2 text-xs text-muted-foreground">{c.count}</span></span><span className="tabular font-medium">{usd(c.net)}</span>
                  </Link></li>
                ))}
              </ul>
            </Panel>
          </div>
          <Panel title="Latest records" className="mt-6" action={<Link to="/transactions" className="text-xs text-primary">View all</Link>}><TxTable rows={rows} limit={8} /></Panel>
        </>
      )}
      <TxDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}
