import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, MapPin, ShieldCheck } from "lucide-react";
import logo from "@/assets/omnitrack-logo.png";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/omni";
import { HeroGraphs } from "@/components/omni/HeroGraphs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OmniTrack — One dashboard for all your businesses" },
      { name: "description", content: "Revenue, profit and operations across Marketplace, event spaces, online sales, tax refunds and tickets — by U.S. state." },
      { property: "og:title", content: "OmniTrack — One dashboard for all your businesses" },
      { property: "og:description", content: "See what every business line earns, in every state, in one place." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen bg-hero text-navy-foreground">
      <HeroGraphs />
      <div className="relative">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-card p-1"><img src={logo} alt="OmniTrack logo" width={32} height={32} className="h-8 w-8" /></div>
          <span className="font-display text-xl font-semibold">OmniTrack</span>
        </div>
        <Button asChild variant="secondary"><Link to="/auth">Sign in</Link></Button>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Business HQ · USA</p>
        <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight md:text-6xl">Every business line. Every state. One clear number.</h1>
        <p className="mt-6 max-w-xl text-lg opacity-80">You sell on many platforms. OmniTrack brings the results together so you see what you made, what's pending and where you're growing.</p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg"><Link to="/auth">Open dashboard</Link></Button>
        </div>
        <div className="mt-16 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <span key={c.id} className="rounded-full border border-navy-foreground/20 px-4 py-1.5 text-sm opacity-90">{c.label}</span>
          ))}
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            { icon: BarChart3, t: "Profit you can trust", d: "Revenue minus expenses, commissions and refunds — counted once." },
            { icon: MapPin, t: "State by state", d: "Rank states by profit and drill into any of the 50 + DC." },
            { icon: ShieldCheck, t: "Protected tax records", d: "Only admins and tax officers can see tax refund applications." },
          ].map((f) => (
            <div key={f.t} className="rounded-xl border border-navy-foreground/15 bg-navy-foreground/5 p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm opacity-75">{f.d}</p>
            </div>
          ))}
        </div>
      </main>
      </div>
    </div>
  );
}
