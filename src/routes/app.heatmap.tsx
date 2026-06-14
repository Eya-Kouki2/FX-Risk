import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { riskMeta } from "@/lib/risk";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

export const Route = createFileRoute("/app/heatmap")({
  component: HeatmapPage,
});

type Cell = {
  prob: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High";
  severity: "low" | "moderate" | "high" | "critical";
  count: number;
};

const PROB = ["Low", "Medium", "High"] as const;
const IMPACT = ["Low", "Medium", "High"] as const;

// severity matrix [prob][impact]
const SEVERITY: Record<string, "low" | "moderate" | "high" | "critical"> = {
  "Low|Low": "low",
  "Low|Medium": "low",
  "Low|High": "moderate",
  "Medium|Low": "low",
  "Medium|Medium": "moderate",
  "Medium|High": "high",
  "High|Low": "moderate",
  "High|Medium": "high",
  "High|High": "critical",
};

function classifyProb(score: number): "Low" | "Medium" | "High" {
  return score < 30 ? "Low" : score < 60 ? "Medium" : "High";
}
function classifyImpact(amount: number): "Low" | "Medium" | "High" {
  return amount < 250000 ? "Low" : amount < 1000000 ? "Medium" : "High";
}

function HeatmapPage() {
  // 🔴 Realtime: auto-refresh matrix on any operation change
  useRealtimeInvalidate("operations", [["heatmap-ops"]]);

  const { data: ops = [] } = useQuery({
    queryKey: ["heatmap-ops"],
    queryFn: async () => {
      const { data } = await supabase
        .from("operations")
        .select(
          "risk_score, amount, risk_level, client_name, operation_ref, buy_currency, sell_currency",
        );
      return data ?? [];
    },
  });

  const matrix: Cell[][] = PROB.map((p) =>
    IMPACT.map((i) => ({
      prob: p,
      impact: i,
      severity: SEVERITY[`${p}|${i}`],
      count: ops.filter(
        (o) => classifyProb(o.risk_score) === p && classifyImpact(Number(o.amount)) === i,
      ).length,
    })),
  );

  const top = [...ops].sort((a, b) => b.risk_score - a.risk_score).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Cartographie des risques</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Distribution Probabilité × Impact sur le portefeuille FX
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="stat-card lg:col-span-2">
          <h3 className="font-display font-semibold mb-4">Matrice de risques</h3>
          <div className="flex">
            <div
              className="flex flex-col-reverse justify-around pr-3 text-xs text-muted-foreground writing-vertical-rl"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              Probabilité →
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-2">
                {[...matrix].reverse().map((row, ri) =>
                  row.map((cell, ci) => {
                    const m = riskMeta[cell.severity];
                    return (
                      <div
                        key={`${ri}-${ci}`}
                        className={`aspect-square rounded-lg border ${m.className} flex flex-col items-center justify-center transition-transform hover:scale-105`}
                      >
                        <div className="text-3xl font-display font-bold">{cell.count}</div>
                        <div className="text-xs uppercase tracking-wide mt-1">{m.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          P:{cell.prob} · I:{cell.impact}
                        </div>
                      </div>
                    );
                  }),
                )}
              </div>
              <div className="grid grid-cols-3 mt-3 text-xs text-muted-foreground text-center">
                {IMPACT.map((i) => (
                  <div key={i}>{i}</div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground text-center mt-1">Impact →</div>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <h3 className="font-display font-semibold mb-3">Opérations les plus risquées</h3>
          <div className="space-y-2">
            {top.map((o, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{o.client_name}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {o.operation_ref} · {o.buy_currency}/{o.sell_currency}
                  </div>
                </div>
                <div
                  className={`text-sm font-mono font-bold ${
                    o.risk_level === "critical"
                      ? "text-risk-critical"
                      : o.risk_level === "high"
                        ? "text-risk-high"
                        : o.risk_level === "moderate"
                          ? "text-risk-moderate"
                          : "text-risk-low"
                  }`}
                >
                  {o.risk_score}
                </div>
              </div>
            ))}
            {!top.length && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Pas encore de données
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
