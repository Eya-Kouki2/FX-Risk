import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, type RiskLevel, type OpStatus } from "@/lib/risk";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  Activity,
  ArrowRightLeft,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OperationDetailDialog } from "@/components/operation-detail-dialog";
import { RiskBadge, StatusBadge } from "@/components/risk-indicators";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";

export const Route = createFileRoute("/app/clients/$clientId")({
  component: ClientProfile,
});

function ClientProfile() {
  const { clientId } = Route.useParams();
  const queryClient = useQueryClient();

  // 🔴 Realtime: refresh this client's transactions on any change
  useRealtimeInvalidate(
    "operations",
    [["client-operations", clientId]],
    `client_id=eq.${clientId}`,
  );

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"particulier" | "societe">("particulier");
  const [editCin, setEditCin] = useState("");
  const [editMf, setEditMf] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [openOpId, setOpenOpId] = useState<string | null>(null);

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: ops = [], isLoading: opsLoading } = useQuery({
    queryKey: ["client-operations", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operations")
        .select(
          `
          id,
          operation_ref,
          buy_currency,
          sell_currency,
          amount,
          exchange_rate,
          value_date,
          status,
          risk_score,
          risk_level,
          created_at
        `,
        )
        .eq("client_id", clientId)
        .eq("status", "validated")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (client) {
      setEditName(client.name || "");
      setEditType((client.client_type as "particulier" | "societe") || "particulier");
      setEditCin(client.cin || "");
      setEditMf(client.matricule_fiscal || "");
    }
  }, [client]);

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error("Le nom du client est requis.");
      return;
    }
    setIsSaving(true);
    try {
      const { error: clientError } = await supabase
        .from("clients")
        .update({
          name: editName,
          client_type: editType,
          cin: editType === "particulier" ? editCin || null : null,
          matricule_fiscal: editType === "societe" ? editMf || null : null,
        })
        .eq("id", clientId);

      if (clientError) throw clientError;

      // Update the client_name in the operations table for consistency
      const { error: opsError } = await supabase
        .from("operations")
        .update({
          client_name: editName,
        })
        .eq("client_id", clientId);

      if (opsError) throw opsError;

      toast.success("Client mis à jour avec succès.");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-operations", clientId] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  };

  if (clientLoading || opsLoading)
    return <div className="p-8 text-center text-muted-foreground">Chargement...</div>;
  if (!client) return <div className="p-8 text-center text-destructive">Client introuvable.</div>;

  const totalVol = ops.reduce((sum, op) => sum + Number(op.amount), 0);
  const avgRisk =
    ops.length > 0 ? Math.round(ops.reduce((sum, op) => sum + op.risk_score, 0) / ops.length) : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="-ml-3 text-muted-foreground self-start"
        >
          <Link to="/app/clients">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'annuaire
          </Link>
        </Button>
      </div>

      <div className="stat-card p-6 space-y-4">
        {!isEditing ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 text-2xl">
                {client.client_type === "societe" ? "🏢" : "👤"}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-display font-bold">{client.name}</h1>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      client.client_type === "societe"
                        ? "bg-blue-500/10 text-blue-500"
                        : "bg-green-500/10 text-green-600"
                    }`}
                  >
                    {client.client_type === "societe" ? "Société" : "Particulier"}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    {client.client_type === "particulier" ? (
                      <>
                        CIN :{" "}
                        <strong className="text-foreground">{client.cin || "Non renseigné"}</strong>
                      </>
                    ) : (
                      <>
                        Matricule Fiscal :{" "}
                        <strong className="text-foreground">
                          {client.matricule_fiscal || "Non renseigné"}
                        </strong>
                      </>
                    )}
                  </span>
                  <span>•</span>
                  <span>Inscrit le {format(new Date(client.created_at), "dd/MM/yyyy")}</span>
                </div>
              </div>
            </div>
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              <Edit2 className="w-4 h-4 mr-2" /> Modifier
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-display font-semibold text-lg">Modifier le profil client</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Nom / Raison Sociale</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ex: Ali Ben Salah ou Société XYZ"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-type">Type de client</Label>
                <Select
                  value={editType}
                  onValueChange={(val: "particulier" | "societe") => setEditType(val)}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particulier">👤 Particulier</SelectItem>
                    <SelectItem value="societe">🏢 Société</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editType === "particulier" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="edit-cin">Numéro de CIN</Label>
                  <Input
                    id="edit-cin"
                    value={editCin}
                    onChange={(e) => setEditCin(e.target.value)}
                    placeholder="Ex: 01234567"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="edit-mf">Matricule Fiscal</Label>
                  <Input
                    id="edit-mf"
                    value={editMf}
                    onChange={(e) => setEditMf(e.target.value)}
                    placeholder="Ex: 1234567B/P/A/000"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSaving}>
                <X className="w-4 h-4 mr-2" /> Annuler
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Check className="w-4 h-4 mr-2" /> Enregistrer
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <ArrowRightLeft className="w-4 h-4" />
            <h3 className="font-medium text-sm uppercase tracking-wider">Total Opérations</h3>
          </div>
          <div className="text-3xl font-bold font-display">{ops.length}</div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="w-4 h-4" />
            <h3 className="font-medium text-sm uppercase tracking-wider">Volume Transigé</h3>
          </div>
          <div className="text-3xl font-bold font-display text-primary">
            {formatCurrency(totalVol)} $
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Activity className="w-4 h-4" />
            <h3 className="font-medium text-sm uppercase tracking-wider">Score de Risque Moyen</h3>
          </div>
          <div className="text-3xl font-bold font-display flex items-baseline gap-2">
            {avgRisk}
            <span className="text-sm font-medium text-muted-foreground">/ 100</span>
          </div>
        </div>
      </div>

      <div className="stat-card p-0 overflow-hidden">
        <div className="p-4 sm:px-6 py-4 border-b bg-muted/20 flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">Transactions validées</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            Seulement les opérations validées
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Référence</th>
                <th className="px-6 py-4 font-medium">Paire</th>
                <th className="px-6 py-4 font-medium text-right">Montant</th>
                <th className="px-6 py-4 font-medium text-center">Risque</th>
                <th className="px-6 py-4 font-medium text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Aucune transaction validée pour ce client.
                  </td>
                </tr>
              ) : (
                ops.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setOpenOpId(o.id)}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3 whitespace-nowrap text-muted-foreground">
                      {format(new Date(o.created_at), "dd MMM yyyy")}
                    </td>
                    <td className="px-6 py-3 font-medium">{o.operation_ref}</td>
                    <td className="px-6 py-3">
                      <span className="font-medium">{o.buy_currency}</span> / {o.sell_currency}
                    </td>
                    <td className="px-6 py-3 text-right font-medium">
                      {formatCurrency(Number(o.amount))}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <RiskBadge level={o.risk_level as RiskLevel} />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <StatusBadge status={o.status as OpStatus} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OperationDetailDialog operationId={openOpId} onClose={() => setOpenOpId(null)} />
    </div>
  );
}
