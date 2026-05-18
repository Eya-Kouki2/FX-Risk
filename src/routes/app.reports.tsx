import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet, FileDown } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/risk";
import { format } from "date-fns";
import { exportOperationsPdf, exportAlertsPdf, exportAuditPdf } from "@/lib/pdf";

export const Route = createFileRoute("/app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { data: ops = [] } = useQuery({
    queryKey: ["reports-ops"],
    queryFn: async () => (await supabase.from("operations").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: alerts = [] } = useQuery({
    queryKey: ["reports-alerts"],
    queryFn: async () => (await supabase.from("alerts").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: audit = [] } = useQuery({
    queryKey: ["reports-audit"],
    queryFn: async () => (await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500)).data ?? [],
  });

  const exportCsv = () => {
    const headers = ["operation_ref","client_name","buy_currency","sell_currency","amount","exchange_rate","value_date","counterparty","swift_reference","status","risk_score","risk_level","created_at"];
    const rows = ops.map((o) => headers.map((h) => JSON.stringify((o as any)[h] ?? "")).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `fx-operations-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Export CSV réussi");
  };

  const totalExposure = ops.reduce((s, o) => s + Number(o.amount), 0);
  const critical = ops.filter((o) => o.risk_level === "critical").length;
  const validated = ops.filter((o) => o.status === "validated").length;

  const reports = [
    {
      title: "Rapport des opérations",
      desc: "Grand livre des transactions avec scores de risque",
      icon: FileSpreadsheet,
      actions: [
        { label: "PDF", icon: FileDown, fn: () => { exportOperationsPdf(ops as any); toast.success("Export PDF réussi"); } },
        { label: "CSV", icon: Download, fn: exportCsv },
      ],
    },
    {
      title: "Rapport des alertes",
      desc: "Alertes de risque groupées par sévérité",
      icon: FileText,
      actions: [
        { label: "PDF", icon: FileDown, fn: () => { exportAlertsPdf(alerts as any); toast.success("Export PDF réussi"); } },
      ],
    },
    {
      title: "Rapport d'audit",
      desc: "Activité des utilisateurs et traçabilité opérationnelle",
      icon: FileText,
      actions: [
        { label: "PDF", icon: FileDown, fn: () => { exportAuditPdf(audit as any); toast.success("Export PDF réussi"); } },
      ],
    },
    {
      title: "Rapport d'exposition aux risques",
      desc: "Exposition agrégée par contrepartie",
      icon: FileText,
      actions: [
        { label: "CSV", icon: Download, fn: exportCsv },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Rapports</h1>
        <p className="text-sm text-muted-foreground mt-1">Exporter les données opérationnelles et les synthèses de risques</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Exposition totale</div>
          <div className="text-2xl font-display font-bold mt-2">{formatCurrency(totalExposure)}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Opérations critiques</div>
          <div className="text-2xl font-display font-bold mt-2 text-risk-critical">{critical}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Validées</div>
          <div className="text-2xl font-display font-bold mt-2 text-success">{validated}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <div key={r.title} className="stat-card flex items-start gap-4">
            <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <r.icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold">{r.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{r.desc}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {r.actions.map((a) => (
                  <Button key={a.label} size="sm" variant="outline" onClick={a.fn}>
                    <a.icon className="h-4 w-4 mr-1.5" /> {a.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
