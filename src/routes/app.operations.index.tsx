import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RiskBadge, StatusBadge, RiskBar } from "@/components/risk-indicators";
import { OperationDetailDialog } from "@/components/operation-detail-dialog";
import { formatCurrency, type OpStatus, type RiskLevel } from "@/lib/risk";
import { Search, Plus, Filter } from "lucide-react";
import { format } from "date-fns";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/app/operations/")({
  component: OperationsList,
});

function OperationsList() {
  const { user } = useSession();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [risk, setRisk] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: ops = [], isLoading } = useQuery({
    queryKey: ["ops-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operations").select("*")
        .order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    return ops.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (risk !== "all" && o.risk_level !== risk) return false;
      if (q) {
        const t = q.toLowerCase();
        if (!o.client_name.toLowerCase().includes(t)
          && !o.operation_ref.toLowerCase().includes(t)
          && !o.counterparty.toLowerCase().includes(t)) return false;
      }
      return true;
    });
  }, [ops, q, status, risk]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Opérations FX</h1>
          <p className="text-sm text-muted-foreground mt-1">Toutes les transactions de change au comptant</p>
        </div>
        {(user?.role === "front_office" || user?.role === "admin") && (
          <Button asChild>
            <Link to="/app/operations/new"><Plus className="h-4 w-4 mr-2" />Nouvelle opération</Link>
          </Button>
        )}
      </div>

      <div className="stat-card !p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher par client, référence, contrepartie…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {(["draft","pending","validated","rejected","escalated","settled"] as const).map((s) => (
                <SelectItem key={s} value={s}>{{ draft: "Brouillon", pending: "En attente", validated: "Validé", rejected: "Rejeté", escalated: "Escaladé", settled: "Réglé" }[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={risk} onValueChange={setRisk}>
            <SelectTrigger><SelectValue placeholder="Risk level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les niveaux</SelectItem>
              {(["low","moderate","high","critical"] as const).map((s) => (
                <SelectItem key={s} value={s}>{{ low: "Faible", moderate: "Modéré", high: "Élevé", critical: "Critique" }[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="stat-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="text-left font-medium px-4 py-3">Ref</th>
                <th className="text-left font-medium px-4 py-3">Client</th>
                <th className="text-left font-medium px-4 py-3">Pair</th>
                <th className="text-right font-medium px-4 py-3">Amount</th>
                <th className="text-right font-medium px-4 py-3">Rate</th>
                <th className="text-left font-medium px-4 py-3">Value date</th>
                <th className="text-left font-medium px-4 py-3 min-w-[140px]">Risk</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">SWIFT</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} onClick={() => setOpenId(o.id)} className="border-t border-border hover:bg-muted/30 cursor-pointer">
                  <td className="px-4 py-3 font-mono text-xs">{o.operation_ref}</td>
                  <td className="px-4 py-3 font-medium">{o.client_name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{o.buy_currency}/{o.sell_currency}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(Number(o.amount), o.buy_currency)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">{Number(o.exchange_rate).toFixed(4)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(o.value_date), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <RiskBadge level={o.risk_level as RiskLevel} />
                      <RiskBar score={o.risk_score} />
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.status as OpStatus} /></td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {o.swift_reference ? <span className="text-success">{o.swift_reference}</span> : <span className="text-destructive">Manquant</span>}
                  </td>
                </tr>
              ))}
              {!filtered.length && !isLoading && (
                <tr><td colSpan={9} className="text-center text-muted-foreground py-12">Aucune opération ne correspond aux filtres.</td></tr>
              )}
              {isLoading && <tr><td colSpan={9} className="text-center text-muted-foreground py-12">Chargement…</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <OperationDetailDialog operationId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
