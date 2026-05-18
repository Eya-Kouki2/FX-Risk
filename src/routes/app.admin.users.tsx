import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABELS, type AppRole } from "@/lib/auth";
import { format } from "date-fns";

export const Route = createFileRoute("/app/admin/users")({
  component: UsersAdmin,
});

function UsersAdmin() {
  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles"],
    queryFn: async () => {
      const [{ data: profs }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      const roleMap = new Map<string, AppRole>();
      roles?.forEach((r) => roleMap.set(r.user_id, r.role as AppRole));
      return (profs ?? []).map((p) => ({ ...p, role: roleMap.get(p.id) ?? "front_office" as AppRole }));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Gestion des utilisateurs</h1>
        <p className="text-sm text-muted-foreground mt-1">Membres de la plateforme et leurs rôles assignés</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="stat-card"><div className="text-xs text-muted-foreground uppercase tracking-wide">Total utilisateurs</div><div className="text-2xl font-display font-bold mt-2">{profiles.length}</div></div>
        {(["admin","manager","risk_team","back_office","front_office"] as AppRole[]).map((r) => (
          <div key={r} className="stat-card">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{ROLE_LABELS[r]}</div>
            <div className="text-2xl font-display font-bold mt-2">{profiles.filter((p) => p.role === r).length}</div>
          </div>
        ))}
      </div>

      <div className="stat-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                <th className="text-left font-medium px-4 py-3">Nom</th>
                <th className="text-left font-medium px-4 py-3">Département</th>
                <th className="text-left font-medium px-4 py-3">Rôle</th>
                <th className="text-left font-medium px-4 py-3">Inscription</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{p.full_name ?? "Sans nom"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.department ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs">{ROLE_LABELS[p.role]}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
