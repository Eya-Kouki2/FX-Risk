import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { logAudit, useSession } from "@/lib/auth";
import { z } from "zod";

export const Route = createFileRoute("/app/operations/new")({
  component: NewOperation,
});

const CURRENCIES = ["EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "MAD", "AED"];

const schema = z.object({
  client_name: z.string().trim().min(2).max(120),
  buy_currency: z.string().length(3),
  sell_currency: z.string().length(3),
  amount: z.coerce.number().positive().max(1_000_000_000),
  exchange_rate: z.coerce.number().positive(),
  market_rate: z.coerce.number().positive().optional(),
  value_date: z.string().min(1),
  counterparty: z.string().trim().min(2).max(120),
  swift_reference: z.string().trim().max(20).optional().or(z.literal("")),
  comments: z.string().trim().max(500).optional().or(z.literal("")),
});

function NewOperation() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    buy_currency: "EUR",
    sell_currency: "USD",
    amount: "",
    exchange_rate: "",
    market_rate: "",
    value_date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    counterparty: "",
    swift_reference: "",
    comments: "",
  });

  const submit = async (status: "draft" | "pending") => {
    if (!user) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
    }
    if (parsed.data.buy_currency === parsed.data.sell_currency) {
      return toast.error("Les devises d'achat et de vente doivent être différentes");
    }
    setSubmitting(true);
    const payload = {
      ...parsed.data,
      swift_reference: parsed.data.swift_reference || null,
      market_rate: parsed.data.market_rate || null,
      comments: parsed.data.comments || null,
      status,
      created_by: user.id,
    };
    const { data, error } = await supabase.from("operations").insert(payload).select().single();
    setSubmitting(false);
    if (error) return toast.error(error.message);
    await logAudit("create_operation", "operations", { ref: data?.operation_ref, status });
    toast.success(`Opération ${data?.operation_ref} ${status === "draft" ? "sauvegardée" : "soumise"} (risque ${data?.risk_score}/100)`);
    navigate({ to: "/app/operations" });
  };

  const update = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Nouvelle opération FX</h1>
        <p className="text-sm text-muted-foreground mt-1">Saisissez une transaction de change au comptant. Le score de risque et les alertes sont calculés automatiquement.</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); submit("pending"); }} className="space-y-6">
        <section className="stat-card space-y-4">
          <h2 className="font-display font-semibold">Contrepartie</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nom du client" required>
              <Input value={form.client_name} onChange={(e) => update("client_name")(e.target.value)} placeholder="International Trading Co." required />
            </Field>
            <Field label="Contrepartie (banque)" required>
              <Input value={form.counterparty} onChange={(e) => update("counterparty")(e.target.value)} placeholder="HSBC London" required />
            </Field>
          </div>
        </section>

        <section className="stat-card space-y-4">
          <h2 className="font-display font-semibold">Détails de la transaction</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Devise achetée">
              <Select value={form.buy_currency} onValueChange={update("buy_currency")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Devise vendue">
              <Select value={form.sell_currency} onValueChange={update("sell_currency")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Montant" required>
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => update("amount")(e.target.value)} placeholder="500000" required />
            </Field>
            <Field label="Date valeur" required>
              <Input type="date" value={form.value_date} onChange={(e) => update("value_date")(e.target.value)} required />
            </Field>
            <Field label="Taux de change" required>
              <Input type="number" step="0.0001" value={form.exchange_rate} onChange={(e) => update("exchange_rate")(e.target.value)} placeholder="1.0853" required />
            </Field>
            <Field label="Taux de marché de référence" hint="Utilisé pour les contrôles de déviation">
              <Input type="number" step="0.0001" value={form.market_rate} onChange={(e) => update("market_rate")(e.target.value)} placeholder="1.0850" />
            </Field>
            <Field label="Référence SWIFT" hint="Code BIC de 11 caractères idéalement">
              <Input value={form.swift_reference} onChange={(e) => update("swift_reference")(e.target.value.toUpperCase())} placeholder="HSBCGB2LXXX" />
            </Field>
          </div>
        </section>

        <section className="stat-card space-y-4">
          <h2 className="font-display font-semibold">Commentaires</h2>
          <Textarea rows={3} value={form.comments} onChange={(e) => update("comments")(e.target.value)} placeholder="Notes opérationnelles optionnelles…" />
        </section>

        <div className="flex flex-wrap gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => submit("draft")} disabled={submitting}>Sauvegarder brouillon</Button>
          <Button type="submit" disabled={submitting}>Soumettre pour validation</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
