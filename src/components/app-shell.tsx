import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard, ArrowLeftRight, ShieldAlert, Map, FileBarChart,
  ScrollText, Users, Settings, LogOut, Bell, CheckCircle2,
} from "lucide-react";
import { useSession, ROLE_LABELS, type AppRole, logAudit } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; roles: AppRole[] };

const NAV: NavItem[] = [
  { to: "/app", label: "Tableau de bord", icon: LayoutDashboard, roles: ["front_office", "back_office", "risk_team", "manager", "admin"] },
  { to: "/app/operations", label: "Opérations FX", icon: ArrowLeftRight, roles: ["front_office", "back_office", "risk_team", "manager", "admin"] },
  { to: "/app/operations/new", label: "Nouvelle opération", icon: ArrowLeftRight, roles: ["front_office", "admin"] },
  { to: "/app/validation", label: "File de validation", icon: CheckCircle2, roles: ["back_office", "admin"] },
  { to: "/app/approvals", label: "File d'approbation", icon: CheckCircle2, roles: ["manager", "admin"] },
  { to: "/app/alerts", label: "Centre d'alertes", icon: Bell, roles: ["back_office", "risk_team", "manager", "admin"] },
  { to: "/app/heatmap", label: "Cartographie des risques", icon: Map, roles: ["risk_team", "manager", "admin"] },
  { to: "/app/reports", label: "Rapports", icon: FileBarChart, roles: ["risk_team", "manager", "admin"] },
  { to: "/app/audit", label: "Journaux d'audit", icon: ScrollText, roles: ["manager", "admin"] },
  { to: "/app/admin/users", label: "Gestion des utilisateurs", icon: Users, roles: ["admin"] },
  { to: "/app/admin/settings", label: "Paramètres", icon: Settings, roles: ["admin"] },
];

export function AppShell() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-12 w-48" />
      </div>
    );
  }

  const items = NAV.filter((n) => n.roles.includes(user.role));

  const signOut = async () => {
    await logAudit("logout", "auth");
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Fixed sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-sidebar text-sidebar-foreground">
        <div className="px-6 py-5 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-sidebar-primary flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <div className="font-display font-bold text-sm leading-tight">FX Risk</div>
              <div className="text-xs text-sidebar-foreground/60">STB FX Intelligence</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-hidden px-3 py-4 space-y-0.5">
          {items.map((item) => {
            const active = item.to === "/app" ? path === "/app" : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3 shrink-0">
          <div className="px-3 py-2">
            <div className="text-sm font-medium truncate">{user.fullName ?? user.email}</div>
            <div className="text-xs text-sidebar-foreground/60">{ROLE_LABELS[user.role]}</div>
          </div>
          <Button onClick={signOut} variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
            <LogOut className="h-4 w-4 mr-2" /> Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main content offset by sidebar width on desktop */}
      <main className="flex-1 min-w-0 lg:pl-64">
        <header className="lg:hidden flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <ShieldAlert className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="font-display font-bold">FX Risk</div>
          </div>
          <Button size="sm" variant="ghost" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
