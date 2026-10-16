import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Role, Tx } from "@/lib/omni";

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const all: Tx[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from("transactions").select("*").order("tx_date", { ascending: false }).range(from, from + 999);
        if (error) throw error;
        all.push(...data);
        if (data.length < 1000) break;
      }
      return all;
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      const roles = (data ?? []).map((r) => r.role as Role);
      return { id: u.user.id, email: u.user.email ?? "", roles, isAdmin: roles.includes("admin"), canTax: roles.includes("admin") || roles.includes("tax_officer") };
    },
  });
}
