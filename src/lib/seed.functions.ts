import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { TablesInsert } from "@/integrations/supabase/types";

const CLIENTS = [
  "International Trading Co.",
  "Atlas Imports SARL",
  "Nordea Shipping AB",
  "Mediterranean Oil SA",
  "Sahara Minerals Ltd",
  "Volga Agro Group",
  "Pacific Electronics Inc",
  "Lusitania Textile",
  "Cairo Cotton Export",
  "Helvetia Pharma AG",
  "Dakar Cocoa Union",
  "Casablanca Steel",
  "Bavarian Motors GmbH",
  "Andes Mining Corp",
  "Singapore Spice House",
];
const COUNTERPARTIES = [
  "HSBC London",
  "BNP Paribas Paris",
  "JPMorgan New York",
  "Deutsche Bank Frankfurt",
  "UBS Zurich",
  "Standard Chartered Dubai",
  "Citi Singapore",
  "Société Générale",
  "Barclays London",
];
const PAIRS: Array<[string, string]> = [
  ["EUR", "USD"],
  ["USD", "EUR"],
  ["GBP", "USD"],
  ["USD", "JPY"],
  ["EUR", "GBP"],
  ["USD", "CHF"],
  ["EUR", "JPY"],
  ["USD", "MAD"],
  ["EUR", "AED"],
  ["USD", "CNY"],
];
const RATES: Record<string, number> = {
  "EUR/USD": 1.085,
  "USD/EUR": 0.922,
  "GBP/USD": 1.265,
  "USD/JPY": 149.5,
  "EUR/GBP": 0.858,
  "USD/CHF": 0.881,
  "EUR/JPY": 162.3,
  "USD/MAD": 9.95,
  "EUR/AED": 3.98,
  "USD/CNY": 7.18,
};

function rand<T>(a: T[]) {
  return a[Math.floor(Math.random() * a.length)];
}

export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Find any front_office or admin user to attribute operations to
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["front_office", "admin"]);
    const userIds = (roles ?? []).map((r) => r.user_id);
    if (!userIds.length) {
      userIds.push(context.userId);
    }

    // Wipe existing demo data (operations cascade nothing, alerts have op fk loosely)
    await supabaseAdmin.from("alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin
      .from("operations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    const ops: TablesInsert<"operations">[] = [];
    const now = Date.now();
    for (let i = 0; i < 40; i++) {
      const [buy, sell] = rand(PAIRS);
      const base = RATES[`${buy}/${sell}`] ?? 1;
      const isAnomaly = Math.random() < 0.35;
      const drift = isAnomaly ? Math.random() * 0.06 - 0.03 : Math.random() * 0.005 - 0.0025;
      const rate = base * (1 + drift);
      const amount =
        isAnomaly && Math.random() < 0.5
          ? 1_000_000 + Math.random() * 4_000_000
          : 50_000 + Math.random() * 800_000;
      const hasSwift = !(isAnomaly && Math.random() < 0.4);
      const createdAt = new Date(now - Math.random() * 14 * 86400000);
      // Sometimes force off-hours
      if (isAnomaly && Math.random() < 0.3) createdAt.setHours(22);
      const valueDate = new Date(createdAt.getTime() + 2 * 86400000);
      const statusRoll = Math.random();
      const status: TablesInsert<"operations">["status"] =
        statusRoll < 0.45
          ? "pending"
          : statusRoll < 0.7
            ? "validated"
            : statusRoll < 0.82
              ? "rejected"
              : statusRoll < 0.92
                ? "escalated"
                : "settled";

      ops.push({
        client_name: rand(CLIENTS),
        buy_currency: buy,
        sell_currency: sell,
        amount: Math.round(amount * 100) / 100,
        exchange_rate: Math.round(rate * 10000) / 10000,
        market_rate: Math.round(base * 10000) / 10000,
        value_date: valueDate.toISOString().slice(0, 10),
        counterparty: rand(COUNTERPARTIES),
        swift_reference: hasSwift ? `HSBCGB2L${Math.floor(Math.random() * 900 + 100)}` : null,
        comments: isAnomaly ? "Flagged by FX desk for review" : null,
        status,
        created_by: rand(userIds),
        created_at: createdAt.toISOString(),
      });
    }

    const { error } = await supabaseAdmin.from("operations").insert(ops);
    if (error) throw new Error(error.message);

    return { inserted: ops.length };
  });
