export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type OpStatus = "draft" | "pending" | "validated" | "rejected" | "escalated" | "settled";

export const riskMeta: Record<RiskLevel, { label: string; className: string; bar: string }> = {
  low: { label: "Low", className: "bg-risk-low/10 text-risk-low border-risk-low/30", bar: "bg-risk-low" },
  moderate: { label: "Moderate", className: "bg-risk-moderate/10 text-risk-moderate border-risk-moderate/30", bar: "bg-risk-moderate" },
  high: { label: "High", className: "bg-risk-high/10 text-risk-high border-risk-high/30", bar: "bg-risk-high" },
  critical: { label: "Critical", className: "bg-risk-critical/10 text-risk-critical border-risk-critical/40", bar: "bg-risk-critical" },
};

export const statusMeta: Record<OpStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/30" },
  validated: { label: "Validated", className: "bg-success/10 text-success border-success/30" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/30" },
  escalated: { label: "Escalated", className: "bg-risk-critical/10 text-risk-critical border-risk-critical/30" },
  settled: { label: "Settled", className: "bg-info/10 text-info border-info/30" },
};

export function formatCurrency(amount: number, currency = "EUR") {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}
