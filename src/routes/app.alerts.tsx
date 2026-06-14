import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, BellOff, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { logAudit, useSession } from "@/lib/auth";
import { useRealtimeInvalidate } from "@/hooks/useRealtimeInvalidate";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app/alerts")({
  component: AlertsPage,
});

const SEV_ICON = {
  critical: AlertCircle,
  high: AlertTriangle,
  moderate: Bell,
  informational: Info,
} as const;
const SEV_CLS: Record<string, string> = {
  critical: "text-risk-critical bg-risk-critical/10 border-risk-critical/30",
  high: "text-risk-high bg-risk-high/10 border-risk-high/30",
  moderate: "text-risk-moderate bg-risk-moderate/10 border-risk-moderate/30",
  informational: "text-info bg-info/10 border-info/30",
};

type AlertWithOperation = Tables<"alerts"> & {
  operations: Pick<
    Tables<"operations">,
    "operation_ref" | "client_name" | "amount" | "buy_currency" | "sell_currency"
  > | null;
};

function AlertsPage() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");

  // 🔴 Realtime: auto-refresh when new alerts are generated or acknowledged
  useRealtimeInvalidate("alerts", [["alerts-full"]]);

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts-full"],
    queryFn: async () => {
      const { data } = await supabase
        .from("alerts")
        .select("*, operations(operation_ref, client_name, amount, buy_currency, sell_currency)")
        .order("created_at", { ascending: false })
        .limit(200);
      return (data ?? []) as AlertWithOperation[];
    },
  });

  const filtered =
    filter === "all"
      ? alerts
      : filter === "active"
        ? alerts.filter((a) => !a.acknowledged)
        : alerts.filter((a) => a.severity === filter);

  const ack = async (id: string) => {
    const { error } = await supabase
      .from("alerts")
      .update({
        acknowledged: true,
        acknowledged_by: user?.id,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    await logAudit("acknowledge_alert", "alerts", { id });
    toast.success("Alerte acquittée");
    qc.invalidateQueries({ queryKey: ["alerts-full"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Centre d'alertes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Notifications de risque opérationnel · générées automatiquement par le moteur de
            contrôle
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les alertes</SelectItem>
            <SelectItem value="active">Actives seulement</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
            <SelectItem value="high">Élevée</SelectItem>
            <SelectItem value="moderate">Modérée</SelectItem>
            <SelectItem value="informational">Informationnelle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filtered.map((a) => {
          const Icon = SEV_ICON[a.severity as keyof typeof SEV_ICON];
          const op = a.operations;
          return (
            <div
              key={a.id}
              className={`stat-card !p-4 flex items-start gap-3 border-l-4 ${
                a.severity === "critical"
                  ? "border-l-risk-critical"
                  : a.severity === "high"
                    ? "border-l-risk-high"
                    : a.severity === "moderate"
                      ? "border-l-risk-moderate"
                      : "border-l-info"
              } ${a.acknowledged ? "opacity-60" : ""}`}
            >
              <div
                className={`mt-0.5 h-8 w-8 rounded-md border flex items-center justify-center ${SEV_CLS[a.severity]}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{a.category}</span>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {a.severity}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {format(new Date(a.created_at), "MMM d, HH:mm")}
                  </span>
                  {op && (
                    <span className="text-xs font-mono text-muted-foreground">
                      · {op.operation_ref}
                    </span>
                  )}
                </div>
                <p className="text-sm mt-1">{a.message}</p>
                {op && <p className="text-xs text-muted-foreground mt-1">{op.client_name}</p>}
              </div>
              {!a.acknowledged &&
                (user?.role === "risk_team" ||
                  user?.role === "manager" ||
                  user?.role === "admin") && (
                  <Button size="sm" variant="outline" onClick={() => ack(a.id)}>
                    <BellOff className="h-4 w-4 mr-1.5" /> Acquitter
                  </Button>
                )}
            </div>
          );
        })}
        {!filtered.length && (
          <div className="stat-card text-center text-muted-foreground py-12">
            Aucune alerte ne correspond.
          </div>
        )}
      </div>
    </div>
  );
}
