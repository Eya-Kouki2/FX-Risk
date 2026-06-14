export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type OpStatus = "draft" | "pending" | "validated" | "rejected" | "escalated" | "settled";

export const riskMeta: Record<RiskLevel, { label: string; className: string; bar: string }> = {
  low: {
    label: "Low",
    className: "bg-risk-low/10 text-risk-low border-risk-low/30",
    bar: "bg-risk-low",
  },
  moderate: {
    label: "Moderate",
    className: "bg-risk-moderate/10 text-risk-moderate border-risk-moderate/30",
    bar: "bg-risk-moderate",
  },
  high: {
    label: "High",
    className: "bg-risk-high/10 text-risk-high border-risk-high/30",
    bar: "bg-risk-high",
  },
  critical: {
    label: "Critical",
    className: "bg-risk-critical/10 text-risk-critical border-risk-critical/40",
    bar: "bg-risk-critical",
  },
};

export const statusMeta: Record<OpStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/30" },
  validated: { label: "Validated", className: "bg-success/10 text-success border-success/30" },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/30",
  },
  escalated: {
    label: "Escalated",
    className: "bg-risk-critical/10 text-risk-critical border-risk-critical/30",
  },
  settled: { label: "Settled", className: "bg-info/10 text-info border-info/30" },
};

export function formatCurrency(amount: number, currency = "EUR") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export type RiskRecommendationTone = "info" | "warning" | "critical" | "success";

export type RiskRecommendation = {
  label: string;
  tone: RiskRecommendationTone;
};

type RecommendationOperation = {
  amount: number | string;
  buy_currency: string;
  sell_currency: string;
  created_at: string;
  exchange_rate: number | string;
  market_rate: number | string | null;
  risk_level: RiskLevel;
  risk_score: number;
  swift_reference: string | null;
};

const COMMON_PAIRS = new Set([
  "EUR/USD",
  "USD/EUR",
  "USD/JPY",
  "GBP/USD",
  "USD/GBP",
  "USD/CHF",
  "EUR/GBP",
  "EUR/JPY",
]);

export function getRiskRecommendations(op: RecommendationOperation): RiskRecommendation[] {
  const recommendations: RiskRecommendation[] = [];
  const amount = Number(op.amount);
  const exchangeRate = Number(op.exchange_rate);
  const marketRate = op.market_rate ? Number(op.market_rate) : null;
  const pair = `${op.buy_currency}/${op.sell_currency}`;
  const createdHour = new Date(op.created_at).getHours();

  if (!op.swift_reference?.trim()) {
    recommendations.push({ label: "Demander confirmation SWIFT", tone: "critical" });
  } else if (!/^[A-Z]{6}[A-Z0-9]{2,5}$/.test(op.swift_reference)) {
    recommendations.push({ label: "Vérifier le format SWIFT", tone: "warning" });
  }

  if (amount > 1_000_000) {
    recommendations.push({ label: "Contrôler autorisation montant élevé", tone: "warning" });
  }

  if (marketRate && marketRate > 0 && Math.abs(exchangeRate - marketRate) / marketRate > 0.02) {
    recommendations.push({ label: "Justifier l'écart de taux", tone: "warning" });
  }

  if (createdHour < 7 || createdHour >= 20) {
    recommendations.push({ label: "Vérifier opération hors horaires", tone: "warning" });
  }

  if (!COMMON_PAIRS.has(pair)) {
    recommendations.push({ label: "Revoir paire de devises inhabituelle", tone: "info" });
  }

  if (op.risk_level === "critical" || op.risk_score > 60) {
    recommendations.unshift({ label: "Revue renforcée avant décision", tone: "critical" });
  }

  return recommendations.length
    ? recommendations
    : [{ label: "Validation standard possible", tone: "success" }];
}
