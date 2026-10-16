import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { RANGES, type Range, usd, type Tx } from "@/lib/omni";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Kpi({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "bad" | "warn" }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("tabular mt-2 font-display text-2xl font-semibold", tone === "good" && "text-success", tone === "bad" && "text-destructive", tone === "warn" && "text-warning")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Panel({ title, children, className, action }: { title: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-xl border bg-card p-5 shadow-card", className)}>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-semibold">{title}</h2>{action}</div>
      {children}
    </section>
  );
}

export function RangePicker({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="flex rounded-lg border bg-card p-1">
      {RANGES.map((r) => (
        <button key={r.id} onClick={() => onChange(r.id)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground", value === r.id && "bg-primary text-primary-foreground")}>{r.label}</button>
      ))}
    </div>
  );
}

const tickFmt = (v: number) => (Math.abs(v) >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`);
const tipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 };

export function TrendChart({ data }: { data: { month: string; revenue: number; net: number; expenses: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={tickFmt} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={50} />
        <Tooltip formatter={(v: number) => usd(v)} contentStyle={tipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="expenses" name="Costs" stroke="var(--chart-4)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="net" name="Net profit" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CompareBars({ data }: { data: { name: string; revenue: number; net: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={tickFmt} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={50} />
        <Tooltip formatter={(v: number) => usd(v)} contentStyle={tipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="revenue" name="Revenue" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="net" name="Net profit" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SourceBadge({ t }: { t: Pick<Tx, "source" | "is_demo"> }) {
  return (
    <span className="inline-flex gap-1">
      <Badge variant="outline" className="capitalize">{t.source === "api" ? "API sync" : t.source}</Badge>
      {t.is_demo && <Badge variant="secondary">Demo</Badge>}
    </span>
  );
}

export function StatusBadge({ s }: { s: string }) {
  const tone = s === "paid" || s === "completed" ? "bg-success/15 text-success" : s === "pending" || s === "in_progress" || s === "open" ? "bg-warning/20 text-foreground" : "bg-destructive/15 text-destructive";
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", tone)}>{s.replace("_", " ")}</span>;
}
