import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiskBadge, RiskBar } from "@/components/risk-indicators";
import {
  formatCurrency,
  getRiskRecommendations,
  type RiskLevel,
  type RiskRecommendationTone,
} from "@/lib/risk";
import { CheckCircle2, XCircle, AlertTriangle, Search } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { logAudit, useSession } from "@/lib/auth";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

export const Route = createFileRoute("/app/validation")({
  component: ValidationQueue,
});

const recommendationToneClass: Record<RiskRecommendationTone, string> = {
  critical: "border-risk-critical/30 bg-risk-critical/10 text-risk-critical",
  warning: "border-warning/30 bg-warning/10 text-warning",
  info: "border-info/30 bg-info/10 text-info",
  success: "border-success/30 bg-success/10 text-success",
};

function ValidationQueue() {
  const { user } = useSession();
  const qc = useQueryClient();
  const canAct = user?.role !== "front_office";
  const [search, setSearch] = useState("");

  // 🔴 Realtime: auto-refresh when operations are submitted or validated
  useRealtimeInvalidate("operations", [["validation-ops"]]);

  const { data: ops = [] } = useQuery({
    queryKey: ["validation-ops"],
    queryFn: async () => {
      const { data } = await supabase
        .from("operations")
        .select("*")
        .eq("status", "pending")
        .order("risk_score", { ascending: false });
      return data ?? [];
    },
  });

  const act = async (id: string, status: "validated" | "rejected", ref: string) => {
    const update: { status: typeof status; validated_by?: string; validated_at?: string } = {
      status,
    };
    if (status === "validated") {
      update.validated_by = user?.id;
      update.validated_at = new Date().toISOString();
    }
    const { error } = await supabase.from("operations").update(update).eq("id", id);
    if (error) return toast.error(error.message);
    await logAudit(`${status}_operation`, "validation", { ref });
    toast.success(`Opération ${ref} ${status === "validated" ? "validée" : "rejetée"}`);
    qc.invalidateQueries({ queryKey: ["validation-ops"] });
  };

  const normalizedSearch = search.trim().toLowerCase();
  const filteredOps = normalizedSearch
    ? ops.filter((o) =>
        [
          o.operation_ref,
          o.client_name,
          o.counterparty,
          o.buy_currency,
          o.sell_currency,
          `${o.buy_currency}/${o.sell_currency}`,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch)),
      )
    : ops;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">File de validation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Examiner les opérations en attente · triées par score de risque
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex w-full justify-end">
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher opération..."
              className="h-9 pl-9"
            />
          </div>
        </div>
        {filteredOps.map((o) => (
          <div key={o.id} className="stat-card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-3 flex-1 min-w-[280px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">
                    {o.operation_ref}
                  </span>
                  <RiskBadge level={o.risk_level as RiskLevel} />
                  {!o.swift_reference && (
                    <span className="inline-flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3 w-3" /> SWIFT manquant
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-display font-semibold text-lg">{o.client_name}</span>
                  <span className="text-sm text-muted-foreground">via {o.counterparty}</span>
                </div>
                <div className="flex items-center gap-6 text-sm flex-wrap">
                  <div>
                    <span className="text-muted-foreground">Paire :</span>{" "}
                    <span className="font-mono">
                      {o.buy_currency}/{o.sell_currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Montant :</span>{" "}
                    {formatCurrency(Number(o.amount), o.buy_currency)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Taux :</span>{" "}
                    <span className="font-mono">{Number(o.exchange_rate).toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valeur :</span>{" "}
                    {format(new Date(o.value_date), "d MMM yyyy")}
                  </div>
                </div>
                {o.comments && (
                  <p className="text-sm text-muted-foreground italic">"{o.comments}"</p>
                )}
                <div className="max-w-xs">
                  <RiskBar score={o.risk_score} />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">Recommandations :</span>
                  {getRiskRecommendations(o)
                    .slice(0, 3)
                    .map((recommendation) => (
                      <span
                        key={recommendation.label}
                        className={`rounded-md border px-2.5 py-1 text-sm font-medium ${recommendationToneClass[recommendation.tone]}`}
                      >
                        {recommendation.label}
                      </span>
                    ))}
                </div>
              </div>
              {canAct && (
                <div className="flex flex-col gap-2 min-w-[140px]">
                  <Button size="sm" onClick={() => act(o.id, "validated", o.operation_ref)}>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Valider
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => act(o.id, "rejected", o.operation_ref)}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" /> Rejeter
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {!filteredOps.length && (
          <div className="stat-card text-center text-muted-foreground py-12">
            {ops.length
              ? "Aucune opération ne correspond à la recherche."
              : "File de validation vide."}
          </div>
        )}
      </div>
    </div>
  );
}
