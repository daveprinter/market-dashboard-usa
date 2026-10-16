import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import logo from "@/assets/omnitrack-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — OmniTrack" },
      { name: "description", content: "Sign in to your OmniTrack business dashboard." },
      { property: "og:title", content: "Sign in — OmniTrack" },
      { property: "og:description", content: "Access your company's OmniTrack dashboard." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({ email: z.string().trim().email().max(255), password: z.string().min(1, "Enter your password").max(72) });

const RULES = [
  { label: "6+ characters", test: (p: string) => p.length >= 6 },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Capital letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Digit", test: (p: string) => /\d/.test(p) },
  { label: "Special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function StrengthBar({ password }: { password: string }) {
  const passed = RULES.filter((r) => r.test(password)).length;
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {RULES.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < passed ? (passed === RULES.length ? "bg-primary" : "bg-accent") : "bg-muted"}`} />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {RULES.map((r) => {
          const ok = r.test(password);
          return <li key={r.label} className={ok ? "text-primary" : "text-muted-foreground"}>{ok ? "✓" : "○"} {r.label}</li>;
        })}
      </ul>
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/dashboard" }); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) navigate({ to: "/dashboard" }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const p = schema.safeParse({ email, password });
    if (!p.success) { toast.error(p.error.issues[0]?.message ?? "Invalid"); return; }
    if (mode === "up" && !RULES.every((r) => r.test(password))) { toast.error("Password doesn't meet all requirements"); return; }
    setBusy(true);
    const res = mode === "in"
      ? await supabase.auth.signInWithPassword(p.data)
      : await supabase.auth.signUp({ ...p.data, options: { emailRedirectTo: window.location.origin + "/dashboard" } });
    if (res.error) { setBusy(false); toast.error(res.error.message); return; }
    if (res.data.session) { navigate({ to: "/dashboard", replace: true }); return; }
    setBusy(false);
    if (mode === "up" && !res.data.session) toast.success("Check your email to confirm your account.");
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error("Google sign-in failed");
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-hero p-12 text-navy-foreground md:flex">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-card p-1"><img src={logo} alt="" width={32} height={32} className="h-8 w-8" /></div>
          <span className="font-display text-xl font-semibold">OmniTrack</span>
        </div>
        <p className="max-w-sm text-3xl font-semibold leading-snug" style={{ fontFamily: "var(--font-display)" }}>All five businesses, all fifty states, one dashboard.</p>
        <p className="text-sm opacity-60">The first account created becomes the company admin.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-2xl font-semibold">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{mode === "in" ? "Sign in to continue" : "Team members get access after sign-up"}</p>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={google}>Continue with Google</Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>
          <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="space-y-2"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />{mode === "up" && <StrengthBar password={password} />}</div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? (mode === "in" ? "Signing in…" : "Creating account…") : mode === "in" ? "Sign in" : "Create account"}</Button>
          <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
