import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession, ROLE_LABELS } from "@/lib/auth";
import { RiskBadge, StatusBadge, RiskBar } from "@/components/risk-indicators";
import { formatCurrency, type OpStatus, type RiskLevel } from "@/lib/risk";
import {
  ArrowUpRight, TrendingUp, AlertTriangle, CheckCircle2, Activity, Clock,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format, subDays } from "date-fns";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useSession();

  const { data: ops = [] } = useQuery({
    queryKey: ["ops-dash"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operations").select("*")
        .order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts-dash"],
    queryFn: async () => {
      const { data } = await supabase
        .from("alerts").select("*")
        .order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const total = ops.length;
  const highRisk = ops.filter((o) => o.risk_level === "high" || o.risk_level === "critical").length;
  const critical = alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length;
  const pending = ops.filter((o) => o.status === "pending").length;
  const avgScore = total ? Math.round(ops.reduce((s, o) => s + o.risk_score, 0) / total) : 0;
  const exposure = ops.filter((o) => o.status !== "rejected").reduce((s, o) => s + Number(o.amount), 0);

  // 14-day trend
  const days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), 13 - i));
  const trend = days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const dayOps = ops.filter((o) => o.created_at.startsWith(key));
    return {
      date: format(d, "MMM d"),
      operations: dayOps.length,
      avgRisk: dayOps.length ? Math.round(dayOps.reduce((s, o) => s + o.risk_score, 0) / dayOps.length) : 0,
    };
  });

  // by currency pair
  const pairMap = new Map<string, number>();
  ops.forEach((o) => {
    const k = `${o.buy_currency}/${o.sell_currency}`;
    pairMap.set(k, (pairMap.get(k) ?? 0) + 1);
  });
  const byPair = Array.from(pairMap.entries())
    .map(([pair, count]) => ({ pair, count }))
    .sort((a, b) => b.count - a.count).slice(0, 6);

  // risk distribution
  const riskDist = (["low", "moderate", "high", "critical"] as RiskLevel[]).map((lvl) => ({
    name: lvl[0].toUpperCase() + lvl.slice(1),
    value: ops.filter((o) => o.risk_level === lvl).length,
    color: `var(--risk-${lvl})`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">{user && ROLE_LABELS[user.role]}</p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold mt-1">
            {greetingByRole(user?.role)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time operational risk overview · {format(new Date(), "EEEE, MMM d, yyyy")}</p>
        </div>
        <Link
          to="/app/operations"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all operations <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Activity} label="Total operations" value={total.toString()} sub="last 500 tracked" tone="info" />
        <KpiCard icon={AlertTriangle} label="High-risk operations" value={highRisk.toString()} sub={`${total ? Math.round((highRisk / total) * 100) : 0}% of book`} tone="warning" />
        <KpiCard icon={TrendingUp} label="Average risk score" value={`${avgScore}/100`} sub="Lower is safer" tone="primary" />
        <KpiCard icon={CheckCircle2} label="Pending validation" value={pending.toString()} sub="Awaiting Back Office" tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="stat-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">Risk trend — 14 days</h3>
              <p className="text-xs text-muted-foreground">Operations volume vs. average risk score</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Operational exposure</div>
              <div className="font-display font-bold text-lg">{formatCurrency(exposure)}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-glow)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--primary-glow)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--risk-high)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--risk-high)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="operations" stroke="var(--primary-glow)" fill="url(#g1)" strokeWidth={2} />
              <Area type="monotone" dataKey="avgRisk" stroke="var(--risk-high)" fill="url(#g2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <h3 className="font-display font-semibold mb-1">Risk distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Operations by severity</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={riskDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {riskDist.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="stat-card">
          <h3 className="font-display font-semibold mb-1">Operations by currency pair</h3>
          <p className="text-xs text-muted-foreground mb-4">Top traded</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byPair} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis type="category" dataKey="pair" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} width={70} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="var(--primary-glow)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">Recent operations</h3>
              <p className="text-xs text-muted-foreground">Latest activity</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> Live
            </span>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="text-left font-medium px-2 py-2">Ref</th>
                  <th className="text-left font-medium px-2 py-2">Client</th>
                  <th className="text-left font-medium px-2 py-2">Pair</th>
                  <th className="text-right font-medium px-2 py-2">Amount</th>
                  <th className="text-left font-medium px-2 py-2">Risk</th>
                  <th className="text-left font-medium px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {ops.slice(0, 7).map((o) => (
                  <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-2 py-2 font-mono text-xs">{o.operation_ref}</td>
                    <td className="px-2 py-2">{o.client_name}</td>
                    <td className="px-2 py-2 font-mono text-xs">{o.buy_currency}/{o.sell_currency}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{formatCurrency(Number(o.amount), o.buy_currency)}</td>
                    <td className="px-2 py-2"><RiskBadge level={o.risk_level as RiskLevel} /></td>
                    <td className="px-2 py-2"><StatusBadge status={o.status as OpStatus} /></td>
                  </tr>
                ))}
                {!ops.length && (
                  <tr><td colSpan={6} className="text-center text-muted-foreground py-8">No operations yet. Create one to see analytics.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <h3 className="font-display font-semibold mb-1">Active alerts</h3>
        <p className="text-xs text-muted-foreground mb-4">Critical and high severity issues awaiting review</p>
        <div className="space-y-2">
          {alerts.filter((a) => !a.acknowledged).slice(0, 5).map((a) => (
            <div key={a.id} className="flex items-start gap-3 p-3 rounded-md border border-border bg-card">
              <div className={`mt-0.5 h-2 w-2 rounded-full ${
                a.severity === "critical" ? "bg-risk-critical" :
                a.severity === "high" ? "bg-risk-high" :
                a.severity === "moderate" ? "bg-risk-moderate" : "bg-info"
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide">{a.category}</span>
                  <span className="text-xs text-muted-foreground">· {format(new Date(a.created_at), "MMM d, HH:mm")}</span>
                </div>
                <p className="text-sm mt-0.5">{a.message}</p>
              </div>
            </div>
          ))}
          {alerts.filter((a) => !a.acknowledged).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No active alerts. All clear.</p>
          )}
          {critical > 0 && (
            <p className="text-xs text-risk-critical">{critical} critical alert{critical > 1 ? "s" : ""} require attention.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function greetingByRole(role?: string) {
  switch (role) {
    case "front_office": return "Front Office workspace";
    case "back_office": return "Back Office validation desk";
    case "risk_team": return "Risk monitoring center";
    case "manager": return "Executive risk overview";
    case "admin": return "Platform administration";
    default: return "Operational dashboard";
  }
}

function KpiCard({ icon: Icon, label, value, sub, tone }: {
  icon: typeof Activity; label: string; value: string; sub: string;
  tone: "primary" | "warning" | "success" | "info";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
  }[tone];
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl sm:text-3xl font-display font-bold mt-2 tabular-nums">{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-md flex items-center justify-center ${toneCls}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{sub}</p>
    </div>
  );
}
