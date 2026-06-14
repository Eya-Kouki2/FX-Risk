import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { logAudit, useSession } from "@/lib/auth";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/operations/new")({
  component: NewOperation,
});

const CURRENCIES = ["TND", "EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "MAD", "AED"];

function NewOperation() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const [openClientMenu, setOpenClientMenu] = useState(false);

  const [form, setForm] = useState({
    client_id: "",
    new_client_name: "",
    new_client_type: "particulier" as "particulier" | "societe",
    new_client_cin: "",
    new_client_mf: "",
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

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["clients_list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name, cin").order("name");
      if (error) throw error;
      return data;
    },
  });

  const submit = async (status: "draft" | "pending") => {
    if (!user) return;

    setSubmitting(true);
    let finalClientId = form.client_id;
    let finalClientName = "";

    try {
      // 1. Gérer le client (Nouveau ou Existant)
      if (isNewClient) {
        if (!form.new_client_name || form.new_client_name.length < 2) {
          throw new Error("Le nom du nouveau client est requis (minimum 2 caractères).");
        }
        const { data: newClient, error: clientErr } = await supabase
          .from("clients")
          .insert({
            name: form.new_client_name,
            client_type: form.new_client_type,
            cin: form.new_client_type === "particulier" ? form.new_client_cin || null : null,
            matricule_fiscal:
              form.new_client_type === "societe" ? form.new_client_mf || null : null,
            created_by: user.id,
          })
          .select()
          .single();

        if (clientErr) throw clientErr;
        finalClientId = newClient.id;
        finalClientName = newClient.name;
      } else {
        if (!form.client_id) {
          throw new Error("Veuillez sélectionner un client existant ou en créer un nouveau.");
        }
        const selectedClient = clients?.find((c) => c.id === form.client_id);
        if (!selectedClient) throw new Error("Client invalide.");
        finalClientName = selectedClient.name;
      }

      // 2. Validation basique des autres champs
      if (form.buy_currency === form.sell_currency) {
        throw new Error("Les devises d'achat et de vente doivent être différentes.");
      }
      if (!form.amount || Number(form.amount) <= 0) throw new Error("Montant invalide.");
      if (!form.exchange_rate || Number(form.exchange_rate) <= 0)
        throw new Error("Taux de change invalide.");
      if (!form.counterparty || form.counterparty.length < 2)
        throw new Error("Contrepartie requise.");

      // 3. Soumission de l'opération
      const payload = {
        client_id: finalClientId,
        client_name: finalClientName, // Pour compatibilité avec l'ancien système
        buy_currency: form.buy_currency,
        sell_currency: form.sell_currency,
        amount: Number(form.amount),
        exchange_rate: Number(form.exchange_rate),
        market_rate: form.market_rate ? Number(form.market_rate) : null,
        value_date: form.value_date,
        counterparty: form.counterparty,
        swift_reference: form.swift_reference || null,
        comments: form.comments || null,
        status,
        created_by: user.id,
      };

      const { data, error } = await supabase.from("operations").insert(payload).select().single();
      if (error) throw error;

      await logAudit("create_operation", "operations", { ref: data?.operation_ref, status });
      toast.success(
        `Opération ${data?.operation_ref} ${status === "draft" ? "sauvegardée" : "soumise"} (risque ${data?.risk_score}/100)`,
      );
      navigate({ to: "/app/operations" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const update = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold">Nouvelle opération FX</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Saisissez une transaction de change au comptant. Le score de risque et les alertes sont
          calculés automatiquement.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit("pending");
        }}
        className="space-y-6"
      >
        {/* Section Client */}
        <section className="stat-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold">Informations du Client</h2>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="new-client"
                checked={isNewClient}
                onCheckedChange={(c) => setIsNewClient(c as boolean)}
              />
              <label
                htmlFor="new-client"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Créer un nouveau client
              </label>
            </div>
          </div>

          {isNewClient ? (
            <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
              {/* Toggle Particulier / Société */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => update("new_client_type")("particulier")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    form.new_client_type === "particulier"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary"
                  }`}
                >
                  👤 Particulier
                </button>
                <button
                  type="button"
                  onClick={() => update("new_client_type")("societe")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    form.new_client_type === "societe"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary"
                  }`}
                >
                  🏢 Société
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label={
                    form.new_client_type === "particulier" ? "Nom et Prénom" : "Raison Sociale"
                  }
                  required
                >
                  <Input
                    value={form.new_client_name}
                    onChange={(e) => update("new_client_name")(e.target.value)}
                    placeholder={
                      form.new_client_type === "particulier"
                        ? "Ex: Ali Ben Salah"
                        : "Ex: Société Tunisienne de Textile"
                    }
                    required={isNewClient}
                  />
                </Field>

                {form.new_client_type === "particulier" ? (
                  <Field label="Numéro de CIN" hint="8 chiffres (optionnel)">
                    <Input
                      value={form.new_client_cin}
                      onChange={(e) => update("new_client_cin")(e.target.value)}
                      placeholder="Ex: 01234567"
                    />
                  </Field>
                ) : (
                  <Field label="Matricule Fiscal" hint="Ex: 1234567A/P/M/000 (optionnel)">
                    <Input
                      value={form.new_client_mf}
                      onChange={(e) => update("new_client_mf")(e.target.value)}
                      placeholder="Ex: 1234567B/P/A/000"
                    />
                  </Field>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <Field label="Rechercher un client (Nom ou CIN)" required>
                <Popover open={openClientMenu} onOpenChange={setOpenClientMenu}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openClientMenu}
                      className="w-full justify-between font-normal bg-background"
                      disabled={clientsLoading}
                    >
                      {form.client_id && clients
                        ? clients.find((c) => c.id === form.client_id)?.name +
                          (clients.find((c) => c.id === form.client_id)?.cin
                            ? ` (CIN: ${clients.find((c) => c.id === form.client_id)?.cin})`
                            : "")
                        : "Rechercher un client..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher par nom ou numéro de CIN..." />
                      <CommandList>
                        <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                        <CommandGroup>
                          {clients?.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.name} ${c.cin || ""}`}
                              onSelect={() => {
                                update("client_id")(c.id);
                                setOpenClientMenu(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  form.client_id === c.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {c.name}{" "}
                              {c.cin ? (
                                <span className="ml-2 text-muted-foreground">(CIN: {c.cin})</span>
                              ) : (
                                ""
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </Field>
            </div>
          )}
        </section>

        <section className="stat-card space-y-4">
          <h2 className="font-display font-semibold">Détails de la transaction</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Field label="Contrepartie (banque)" required>
              <Input
                value={form.counterparty}
                onChange={(e) => update("counterparty")(e.target.value)}
                placeholder="HSBC London"
                required
              />
            </Field>
            <Field label="Référence SWIFT" hint="Code BIC (optionnel)">
              <Input
                value={form.swift_reference}
                onChange={(e) => update("swift_reference")(e.target.value.toUpperCase())}
                placeholder="HSBCGB2LXXX"
              />
            </Field>
            <Field label="Devise achetée">
              <Select value={form.buy_currency} onValueChange={update("buy_currency")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Devise vendue">
              <Select value={form.sell_currency} onValueChange={update("sell_currency")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Montant" required>
              <Input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => update("amount")(e.target.value)}
                placeholder="500000"
                required
              />
            </Field>
            <Field label="Date valeur" required>
              <Input
                type="date"
                value={form.value_date}
                onChange={(e) => update("value_date")(e.target.value)}
                required
              />
            </Field>
            <Field label="Taux de change" required>
              <Input
                type="number"
                step="0.0001"
                value={form.exchange_rate}
                onChange={(e) => update("exchange_rate")(e.target.value)}
                placeholder="1.0853"
                required
              />
            </Field>
            <Field label="Taux de marché" hint="Pour contrôles de déviation">
              <Input
                type="number"
                step="0.0001"
                value={form.market_rate}
                onChange={(e) => update("market_rate")(e.target.value)}
                placeholder="1.0850"
              />
            </Field>
          </div>
        </section>

        <section className="stat-card space-y-4">
          <h2 className="font-display font-semibold">Commentaires</h2>
          <Textarea
            rows={3}
            value={form.comments}
            onChange={(e) => update("comments")(e.target.value)}
            placeholder="Notes opérationnelles optionnelles…"
          />
        </section>

        <div className="flex flex-wrap gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => submit("draft")}
            disabled={submitting}
          >
            Sauvegarder brouillon
          </Button>
          <Button type="submit" disabled={submitting}>
            Soumettre pour validation
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 flex flex-col justify-start">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
