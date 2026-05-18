import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const Route = createFileRoute("/app/audit")({
  component: AuditPage,
});

function AuditPage() {
  const { data: logs = [] } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => (await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(300)).data ?? [],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground mt-1">Full traceability of user actions across modules</p>
      </div>

      <div className="stat-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="text-left font-medium px-4 py-3">Timestamp</th>
                <th className="text-left font-medium px-4 py-3">User</th>
                <th className="text-left font-medium px-4 py-3">Action</th>
                <th className="text-left font-medium px-4 py-3">Module</th>
                <th className="text-left font-medium px-4 py-3">Result</th>
                <th className="text-left font-medium px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-mono text-xs">{format(new Date(l.created_at), "MMM d HH:mm:ss")}</td>
                  <td className="px-4 py-2.5">{l.user_email ?? "—"}</td>
                  <td className="px-4 py-2.5"><span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">{l.action}</span></td>
                  <td className="px-4 py-2.5 text-muted-foreground">{l.module}</td>
                  <td className="px-4 py-2.5"><span className={`text-xs ${l.result === "success" ? "text-success" : "text-destructive"}`}>{l.result}</span></td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground max-w-xs truncate">
                    {l.metadata ? JSON.stringify(l.metadata) : "—"}
                  </td>
                </tr>
              ))}
              {!logs.length && <tr><td colSpan={6} className="text-center text-muted-foreground py-12">No audit events recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
