import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTransactions } from "@/hooks/use-omni";
import { CATEGORIES, groupBy, monthly, rangeStart, totals, usd, US_STATES, type Range } from "@/lib/omni";
import { Kpi, PageHeader, Panel, RangePicker, TrendChart, CompareBars } from "@/components/omni/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/states")({
  head: () => ({ meta: [{ title: "States — OmniTrack" }, { name: "description", content: "State-by-state performance." }, { property: "og:title", content: "States — OmniTrack" }, { property: "og:description", content: "State-by-state performance." }] }),
  component: StatesPage,
});

function StatesPage() {
  const { data = [] } = useTransactions();
  const [range, setRange] = useState<Range>("12m");
  const [sel, setSel] = useState<string | null>(null);
  const rows = useMemo(() => { const s = rangeStart(range); return s ? data.filter((r) => r.tx_date >= s) : data; }, [data, range]);
  const ranking = [...groupBy(rows, (r) => r.state_code).entries()].map(([s, rs]) => ({ s, ...totals(rs) })).sort((a, b) => b.net - a.net);
  const active = sel ?? ranking[0]?.s;
  const stRows = rows.filter((r) => r.state_code === active);
  const st = totals(stRows);
  const byCat = groupBy(stRows, (r) => r.category);

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader title="State-by-state" subtitle="Rankings and drill-down for every state you operate in" actions={<RangePicker value={range} onChange={setRange} />} />
      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Ranking by net profit" className="lg:col-span-2">
          <Table>
            <TableHeader><TableRow><TableHead>#</TableHead><TableHead>State</TableHead><TableHead className="text-right">Revenue</TableHead><TableHead className="text-right">Net</TableHead></TableRow></TableHeader>
            <TableBody>
              {ranking.map((r, i) => (
                <TableRow key={r.s} onClick={() => setSel(r.s)} className={cn("cursor-pointer", r.s === active && "bg-accent")}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>{US_STATES[r.s] ?? r.s}<span className="ml-1 text-xs text-muted-foreground">{r.count}</span></TableCell>
                  <TableCell className="tabular text-right">{usd(r.revenue)}</TableCell>
                  <TableCell className="tabular text-right font-medium">{usd(r.net)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
        <div className="space-y-6 lg:col-span-3">
          {active && (
            <>
              <h2 className="text-xl font-semibold">{US_STATES[active]}</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Kpi label="Revenue" value={usd(st.revenue)} />
                <Kpi label="Costs" value={usd(st.expenses + st.commission + st.refunds)} />
                <Kpi label="Net profit" value={usd(st.net)} tone={st.net >= 0 ? "good" : "bad"} />
                <Kpi label="Completed" value={`${st.completed}/${st.count}`} />
              </div>
              <Panel title="Trend"><TrendChart data={monthly(stRows)} /></Panel>
              <Panel title="Businesses in this state">
                <CompareBars data={CATEGORIES.filter((c) => byCat.has(c.id)).map((c) => { const x = totals(byCat.get(c.id)!); return { name: c.short, revenue: Math.round(x.revenue), net: Math.round(x.net) }; })} />
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
