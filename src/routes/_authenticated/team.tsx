import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-omni";
import { catById, type Role } from "@/lib/omni";
import { PageHeader, Panel } from "@/components/omni/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({ meta: [{ title: "Team & activity — OmniTrack" }, { name: "description", content: "Manage access and review activity." }, { property: "og:title", content: "Team — OmniTrack" }, { property: "og:description", content: "Manage access and review activity." }] }),
  component: TeamPage,
});

const ROLES: { id: Role; label: string; hint: string }[] = [
  { id: "admin", label: "Admin", hint: "Everything" },
  { id: "manager", label: "Manager", hint: "Can delete records" },
  { id: "staff", label: "Staff", hint: "View & record" },
  { id: "tax_officer", label: "Tax officer", hint: "Sees tax refunds" },
];

function TeamPage() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const team = useQuery({ queryKey: ["team"], enabled: !!me?.isAdmin, queryFn: async () => { const { data, error } = await supabase.rpc("list_team"); if (error) throw error; return data; } });
  const audit = useQuery({ queryKey: ["audit"], enabled: !!me?.isAdmin, queryFn: async () => { const { data, error } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(50); if (error) throw error; return data; } });

  const toggle = useMutation({
    mutationFn: async ({ uid, role, on }: { uid: string; role: Role; on: boolean }) => {
      const { error } = on ? await supabase.from("user_roles").insert({ user_id: uid, role }) : await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["team"] }); toast.success("Access updated"); },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!me?.isAdmin) return <p className="text-muted-foreground">Only admins can view this page.</p>;
  const emailOf = (id: string | null) => team.data?.find((u) => u.user_id === id)?.email ?? "system";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Team & activity" subtitle="New members sign up themselves, then you grant their access here" />
      <Panel title="Members and access">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Email</TableHead>{ROLES.map((r) => <TableHead key={r.id} className="text-center">{r.label}<div className="text-[10px] font-normal text-muted-foreground">{r.hint}</div></TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {team.data?.map((u) => (
                <TableRow key={u.user_id}>
                  <TableCell>{u.email}</TableCell>
                  {ROLES.map((r) => (
                    <TableCell key={r.id} className="text-center">
                      <Checkbox checked={u.roles.includes(r.id)} disabled={u.user_id === me.id && r.id === "admin"}
                        onCheckedChange={(v) => toggle.mutate({ uid: u.user_id, role: r.id, on: !!v })} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
      <Panel title="Recent activity">
        <ul className="divide-y text-sm">
          {audit.data?.map((a) => {
            const d = a.details as Record<string, unknown> | null;
            return (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span><b className="capitalize">{a.action}</b> {String(d?.ref ?? "")} <span className="text-muted-foreground">· {catById(a.category ?? "")?.short}</span></span>
                <span className="text-muted-foreground">{emailOf(a.actor)} · {new Date(a.created_at).toLocaleString()}</span>
              </li>
            );
          })}
          {!audit.data?.length && <li className="py-4 text-muted-foreground">No activity yet.</li>}
        </ul>
      </Panel>
    </div>
  );
}
