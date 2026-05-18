import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RiskBadge, StatusBadge, RiskBar } from "@/components/risk-indicators";
import { formatCurrency, type OpStatus, type RiskLevel } from "@/lib/risk";
import { format } from "date-fns";
import { toast } from "sonner";
import { logAudit, useSession } from "@/lib/auth";
import { AlertTriangle, CheckCircle2, XCircle, Edit3, Save } from "lucide-react";

interface Props {
  operationId: string | null;
  onClose: () => void;
}

export function OperationDetailDialog({ operationId, onClose }: Props) {
  const { user } = useSession();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ exchange_rate: "", swift_reference: "", comments: "", rejection_reason: "" });

  const { data: op } = useQuery({
    queryKey: ["operation", operationId],
    queryFn: async () => {
      if (!operationId) return null;
      const { data } = await supabase.from("operations").select("*").eq("id", operationId).single();
      return data;
    },
    enabled: !!operationId,
  });

  const { data: opAlerts = [] } = useQuery({
    queryKey: ["operation-alerts", operationId],
    queryFn: async () => {
      if (!operationId) return [];
      const { data } = await supabase.from("alerts").select("*").eq("operation_id", operationId).order("created_at");
      return data ?? [];
    },
    enabled: !!operationId,
  });

  useEffect(() => {
    if (op) {
      setForm({
        exchange_rate: String(op.exchange_rate ?? ""),
        swift_reference: op.swift_reference ?? "",
        comments: op.comments ?? "",
        rejection_reason: "",
      });
      setEditing(false);
    }
  }, [op]);

  if (!operationId) return null;

  const isOwner = op && user?.id === op.created_by;
  const canCorrect = op && isOwner && op.status === "rejected";
  const canValidate = op && (user?.role === "back_office" || user?.role === "manager" || user?.role === "admin")
    && (op.status === "pending" || op.status === "escalated");

  const resubmit = async () => {
    if (!op) return;
    const { error } = await supabase.from("operations").update({
      exchange_rate: Number(form.exchange_rate),
      swift_reference: form.swift_reference || null,
      comments: form.comments || null,
      status: "pending",
      rejection_reason: null,
    }).eq("id", op.id);
    if (error) return toast.error(error.message);
    await logAudit("correct_and_resubmit", "operations", { ref: op.operation_ref });
    toast.success(`Opération ${op.operation_ref} corrigée et resoumise`);
    qc.invalidateQueries();
    onClose();
  };

  const act = async (status: "validated" | "rejected" | "escalated") => {
    if (!op) return;
    const update: any = { status };
    if (status === "validated") {
      update.validated_by = user?.id;
      update.validated_at = new Date().toISOString();
    }
    if (status === "rejected") {
      update.rejection_reason = form.rejection_reason || "Examen de conformité requis";
    }
    const { error } = await supabase.from("operations").update(update).eq("id", op.id);
    if (error) return toast.error(error.message);
    await logAudit(`${status}_operation`, "operations", { ref: op.operation_ref });
    toast.success(`Opération ${op.operation_ref} ${status === "validated" ? "validée" : status === "rejected" ? "rejetée" : "escaladée"}`);
    qc.invalidateQueries();
    onClose();
  };

  return (
    <Dialog open={!!operationId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {!op ? (
          <div className="py-12 text-center text-muted-foreground">Chargement…</div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 flex-wrap">
                <DialogTitle className="font-mono text-base">{op.operation_ref}</DialogTitle>
                <RiskBadge level={op.risk_level as RiskLevel} />
                <StatusBadge status={op.status as OpStatus} />
              </div>
              <DialogDescription>
                Créée le {format(new Date(op.created_at), "PPpp")} · {op.client_name}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <Info label="Contrepartie" value={op.counterparty} />
              <Info label="Paire" value={`${op.buy_currency}/${op.sell_currency}`} mono />
              <Info label="Montant" value={formatCurrency(Number(op.amount), op.buy_currency)} />
              <Info label="Taux de change" value={Number(op.exchange_rate).toFixed(4)} mono />
              <Info label="Taux de marché" value={op.market_rate ? Number(op.market_rate).toFixed(4) : "—"} mono />
              <Info label="Date valeur" value={format(new Date(op.value_date), "PP")} />
              <Info label="SWIFT" value={op.swift_reference || "Manquant"} mono danger={!op.swift_reference} />
              <Info label="Score de risque" value={`${op.risk_score}/100`} />
              <Info label="Validé par" value={op.validated_by ? "✓" : "—"} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase">Indicateur de risque</Label>
              <RiskBar score={op.risk_score} />
            </div>

            {op.comments && (
              <div className="text-sm bg-muted/40 rounded-md p-3 border border-border">
                <div className="text-xs text-muted-foreground uppercase mb-1">Commentaires</div>
                {op.comments}
              </div>
            )}

            {op.rejection_reason && (
              <div className="text-sm bg-destructive/10 rounded-md p-3 border border-destructive/30">
                <div className="text-xs text-destructive uppercase mb-1 font-semibold">Motif de rejet</div>
                {op.rejection_reason}
              </div>
            )}

            <div>
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Alertes ({opAlerts.length})
              </h3>
              {opAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune alerte déclenchée.</p>
              ) : (
                <ul className="space-y-1.5">
                  {opAlerts.map((a) => (
                    <li key={a.id} className="text-sm flex items-start gap-2 p-2 rounded-md border border-border bg-muted/20">
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium">{a.category}</span>
                        <span className="text-xs text-muted-foreground ml-2">{a.severity}</span>
                        <p className="text-xs text-muted-foreground">{a.message}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {canCorrect && (
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-sm">Processus de correction</h3>
                  {!editing && (
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                      <Edit3 className="h-3.5 w-3.5 mr-1.5" /> Corriger
                    </Button>
                  )}
                </div>
                {editing && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Exchange rate</Label>
                        <Input type="number" step="0.0001" value={form.exchange_rate} onChange={(e) => setForm((f) => ({ ...f, exchange_rate: e.target.value }))} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">SWIFT reference</Label>
                        <Input value={form.swift_reference} onChange={(e) => setForm((f) => ({ ...f, swift_reference: e.target.value.toUpperCase() }))} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Commentaires</Label>
                      <Textarea rows={2} value={form.comments} onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {canValidate && (
              <div className="border-t border-border pt-4 space-y-2">
                <Label className="text-xs">Motif de rejet (si refus)</Label>
                <Input value={form.rejection_reason} onChange={(e) => setForm((f) => ({ ...f, rejection_reason: e.target.value }))} placeholder="ex: Référence SWIFT invalide" />
              </div>
            )}

            <DialogFooter className="gap-2 flex-wrap">
              {canCorrect && editing && (
                <Button onClick={resubmit}><Save className="h-4 w-4 mr-1.5" /> Resoumettre</Button>
              )}
              {canValidate && (
                <>
                  <Button variant="destructive" size="sm" onClick={() => act("rejected")}>
                    <XCircle className="h-4 w-4 mr-1.5" /> Rejeter
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => act("escalated")}>
                    <AlertTriangle className="h-4 w-4 mr-1.5" /> Escalader
                  </Button>
                  <Button size="sm" onClick={() => act("validated")}>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Valider
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={onClose}>Fermer</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value, mono, danger }: { label: string; value: string; mono?: boolean; danger?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`mt-0.5 ${mono ? "font-mono text-sm" : "text-sm font-medium"} ${danger ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}
