import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export type AppRole = "front_office" | "back_office" | "risk_team" | "manager" | "admin";

export const ROLE_LABELS: Record<AppRole, string> = {
  front_office: "Front Office",
  back_office: "Back Office",
  risk_team: "Middle Office",
  manager: "Responsable",
  admin: "Administrateur",
};

export interface SessionUser {
  id: string;
  email: string;
  fullName: string | null;
  role: AppRole;
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async (uid: string, email: string) => {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      const order: AppRole[] = ["admin", "manager", "risk_team", "back_office", "front_office"];
      const userRoles = (roles ?? []).map((r) => r.role as AppRole);
      const role = order.find((r) => userRoles.includes(r)) ?? "front_office";
      if (mounted) {
        setUser({ id: uid, email, fullName: profile?.full_name ?? null, role });
        setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setTimeout(() => load(session.user.id, session.user.email ?? ""), 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) load(session.user.id, session.user.email ?? "");
      else setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

export async function logAudit(action: string, module: string, metadata?: Record<string, unknown>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    user_email: user.email,
    action,
    module,
    metadata: (metadata ?? null) as never,
    result: "success",
  });
}
