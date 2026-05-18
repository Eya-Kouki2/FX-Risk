import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Database, Loader2 } from "lucide-react";
import { seedDemoData } from "@/lib/seed.functions";

export const Route = createFileRoute("/app/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const seedFn = useServerFn(seedDemoData);
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  const runSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedFn();
      toast.success(`Seeded ${res.inserted} demo operations`);
      qc.invalidateQueries();
    } catch (e: any) {
      toast.error(e?.message ?? "Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Platform Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Risk thresholds, alert configuration and demo data</p>
      </div>

      <section className="stat-card space-y-4 border-primary/30">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Database className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-semibold">Demo data</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Populate the platform with 40 realistic FX operations including high-amount trades, missing SWIFT references, off-hours entries and rate-deviation anomalies. Existing operations and alerts will be replaced.
            </p>
          </div>
        </div>
        <Button onClick={runSeed} disabled={seeding}>
          {seeding ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Database className="h-4 w-4 mr-1.5" />}
          {seeding ? "Seeding…" : "Generate demo data"}
        </Button>
      </section>

      <section className="stat-card space-y-4">
        <h2 className="font-display font-semibold">Risk thresholds</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5"><Label>Low (≤)</Label><Input type="number" defaultValue={20} /></div>
          <div className="space-y-1.5"><Label>Moderate (≤)</Label><Input type="number" defaultValue={40} /></div>
          <div className="space-y-1.5"><Label>High (≤)</Label><Input type="number" defaultValue={60} /></div>
          <div className="space-y-1.5"><Label>Critical (&gt;)</Label><Input type="number" defaultValue={60} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>High-amount threshold (EUR)</Label><Input type="number" defaultValue={1000000} /></div>
          <div className="space-y-1.5"><Label>Rate deviation tolerance (%)</Label><Input type="number" step="0.1" defaultValue={2} /></div>
        </div>
      </section>

      <section className="stat-card space-y-4">
        <h2 className="font-display font-semibold">Alerts</h2>
        {[
          { k: "Email notifications", d: "Send critical alerts via email" },
          { k: "In-app notifications", d: "Show toast notifications in dashboard" },
          { k: "Auto-escalate critical", d: "Escalate critical operations to manager queue" },
        ].map((s) => (
          <div key={s.k} className="flex items-center justify-between gap-4 py-2 border-t border-border first:border-0">
            <div>
              <div className="font-medium text-sm">{s.k}</div>
              <div className="text-xs text-muted-foreground">{s.d}</div>
            </div>
            <Switch defaultChecked />
          </div>
        ))}
      </section>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Settings saved")}>Save changes</Button>
      </div>
    </div>
  );
}
