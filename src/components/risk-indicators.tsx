import { riskMeta, statusMeta, type RiskLevel, type OpStatus } from "@/lib/risk";

export function RiskBadge({ level }: { level: RiskLevel }) {
  const m = riskMeta[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${m.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.bar}`} />
      {m.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: OpStatus }) {
  const m = statusMeta[status];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${m.className}`}
    >
      {m.label}
    </span>
  );
}

export function RiskBar({ score }: { score: number }) {
  const pct = Math.min(100, score);
  const level: RiskLevel =
    score <= 20 ? "low" : score <= 40 ? "moderate" : score <= 60 ? "high" : "critical";
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${riskMeta[level].bar} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono tabular-nums w-7 text-right">{score}</span>
    </div>
  );
}
