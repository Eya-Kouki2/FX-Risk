import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Building2, Search, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/risk";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/app/clients/")({
  component: ClientsList,
});

function ClientsList() {
  const { user } = useSession();
  const canAddClient = user?.role === "front_office" || user?.role === "admin";
  const [search, setSearch] = useState("");

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select(
          `
          id,
          name,
          cin,
          client_type,
          matricule_fiscal,
          created_at,
          operations ( id, amount )
        `,
        )
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = clients?.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.cin && c.cin.toLowerCase().includes(search.toLowerCase())) ||
      (c.matricule_fiscal && c.matricule_fiscal.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" />
            Annuaire des Clients
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez votre portefeuille clients et consultez leur historique de change.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, CIN..."
              className="pl-9 w-64 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canAddClient && (
            <Button asChild>
              <Link to="/app/operations/new">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="stat-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Nom du Client</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Identifiant</th>
                <th className="px-6 py-4 font-medium text-right">Transactions</th>
                <th className="px-6 py-4 font-medium text-right">Volume Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Chargement des clients...
                  </td>
                </tr>
              ) : filtered?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Aucun client trouvé.
                  </td>
                </tr>
              ) : (
                filtered?.map((c) => {
                  const opsCount = c.operations?.length || 0;
                  const totalVol =
                    c.operations?.reduce((sum, op) => sum + Number(op.amount), 0) || 0;

                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <Link
                          to="/app/clients/$clientId"
                          params={{ clientId: c.id }}
                          className="font-medium text-primary hover:underline"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            c.client_type === "societe"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-green-500/10 text-green-600"
                          }`}
                        >
                          {c.client_type === "societe" ? "🏢 Société" : "👤 Particulier"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {c.client_type === "particulier"
                          ? c.cin
                            ? `CIN: ${c.cin}`
                            : "—"
                          : c.matricule_fiscal
                            ? `MF: ${c.matricule_fiscal}`
                            : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center justify-center bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                          {opsCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatCurrency(totalVol)} $
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
