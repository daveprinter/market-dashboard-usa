import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, US_STATES, type Category, type Tx } from "@/lib/omni";
import { useMe } from "@/hooks/use-omni";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const money = z.coerce.number().min(0).max(10_000_000);
const schema = z.object({
  category: z.enum(["marketplace", "event_space", "online", "tax_refund", "tickets"]),
  state_code: z.string().length(2),
  platform: z.string().trim().min(1, "Platform required").max(80),
  description: z.string().trim().max(300),
  tx_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gross: money, expenses: money, commission: money, refunds: money,
  payment_status: z.enum(["pending", "paid", "failed", "refunded"]),
  completion_status: z.enum(["open", "in_progress", "completed", "cancelled"]),
});
type Form = z.input<typeof schema>;

const sel = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

export function TxDialog({ open, onOpenChange, initial, defaultCategory }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: Tx | null; defaultCategory?: Category }) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const blank = (): Form => ({
    category: defaultCategory ?? "marketplace", state_code: "CA", platform: CATEGORIES.find((c) => c.id === (defaultCategory ?? "marketplace"))!.platforms[0] ?? "",
    description: "", tx_date: new Date().toISOString().slice(0, 10), gross: 0, expenses: 0, commission: 0, refunds: 0, payment_status: "pending", completion_status: "open",
  });
  const [f, setF] = useState<Form>(blank());
  useEffect(() => {
    if (open) setF(initial ? { ...initial, category: initial.category, gross: Number(initial.gross), expenses: Number(initial.expenses), commission: Number(initial.commission), refunds: Number(initial.refunds) } as Form : blank());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  const save = useMutation({
    mutationFn: async () => {
      const p = schema.parse(f);
      if (initial) {
        const { error } = await supabase.from("transactions").update(p).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("transactions").insert({ ...p, source: "manual", created_by: me!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transactions"] }); toast.success(initial ? "Record updated" : "Record added"); onOpenChange(false); },
    onError: (e) => toast.error(e instanceof z.ZodError ? (e.issues[0]?.message ?? "Invalid") : (e as Error).message),
  });

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const cats = CATEGORIES.filter((c) => c.id !== "tax_refund" || me?.canTax);
  const plats = CATEGORIES.find((c) => c.id === f.category)?.platforms ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{initial ? `Edit ${initial.ref}` : "Add a record"}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1"><Label>Business</Label>
            <select className={sel} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Category, platform: CATEGORIES.find((c) => c.id === e.target.value)!.platforms[0] ?? "" })}>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select></div>
          <div className="space-y-1"><Label>State</Label>
            <select className={sel} value={f.state_code} onChange={set("state_code")}>
              {Object.entries(US_STATES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>
          <div className="space-y-1"><Label>Platform</Label>
            <Input list="plats" value={f.platform} onChange={set("platform")} />
            <datalist id="plats">{plats.map((p) => <option key={p} value={p} />)}</datalist></div>
          <div className="space-y-1"><Label>Date</Label><Input type="date" value={f.tx_date} onChange={set("tx_date")} /></div>
          <div className="space-y-1"><Label>Gross amount ($)</Label><Input type="number" min={0} step="0.01" value={f.gross as number} onChange={set("gross")} /></div>
          <div className="space-y-1"><Label>Expenses ($)</Label><Input type="number" min={0} step="0.01" value={f.expenses as number} onChange={set("expenses")} /></div>
          <div className="space-y-1"><Label>Commission / fees ($)</Label><Input type="number" min={0} step="0.01" value={f.commission as number} onChange={set("commission")} /></div>
          <div className="space-y-1"><Label>Refunds ($)</Label><Input type="number" min={0} step="0.01" value={f.refunds as number} onChange={set("refunds")} /></div>
          <div className="space-y-1"><Label>Payment</Label>
            <select className={sel} value={f.payment_status} onChange={set("payment_status")}>{["pending", "paid", "failed", "refunded"].map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="space-y-1"><Label>Status</Label>
            <select className={sel} value={f.completion_status} onChange={set("completion_status")}>{["open", "in_progress", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
          <div className="col-span-2 space-y-1"><Label>Note</Label><Input value={f.description} onChange={set("description")} maxLength={300} /></div>
        </div>
        <DialogFooter><Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
