import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession, ROLE_LABELS } from "@/lib/auth";
import { RiskBadge, StatusBadge, RiskBar } from "@/components/risk-indicators";
import { formatCurrency, type OpStatus, type RiskLevel } from "@/lib/risk";
import {
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Activity,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useState, useMemo } from "react";
import { addDays, format, startOfDay, subDays, subMonths } from "date-fns";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
});

const TREND_WINDOW_DAYS = 14;
const TREND_FORECAST_DAYS = 14;

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function regressionSlope(values: number[]) {
  const n = values.length;
  if (n < 2) return 0;

  const meanX = (n - 1) / 2;
  const meanY = average(values);
  const numerator = values.reduce(
    (sum, value, index) => sum + (index - meanX) * (value - meanY),
    0,
  );
  const denominator = values.reduce((sum, _value, index) => sum + (index - meanX) ** 2, 0);

  return denominator ? numerator / denominator : 0;
}

function isSameCalendarDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function DashboardPage() {
  const { user } = useSession();

  // 🔴 Realtime: auto-refresh dashboard on any DB change
  useRealtimeInvalidate("operations", [["ops-dash"], ["ops-total-count"]]);
  useRealtimeInvalidate("alerts", [["alerts-dash"]]);

  const { data: ops = [] } = useQuery({
    queryKey: ["ops-dash"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Separate exact count — not limited by the 500 fetch cap
  const { data: countData } = useQuery({
    queryKey: ["ops-total-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("operations")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts-dash"],
    queryFn: async () => {
      const { data } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const total = countData ?? ops.length; // true total, not limited by the 500 fetch cap
  const highRisk = ops.filter((o) => o.risk_level === "high" || o.risk_level === "critical").length;
  const openAlerts = alerts.filter((a) => !a.acknowledged).length;
  const critical = alerts.filter((a) => a.severity === "critical" && !a.acknowledged).length;
  const pending = ops.filter((o) => o.status === "pending").length;
  const avgScore = ops.length
    ? Math.round(ops.reduce((s, o) => s + o.risk_score, 0) / ops.length)
    : 0;
  const exposure = ops
    .filter((o) => o.status !== "rejected")
    .reduce((s, o) => s + Number(o.amount), 0);

  const [trendWindowOffset, setTrendWindowOffset] = useState(0);
  const [trendMode, setTrendMode] = useState<"14d" | "30d" | "12m">("14d");

  const trendWindow = useMemo(() => {
    const today = startOfDay(new Date());
    const baseStart = subDays(today, TREND_WINDOW_DAYS - 1);
    const rangeStart = addDays(baseStart, trendWindowOffset);
    const rangeEnd = addDays(rangeStart, TREND_WINDOW_DAYS - 1);
    const latestPredictionEnd = addDays(today, TREND_FORECAST_DAYS);
    const operationDates = ops
      .map((op) => startOfDay(new Date(op.created_at)).getTime())
      .filter((time) => Number.isFinite(time));
    const earliestOperationDay = operationDates.length
      ? new Date(Math.min(...operationDates))
      : baseStart;

    const historicalWindow = Array.from({ length: TREND_WINDOW_DAYS }, (_, index) => {
      const day = subDays(today, TREND_WINDOW_DAYS - 1 - index);
      const dayOps = ops.filter((op) => isSameCalendarDay(new Date(op.created_at), day));
      return dayOps.length ? Math.round(average(dayOps.map((op) => op.risk_score))) : 0;
    });

    const riskSlope = regressionSlope(historicalWindow);
    const currentAvgRisk = average(historicalWindow);
    const projectedOperations = Math.round(
      average(
        Array.from({ length: TREND_WINDOW_DAYS }, (_, index) => {
          const day = subDays(today, TREND_WINDOW_DAYS - 1 - index);
          return ops.filter((op) => isSameCalendarDay(new Date(op.created_at), day)).length;
        }),
      ),
    );

    const windowData = Array.from({ length: TREND_WINDOW_DAYS }, (_, index) => {
      const day = addDays(rangeStart, index);
      const isFuture = day.getTime() > today.getTime();
      const dayOps = isFuture
        ? []
        : ops.filter((op) => isSameCalendarDay(new Date(op.created_at), day));
      const daysAhead = Math.max(1, Math.round((day.getTime() - today.getTime()) / 86400000));

      return {
        date: format(day, "dd/MM"),
        operations: isFuture ? null : dayOps.length,
        forecastOperations: isFuture ? projectedOperations : null,
        avgRisk: isFuture
          ? null
          : dayOps.length
            ? Math.round(average(dayOps.map((op) => op.risk_score)))
            : 0,
        forecastRisk: isFuture ? clampScore(currentAvgRisk + riskSlope * daysAhead) : null,
      };
    });

    const previousRangeEnd = subDays(rangeStart, 1);
    const nextRangeStart = addDays(rangeStart, TREND_WINDOW_DAYS);
    const nextRangeEnd = addDays(nextRangeStart, TREND_WINDOW_DAYS - 1);

    return {
      data: windowData,
      rangeLabel: `${format(rangeStart, "dd/MM/yyyy")} - ${format(rangeEnd, "dd/MM/yyyy")}`,
      canGoPrevious: previousRangeEnd.getTime() >= earliestOperationDay.getTime(),
      canGoNext: nextRangeEnd.getTime() <= latestPredictionEnd.getTime(),
    };
  }, [ops, trendWindowOffset]);

  const trendQuickData = useMemo(() => {
    if (trendMode === "14d") return trendWindow.data;

    if (trendMode === "30d") {
      return Array.from({ length: 30 }, (_, index) => {
        const day = subDays(new Date(), 29 - index);
        const dayOps = ops.filter((op) => isSameCalendarDay(new Date(op.created_at), day));

        return {
          date: format(day, "dd/MM"),
          operations: dayOps.length,
          forecastOperations: null,
          avgRisk: dayOps.length ? Math.round(average(dayOps.map((op) => op.risk_score))) : 0,
          forecastRisk: null,
        };
      });
    }

    return Array.from({ length: 12 }, (_, index) => {
      const month = subMonths(new Date(), 11 - index);
      const key = format(month, "yyyy-MM");
      const monthOps = ops.filter((op) => format(new Date(op.created_at), "yyyy-MM") === key);

      return {
        date: format(month, "MMM yyyy"),
        operations: monthOps.length,
        forecastOperations: null,
        avgRisk: monthOps.length ? Math.round(average(monthOps.map((op) => op.risk_score))) : 0,
        forecastRisk: null,
      };
    });
  }, [ops, trendMode, trendWindow.data]);

  const trendRangeLabel =
    trendMode === "14d"
      ? trendWindow.rangeLabel
      : trendMode === "30d"
        ? `${format(subDays(new Date(), 29), "dd/MM/yyyy")} - ${format(new Date(), "dd/MM/yyyy")}`
        : `${format(subMonths(new Date(), 11), "MM/yyyy")} - ${format(new Date(), "MM/yyyy")}`;

  // by currency pair
  const pairMap = new Map<string, number>();
  ops.forEach((o) => {
    const k = `${o.buy_currency}/${o.sell_currency}`;
    pairMap.set(k, (pairMap.get(k) ?? 0) + 1);
  });
  const byPair = Array.from(pairMap.entries())
    .map(([pair, count]) => ({ pair, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

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
          <p className="text-sm text-muted-foreground mt-1">
            Aperçu des risques opérationnels en temps réel ·{" "}
            {format(new Date(), "EEEE d MMMM yyyy")}
          </p>
        </div>
        <Link
          to="/app/operations"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Voir toutes les opérations <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          icon={Activity}
          label="Total des opérations"
          value={total.toString()}
          sub="Toutes opérations confondues"
          tone="info"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Opérations à risque élevé"
          value={highRisk.toString()}
          sub={`${ops.length ? Math.round((highRisk / ops.length) * 100) : 0}% des opérations chargées`}
          tone="warning"
        />
        <KpiCard
          icon={Bell}
          label="Open Alerts"
          value={openAlerts.toString()}
          sub="Alertes non acquittées"
          tone="warning"
        />
        <KpiCard
          icon={TrendingUp}
          label="Score de risque moyen"
          value={`${avgScore}/100`}
          sub="Plus bas = plus sûr"
          tone="primary"
        />
        <KpiCard
          icon={CheckCircle2}
          label="En attente de validation"
          value={pending.toString()}
          sub="En attente du Back Office"
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="stat-card lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-start sm:items-center gap-3 flex-wrap">
              <div>
                <h3 className="font-display font-semibold">
                  Tendance des risques —{" "}
                  {trendMode === "14d" ? "14 jours" : trendMode === "30d" ? "30 jours" : "12 mois"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Volume et score moyen observés ou prévus
                </p>
                <p className="text-sm font-medium mt-1">{trendRangeLabel}</p>
              </div>
              <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-xs sm:ml-2">
                {[
                  { value: "14d", label: "14 J" },
                  { value: "30d", label: "30 J" },
                  { value: "12m", label: "12 M" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTrendMode(option.value as "14d" | "30d" | "12m")}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      trendMode === option.value
                        ? "bg-card text-foreground font-medium shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs text-muted-foreground">Exposition opérationnelle</div>
              <div className="font-display font-bold text-lg">{formatCurrency(exposure)}</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendQuickData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-glow)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--primary-glow)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--risk-high)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--risk-high)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--warning)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--warning)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="operations"
                name="Opérations observées"
                stroke="var(--primary-glow)"
                fill="url(#g1)"
                strokeWidth={2}
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="forecastOperations"
                name="Opérations prévues"
                stroke="var(--primary-glow)"
                fill="url(#g1)"
                strokeDasharray="5 5"
                strokeWidth={2}
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="avgRisk"
                name="Risque observé"
                stroke="var(--risk-high)"
                fill="url(#g2)"
                strokeWidth={2}
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="forecastRisk"
                name="Risque prévu"
                stroke="var(--warning)"
                fill="url(#g3)"
                strokeDasharray="5 5"
                strokeWidth={2}
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          {trendMode === "14d" && (
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setTrendWindowOffset((offset) => offset - TREND_WINDOW_DAYS)}
                disabled={!trendWindow.canGoPrevious}
                className="rounded-md border border-border px-2.5 py-1 font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                ← 14 jours précédents
              </button>
              <button
                onClick={() => setTrendWindowOffset((offset) => offset + TREND_WINDOW_DAYS)}
                disabled={!trendWindow.canGoNext}
                className="rounded-md border border-border px-2.5 py-1 font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                → 14 jours suivants
              </button>
            </div>
          )}
        </div>

        <div className="stat-card">
          <h3 className="font-display font-semibold mb-1">Distribution des risques</h3>
          <p className="text-xs text-muted-foreground mb-4">Opérations par sévérité</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={riskDist}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {riskDist.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="stat-card">
          <h3 className="font-display font-semibold mb-1">Opérations par paire de devises</h3>
          <p className="text-xs text-muted-foreground mb-4">Les plus échangées</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byPair} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="pair"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="var(--primary-glow)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">Opérations récentes</h3>
              <p className="text-xs text-muted-foreground">Dernière activité</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> En direct
            </span>
          </div>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                  <th className="text-left font-medium px-2 py-2">Réf.</th>
                  <th className="text-left font-medium px-2 py-2">Client</th>
                  <th className="text-left font-medium px-2 py-2">Paire</th>
                  <th className="text-right font-medium px-2 py-2">Montant</th>
                  <th className="text-left font-medium px-2 py-2">Risque</th>
                  <th className="text-left font-medium px-2 py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {ops.slice(0, 7).map((o) => (
                  <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-2 py-2 font-mono text-xs">{o.operation_ref}</td>
                    <td className="px-2 py-2">{o.client_name}</td>
                    <td className="px-2 py-2 font-mono text-xs">
                      {o.buy_currency}/{o.sell_currency}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {formatCurrency(Number(o.amount), o.buy_currency)}
                    </td>
                    <td className="px-2 py-2">
                      <RiskBadge level={o.risk_level as RiskLevel} />
                    </td>
                    <td className="px-2 py-2">
                      <StatusBadge status={o.status as OpStatus} />
                    </td>
                  </tr>
                ))}
                {!ops.length && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted-foreground py-8">
                      Aucune opération. Créez-en une pour voir les analyses.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <h3 className="font-display font-semibold mb-1">Alertes actives</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Problèmes critiques et élevés en attente de traitement
        </p>
        <div className="space-y-2">
          {alerts
            .filter((a) => !a.acknowledged)
            .slice(0, 5)
            .map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 p-3 rounded-md border border-border bg-card"
              >
                <div
                  className={`mt-0.5 h-2 w-2 rounded-full ${
                    a.severity === "critical"
                      ? "bg-risk-critical"
                      : a.severity === "high"
                        ? "bg-risk-high"
                        : a.severity === "moderate"
                          ? "bg-risk-moderate"
                          : "bg-info"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide">
                      {a.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {format(new Date(a.created_at), "MMM d, HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5">{a.message}</p>
                </div>
              </div>
            ))}
          {alerts.filter((a) => !a.acknowledged).length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune alerte active. Tout est normal.
            </p>
          )}
          {critical > 0 && (
            <p className="text-xs text-risk-critical">
              {critical} alerte{critical > 1 ? "s" : ""} critique{critical > 1 ? "s" : ""} nécessite
              {critical > 1 ? "nt" : ""} une attention immédiate.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function greetingByRole(role?: string) {
  switch (role) {
    case "front_office":
      return "Espace de travail Front Office";
    case "back_office":
      return "Bureau de validation Back Office";
    case "risk_team":
      return "Centre de surveillance des risques";
    case "manager":
      return "Vue d'ensemble des risques";
    case "admin":
      return "Administration de la plateforme";
    default:
      return "Tableau de bord opérationnel";
  }
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  sub: string;
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
