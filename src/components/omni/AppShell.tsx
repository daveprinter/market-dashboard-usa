import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LayoutDashboard, ListOrdered, MapPin, Users, LogOut, Menu, Store, CalendarDays, ShoppingBag, FileText, Ticket, Megaphone, type LucideIcon } from "lucide-react";
import logo from "@/assets/omnitrack-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-omni";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/omni";

const catIcons: Record<Category, LucideIcon> = { marketplace: Store, event_space: CalendarDays, online: ShoppingBag, tax_refund: FileText, tickets: Ticket };
const catNav: { id: Category; label: string }[] = [
  { id: "marketplace", label: "FB Marketplace" }, { id: "event_space", label: "Event Spaces" },
  { id: "online", label: "Online Products" }, { id: "tax_refund", label: "Tax Refunds" }, { id: "tickets", label: "Tickets" },
];

const linkCls = "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const activeCls = "bg-sidebar-accent text-sidebar-accent-foreground font-semibold";

export function AppShell() {
  const { data: me } = useMe();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="flex h-full flex-col gap-1 p-4" onClick={() => setOpen(false)}>
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="rounded-md bg-card p-0.5"><img src={logo} alt="OmniTrack" width={28} height={28} className="h-7 w-7" /></div>
        <span className="font-display text-lg font-semibold text-sidebar-accent-foreground">OmniTrack</span>
      </div>
      <Link to="/dashboard" className={linkCls} activeProps={{ className: activeCls }}><LayoutDashboard className="h-4 w-4" />Overview</Link>
      <Link to="/transactions" className={linkCls} activeProps={{ className: activeCls }}><ListOrdered className="h-4 w-4" />Transactions</Link>
      <Link to="/states" className={linkCls} activeProps={{ className: activeCls }}><MapPin className="h-4 w-4" />States</Link>
      <Link to="/advertising" className={linkCls} activeProps={{ className: activeCls }}><Megaphone className="h-4 w-4" />Advertising</Link>
      <p className="mt-5 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">Businesses</p>
      {catNav.filter((c) => c.id !== "tax_refund" || me?.canTax).map((c) => {
        const Icon = catIcons[c.id];
        return <Link key={c.id} to="/category/$cat" params={{ cat: c.id }} className={linkCls} activeProps={{ className: activeCls }}><Icon className="h-4 w-4" />{c.label}</Link>;
      })}
      {me?.isAdmin && (
        <>
          <p className="mt-5 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">Admin</p>
          <Link to="/team" className={linkCls} activeProps={{ className: activeCls }}><Users className="h-4 w-4" />Team & activity</Link>
        </>
      )}
      <div className="mt-auto border-t border-sidebar-border pt-4">
        <p className="truncate px-3 text-xs text-sidebar-foreground/70">{me?.email}</p>
        <p className="px-3 text-xs capitalize text-sidebar-primary">{me?.roles.join(", ").replace("_", " ") || "no role"}</p>
        <button onClick={signOut} className={cn(linkCls, "mt-2 w-full")}><LogOut className="h-4 w-4" />Sign out</button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-sidebar lg:block">{nav}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar">{nav}</aside>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b bg-card px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
          <span className="font-display font-semibold">OmniTrack</span>
        </header>
        <main className="flex-1 p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
