import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/risk-indicators";
import { formatCurrency, type RiskLevel } from "@/lib/risk";
import { CheckCircle2, XCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { logAudit, useSession } from "@/lib/auth";

export const Route = createFileRoute("/app/approvals")({
  component: ApprovalQueue,
});

function ApprovalQueue() {
  const { user } = useSession();
  const qc = useQueryClient();

  const { data: ops = [] } = useQuery({
    queryKey: ["escalated-ops"],
    queryFn: async () => {
      const { data } = await supabase.from("operations").select("*")
        .or("status.eq.escalated,and(status.eq.pending,risk_level.eq.critical)")
        .order("risk_score", { ascending: false });
      return data ?? [];
    },
  });

  const act = async (id: string, status: "validated" | "rejected", ref: string) => {
    const { error } = await supabase.from("operations").update({
      status, validated_by: user?.id, validated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return toast.error(error.message);
    await logAudit(`manager_${status}`, "approvals", { ref });
    toast.success(`Décision enregistrée pour ${ref}`);
    qc.invalidateQueries({ queryKey: ["escalated-ops"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">File d'approbation</h1>
        <p className="text-sm text-muted-foreground mt-1">Opérations critiques et escaladées en attente de décision managériale</p>
      </div>

      <div className="space-y-3">
        {ops.map((o) => (
          <div key={o.id} className="stat-card border-l-4 border-l-risk-critical">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">{o.operation_ref}</span>
                  <RiskBadge level={o.risk_level as RiskLevel} />
                  <span className="text-xs text-muted-foreground">Score {o.risk_score}/100</span>
                </div>
                <div className="font-display font-semibold text-lg">{o.client_name}</div>
                <div className="text-sm text-muted-foreground">
                  {o.buy_currency}/{o.sell_currency} · {formatCurrency(Number(o.amount), o.buy_currency)} · {o.counterparty}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost"><Search className="h-4 w-4 mr-1.5" /> Investiguer</Button>
                <Button size="sm" onClick={() => act(o.id, "validated", o.operation_ref)}>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Approuver
                </Button>
                <Button size="sm" variant="destructive" onClick={() => act(o.id, "rejected", o.operation_ref)}>
                  <XCircle className="h-4 w-4 mr-1.5" /> Rejeter
                </Button>
              </div>
            </div>
          </div>
        ))}
        {!ops.length && <div className="stat-card text-center text-muted-foreground py-12">Aucune escalade en attente.</div>}
      </div>
    </div>
  );
}
