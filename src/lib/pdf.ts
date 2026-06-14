import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { formatCurrency } from "./risk";

type Op = {
  operation_ref: string;
  client_name: string;
  counterparty: string;
  buy_currency: string;
  sell_currency: string;
  amount: number | string;
  exchange_rate: number | string;
  value_date: string;
  status: string;
  risk_score: number;
  risk_level: string;
  swift_reference: string | null;
  created_at: string;
};

type Alert = {
  category: string;
  severity: string;
  message: string;
  acknowledged: boolean;
  created_at: string;
};

function header(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFillColor(15, 31, 64);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("FX Risk Platform", 14, 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Operational Risk Management — Spot FX", 14, 16);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 32);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.text(subtitle ?? `Generated ${format(new Date(), "PPpp")}`, 14, 38);
  doc.setTextColor(0, 0, 0);
}

function footer(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text("Confidential — internal risk supervision", 14, h - 8);
    doc.text(`Page ${i} / ${pageCount}`, w - 24, h - 8);
  }
}

export function exportOperationsPdf(ops: Op[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  header(
    doc,
    "Operations Report",
    `${ops.length} operations · generated ${format(new Date(), "PPpp")}`,
  );

  const totalExposure = ops.reduce((s, o) => s + Number(o.amount), 0);
  const critical = ops.filter((o) => o.risk_level === "critical").length;
  const validated = ops.filter((o) => o.status === "validated").length;

  doc.setFontSize(9);
  doc.text(
    `Total exposure: ${formatCurrency(totalExposure)}    Critical: ${critical}    Validated: ${validated}`,
    14,
    44,
  );

  autoTable(doc, {
    startY: 50,
    head: [["Ref", "Client", "Pair", "Amount", "Rate", "Value date", "Status", "Risk", "Score"]],
    body: ops.map((o) => [
      o.operation_ref,
      o.client_name,
      `${o.buy_currency}/${o.sell_currency}`,
      formatCurrency(Number(o.amount), o.buy_currency),
      Number(o.exchange_rate).toFixed(4),
      format(new Date(o.value_date), "yyyy-MM-dd"),
      o.status,
      o.risk_level,
      String(o.risk_score),
    ]),
    headStyles: { fillColor: [15, 31, 64], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  footer(doc);
  doc.save(`fx-operations-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function exportAlertsPdf(alerts: Alert[]) {
  const doc = new jsPDF();
  header(doc, "Alerts Report", `${alerts.length} alerts · grouped by severity`);

  const bySev = ["critical", "high", "moderate", "informational"];
  const counts = Object.fromEntries(
    bySev.map((s) => [s, alerts.filter((a) => a.severity === s).length]),
  );
  doc.setFontSize(9);
  doc.text(
    `Critical: ${counts.critical}    High: ${counts.high}    Moderate: ${counts.moderate}    Info: ${counts.informational}`,
    14,
    44,
  );

  autoTable(doc, {
    startY: 50,
    head: [["Severity", "Category", "Message", "Status", "Created"]],
    body: alerts.map((a) => [
      a.severity.toUpperCase(),
      a.category,
      a.message,
      a.acknowledged ? "Acknowledged" : "Active",
      format(new Date(a.created_at), "yyyy-MM-dd HH:mm"),
    ]),
    headStyles: { fillColor: [15, 31, 64], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 2: { cellWidth: 70 } },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  footer(doc);
  doc.save(`fx-alerts-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function exportAuditPdf(
  logs: Array<{
    user_email: string | null;
    action: string;
    module: string;
    result: string;
    created_at: string;
  }>,
) {
  const doc = new jsPDF();
  header(doc, "Audit Summary", `${logs.length} events`);
  autoTable(doc, {
    startY: 44,
    head: [["Timestamp", "User", "Module", "Action", "Result"]],
    body: logs.map((l) => [
      format(new Date(l.created_at), "yyyy-MM-dd HH:mm"),
      l.user_email ?? "—",
      l.module,
      l.action,
      l.result,
    ]),
    headStyles: { fillColor: [15, 31, 64], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });
  footer(doc);
  doc.save(`fx-audit-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
