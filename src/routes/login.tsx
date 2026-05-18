import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldAlert, Lock, Mail, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ROLE_LABELS, logAudit, type AppRole } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — FX Risk Console" }] }),
  component: LoginPage,
});

const DEMO_USERS: { role: AppRole; email: string; label: string }[] = [
  { role: "front_office", email: "front@fxrisk.demo", label: "Front Office Operator" },
  { role: "back_office", email: "back@fxrisk.demo", label: "Back Office Validator" },
  { role: "risk_team", email: "risk@fxrisk.demo", label: "Risk Team Analyst" },
  { role: "manager", email: "manager@fxrisk.demo", label: "Responsible Manager" },
  { role: "admin", email: "admin@fxrisk.demo", label: "Administrator" },
];

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("front_office");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/app" });
    });
  }, [navigate]);

  const signIn = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    await logAudit("login", "auth");
    toast.success("Welcome back");
    navigate({ to: "/app" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name: fullName, role },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. Signing in…");
    await supabase.auth.signInWithPassword({ email, password });
    navigate({ to: "/app" });
  };

  const quickDemo = async (u: typeof DEMO_USERS[number]) => {
    setLoading(true);
    const pw = "Demo!2026";

    // Try sign-in first (user may already exist)
    let res = await supabase.auth.signInWithPassword({ email: u.email, password: pw });

    if (res.error) {
      // User doesn't exist yet — try to register them
      const up = await supabase.auth.signUp({
        email: u.email,
        password: pw,
        options: { data: { full_name: u.label, role: u.role } },
      });

      if (up.error) {
        setLoading(false);
        // Give a helpful message for the most common Supabase free-tier issue
        if (up.error.message.toLowerCase().includes("rate limit") || up.error.message.toLowerCase().includes("email")) {
          return toast.error(
            "Email rate limit hit. In your Supabase dashboard go to Authentication → Settings → Email Auth and DISABLE \"Enable email confirmations\", then try again.",
            { duration: 8000 }
          );
        }
        return toast.error(up.error.message);
      }

      // If email confirmation is required, session will be null
      if (!up.data.session) {
        setLoading(false);
        return toast.error(
          "Email confirmation required. Please disable it: Supabase Dashboard → Authentication → Settings → Email Auth → uncheck \"Enable email confirmations\".",
          { duration: 8000 }
        );
      }

      // Signed up and auto-confirmed — sign in now
      res = await supabase.auth.signInWithPassword({ email: u.email, password: pw });
    }

    setLoading(false);
    if (res.error) return toast.error(res.error.message);
    toast.success(`Signed in as ${u.label}`);
    navigate({ to: "/app" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Branding panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-sidebar text-sidebar-foreground p-12 flex-col justify-between">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(800px 400px at 20% 0%, oklch(0.42 0.14 250 / 0.4), transparent), radial-gradient(600px 400px at 80% 100%, oklch(0.6 0.13 235 / 0.3), transparent)" }} />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <div className="font-display font-bold">FX Risk Console</div>
              <div className="text-xs text-sidebar-foreground/60">Operational Risk Management</div>
            </div>
          </div>
        </div>
        <div className="relative space-y-6 max-w-md">
          <h1 className="text-4xl font-display font-bold leading-tight">
            Centralized spot-FX operational risk supervision.
          </h1>
          <p className="text-sidebar-foreground/70">
            Real-time scoring, anomaly detection, multi-role validation workflows, and audit-grade
            traceability for every transaction your bank processes.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-4">
            {[
              { k: "Avg. risk score", v: "32" },
              { k: "Daily operations", v: "284" },
              { k: "Critical alerts", v: "4" },
              { k: "Validation SLA", v: "12 min" },
            ].map((s) => (
              <div key={s.k} className="rounded-lg border border-sidebar-border/40 bg-sidebar-accent/40 p-3">
                <div className="text-xs text-sidebar-foreground/60">{s.k}</div>
                <div className="text-2xl font-display font-bold mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-xs text-sidebar-foreground/50">
          ISO 27001 patterns · RLS-backed access · Audit logged
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center p-6 sm:p-12 bg-background">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="font-display font-bold">FX Risk Console</div>
          </div>

          <h2 className="text-2xl font-display font-bold">Access your console</h2>
          <p className="text-sm text-muted-foreground mt-1">Sign in or create a workspace account.</p>

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="space-y-4 mt-4">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="you@bank.com" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" placeholder="••••••••" />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  Sign in <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password2">Password</Label>
                  <Input id="password2" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Department / Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>Create account</Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">Demo workspace</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-1 gap-2">
            {DEMO_USERS.map((u) => (
              <button
                key={u.role}
                onClick={() => quickDemo(u)}
                disabled={loading}
                className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-left text-sm hover:bg-accent transition-colors disabled:opacity-50"
              >
                <div>
                  <div className="font-medium">{u.label}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
