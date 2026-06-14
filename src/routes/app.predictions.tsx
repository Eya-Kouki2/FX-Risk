import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { addDays, format, isAfter, startOfDay, subDays } from "date-fns";
import {
  AlertTriangle,
  Activity,
  BrainCircuit,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { RiskBadge } from "@/components/risk-indicators";
import { formatCurrency, type RiskLevel } from "@/lib/risk";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

export const Route = createFileRoute("/app/predictions")({
  component: PredictionsPage,
});

const FORECAST_DAYS = 7;
const HISTORY_DAYS = 14;

type DailyPoint = {
  date: string;
  day: Date;
  avgRisk: number;
  exposure: number;
  highRisk: number;
  operations: number;
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score <= 20) return "low";
  if (score <= 40) return "moderate";
  if (score <= 60) return "high";
  return "critical";
}

function sameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function regressionSlope(values: number[]) {
  const n = values.length;
  if (n < 2) return 0;

  const meanX = (n - 1) / 2;
  const meanY = values.reduce((sum, value) => sum + value, 0) / n;
  const numerator = values.reduce(
    (sum, value, index) => sum + (index - meanX) * (value - meanY),
    0,
  );
  const denominator = values.reduce((sum, _value, index) => sum + (index - meanX) ** 2, 0);

  return denominator ? numerator / denominator : 0;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function PredictionsPage() {
  useRealtimeInvalidate("operations", [["predictive-ops"]]);

  const { data: ops = [] } = useQuery({
    queryKey: ["predictive-ops"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });

  const today = startOfDay(new Date());
  const history: DailyPoint[] = Array.from({ length: HISTORY_DAYS }, (_, index) => {
    const day = subDays(today, HISTORY_DAYS - 1 - index);
    const dayOps = ops.filter((op) => sameDay(new Date(op.created_at), day));
    const riskScores = dayOps.map((op) => op.risk_score);

    return {
      date: format(day, "MMM d"),
      day,
      avgRisk: riskScores.length ? Math.round(average(riskScores)) : 0,
      exposure: dayOps.reduce((sum, op) => sum + Number(op.amount), 0),
      highRisk: dayOps.filter((op) => op.risk_level === "high" || op.risk_level === "critical")
        .length,
      operations: dayOps.length,
    };
  });

  const lastSevenDays = subDays(today, FORECAST_DAYS - 1);
  const recentOps = ops.filter(
    (op) => !isAfter(lastSevenDays, startOfDay(new Date(op.created_at))),
  );
  const currentAvgRisk = Math.round(
    average(history.slice(-FORECAST_DAYS).map((point) => point.avgRisk)),
  );
  const previousAvgRisk = Math.round(
    average(history.slice(0, FORECAST_DAYS).map((point) => point.avgRisk)),
  );
  const slope = regressionSlope(history.map((point) => point.avgRisk));
  const predictedAvgRisk = clampScore(currentAvgRisk + slope * FORECAST_DAYS);
  const predictedLevel = riskLevelFromScore(predictedAvgRisk);
  const highRiskRate = recentOps.length
    ? recentOps.filter((op) => op.risk_level === "high" || op.risk_level === "critical").length /
      recentOps.length
    : 0;
  const projectedVolume = Math.round((recentOps.length / FORECAST_DAYS) * FORECAST_DAYS);
  const projectedHighRisk = Math.round(projectedVolume * highRiskRate);
  const projectedExposure =
    (recentOps.reduce((sum, op) => sum + Number(op.amount), 0) / FORECAST_DAYS) * FORECAST_DAYS;
  const confidence = Math.min(95, Math.max(45, Math.round(45 + Math.min(50, ops.length * 1.5))));
  const trendDelta = predictedAvgRisk - currentAvgRisk;
  const trendLabel =
    trendDelta > 3 ? "Hausse probable" : trendDelta < -3 ? "Baisse probable" : "Risque stable";

  const forecastData = [
    ...history.map((point) => ({
      date: point.date,
      avgRisk: point.avgRisk,
      forecastRisk: null as number | null,
    })),
    ...Array.from({ length: FORECAST_DAYS }, (_, index) => ({
      date: format(addDays(today, index + 1), "MMM d"),
      avgRisk: null as number | null,
      forecastRisk: clampScore(currentAvgRisk + slope * (index + 1)),
    })),
  ];

  const pairMap = new Map<string, number>();
  recentOps.forEach((op) => {
    const pair = `${op.buy_currency}/${op.sell_currency}`;
    pairMap.set(pair, (pairMap.get(pair) ?? 0) + 1);
  });
  const topPair = Array.from(pairMap.entries()).sort((a, b) => b[1] - a[1])[0];

  const recommendations = [
    trendDelta > 3
      ? "Renforcer la revue des opérations entrantes cette semaine."
      : "Maintenir le niveau de contrôle actuel sur les opérations en attente.",
    projectedHighRisk > 0
      ? `Prévoir ${projectedHighRisk} opération(s) à haut risque sur 7 jours.`
      : "Aucun volume haut risque significatif prévu sur 7 jours.",
    topPair
      ? `Surveiller la paire ${topPair[0]}, la plus active récemment.`
      : "Historique insuffisant par paire.",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Prédiction des risques</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Prévision heuristique à 7 jours basée sur l'historique récent des opérations FX.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <ForecastCard
          icon={BrainCircuit}
          label="Risque moyen prévu"
          value={`${predictedAvgRisk}/100`}
          sub="Prévision 7 jours"
          tone="primary"
        />
        <ForecastCard
          icon={TrendingUp}
          label="Tendance"
          value={trendLabel}
          sub={`${trendDelta >= 0 ? "+" : ""}${trendDelta} pts`}
          tone="warning"
        />
        <ForecastCard
          icon={AlertTriangle}
          label="Haut risque prévu"
          value={projectedHighRisk.toString()}
          sub="Sur 7 jours"
          tone="critical"
        />
        <ForecastCard
          icon={Wallet}
          label="Exposition prévue"
          value={formatCurrency(projectedExposure)}
          sub="Projection court terme"
          tone="info"
        />
        <ForecastCard
          icon={Activity}
          label="Confiance"
          value={`${confidence}%`}
          sub={`${ops.length} opérations analysées`}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="stat-card lg:col-span-2">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-display font-semibold">Projection du score de risque</h3>
              <p className="text-xs text-muted-foreground">
                Historique 14 jours et prévision des 7 prochains jours
              </p>
            </div>
            <RiskBadge level={predictedLevel} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="avgRisk"
                name="Risque observé"
                stroke="var(--primary-glow)"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecastRisk"
                name="Risque prévu"
                stroke="var(--risk-high)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <h3 className="font-display font-semibold">Recommandations prédictives</h3>
          </div>
          <div className="space-y-3">
            {recommendations.map((recommendation) => (
              <div
                key={recommendation}
                className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm"
              >
                {recommendation}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Ce module utilise une tendance statistique simple. Il complète le scoring automatique,
            sans remplacer la validation métier.
          </p>
        </div>
      </div>
    </div>
  );
}

function ForecastCard({
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
  tone: "primary" | "warning" | "critical" | "info" | "success";
}) {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    critical: "bg-risk-critical/10 text-risk-critical",
    info: "bg-info/10 text-info",
    success: "bg-success/10 text-success",
  }[tone];

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-xl sm:text-2xl font-display font-bold mt-2 tabular-nums">{value}</p>
        </div>
        <div className={`h-9 w-9 rounded-md flex items-center justify-center ${toneCls}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{sub}</p>
    </div>
  );
}
