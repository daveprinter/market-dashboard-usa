import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { catById, netOf, usd, type Tx } from "@/lib/omni";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SourceBadge, StatusBadge } from "./ui";
import { TxDialog } from "./TxDialog";

export function TxTable({ rows, limit }: { rows: Tx[]; limit?: number }) {
  const [edit, setEdit] = useState<Tx | null>(null);
  const [page, setPage] = useState(0);
  const size = limit ?? 25;
  const shown = useMemo(() => rows.slice(page * size, page * size + size), [rows, page, size]);
  const pages = Math.ceil(rows.length / size);
  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref</TableHead><TableHead>Date</TableHead><TableHead>Business</TableHead><TableHead>State</TableHead>
              <TableHead>Platform</TableHead><TableHead className="text-right">Gross</TableHead><TableHead className="text-right">Net</TableHead>
              <TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead>Source</TableHead><TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((r) => {
              const n = netOf(r);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.ref}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{r.tx_date}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{catById(r.category)?.short}</TableCell>
                  <TableCell>{r.state_code}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{r.platform}</TableCell>
                  <TableCell className="tabular text-right">{usd(Number(r.gross))}</TableCell>
                  <TableCell className={`tabular text-right font-medium ${n < 0 ? "text-destructive" : ""}`}>{usd(n)}</TableCell>
                  <TableCell><StatusBadge s={r.payment_status} /></TableCell>
                  <TableCell><StatusBadge s={r.completion_status} /></TableCell>
                  <TableCell><SourceBadge t={r} /></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => setEdit(r)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              );
            })}
            {!shown.length && <TableRow><TableCell colSpan={11} className="py-10 text-center text-muted-foreground">No records match.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      {!limit && pages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-muted-foreground">Page {page + 1} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
      <TxDialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)} initial={edit} />
    </>
  );
}
