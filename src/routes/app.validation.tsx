import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RiskBadge, RiskBar } from "@/components/risk-indicators";
import { formatCurrency, type RiskLevel } from "@/lib/risk";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { logAudit, useSession } from "@/lib/auth";

export const Route = createFileRoute("/app/validation")({
  component: ValidationQueue,
});

function ValidationQueue() {
  const { user } = useSession();
  const qc = useQueryClient();

  const { data: ops = [] } = useQuery({
    queryKey: ["pending-ops"],
    queryFn: async () => {
      const { data } = await supabase.from("operations").select("*")
        .eq("status", "pending")
        .order("risk_score", { ascending: false });
      return data ?? [];
    },
  });

  const act = async (id: string, status: "validated" | "rejected" | "escalated", ref: string) => {
    const update: { status: typeof status; validated_by?: string; validated_at?: string } = { status };
    if (status === "validated") {
      update.validated_by = user?.id;
      update.validated_at = new Date().toISOString();
    }
    const { error } = await supabase.from("operations").update(update).eq("id", id);
    if (error) return toast.error(error.message);
    await logAudit(`${status}_operation`, "validation", { ref });
    toast.success(`Opération ${ref} ${status === "validated" ? "validée" : status === "rejected" ? "rejetée" : "escaladée"}`);
    qc.invalidateQueries({ queryKey: ["pending-ops"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">File de validation</h1>
        <p className="text-sm text-muted-foreground mt-1">Examiner les opérations en attente · triées par score de risque</p>
      </div>

      <div className="space-y-3">
        {ops.map((o) => (
          <div key={o.id} className="stat-card">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-2 flex-1 min-w-[280px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">{o.operation_ref}</span>
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
                  <div><span className="text-muted-foreground">Paire :</span> <span className="font-mono">{o.buy_currency}/{o.sell_currency}</span></div>
                  <div><span className="text-muted-foreground">Montant :</span> {formatCurrency(Number(o.amount), o.buy_currency)}</div>
                  <div><span className="text-muted-foreground">Taux :</span> <span className="font-mono">{Number(o.exchange_rate).toFixed(4)}</span></div>
                  <div><span className="text-muted-foreground">Valeur :</span> {format(new Date(o.value_date), "d MMM yyyy")}</div>
                </div>
                {o.comments && <p className="text-sm text-muted-foreground italic">"{o.comments}"</p>}
                <div className="max-w-xs"><RiskBar score={o.risk_score} /></div>
              </div>
              {(user?.role === "back_office" || user?.role === "manager" || user?.role === "admin") && (
                <div className="flex flex-col gap-2 min-w-[140px]">
                  <Button size="sm" onClick={() => act(o.id, "validated", o.operation_ref)}>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Valider
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => act(o.id, "escalated", o.operation_ref)}>
                    <AlertTriangle className="h-4 w-4 mr-1.5" /> Escalader
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => act(o.id, "rejected", o.operation_ref)}>
                    <XCircle className="h-4 w-4 mr-1.5" /> Rejeter
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {!ops.length && <div className="stat-card text-center text-muted-foreground py-12">File de validation vide.</div>}
      </div>
    </div>
  );
}
