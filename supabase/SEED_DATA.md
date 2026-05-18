# 🗃️ FX Risk Platform — Seed Data Reference

> **How to use:** Copy the contents of [`supabase/seed_operations.sql`](./seed_operations.sql) and run it in your **Supabase Dashboard → SQL Editor → New Query**.
> Risk scores, risk levels, and alerts are **automatically computed** by database triggers — you do not set them manually.

---

## 👥 Demo Users

| Display Name | Email | Password | Role | Department |
|---|---|---|---|---|
| Administrator | `admin@fxrisk.demo` | `Demo!2026` | `admin` | IT / Security |
| Back Office Validator | `back@fxrisk.demo` | `Demo!2026` | `back_office` | Back Office Operations |
| Front Office Operator | `front@fxrisk.demo` | `Demo!2026` | `front_office` | Front Office |
| Responsible Manager | `manager@fxrisk.demo` | `Demo!2026` | `manager` | Executive / Management |
| Risk Team Analyst | `risk@fxrisk.demo` | `Demo!2026` | `risk_team` | Risk Management |

---

## 📊 Operations Seed Data (15 Records)

| # | Ref | Client | Pair | Amount | Rate | Market Rate | Value Date | Counterparty | SWIFT | Status | Expected Risk |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `FX-20260515-AA001` | Société Générale | EUR/USD | $250,000 | 1.0852 | 1.0849 | 2026-05-17 | BNP Paribas | `BNPAFRPPXXX` | ✅ validated | 🟢 **low** |
| 2 | `FX-20260515-AA002` | Barclays Corporate | GBP/USD | $180,000 | 1.2684 | 1.2679 | 2026-05-17 | HSBC London | `HBUKGB4BXXX` | ✅ validated | 🟢 **low** |
| 3 | `FX-20260514-AA003` | Toyota Finance | USD/JPY | $500,000 | 149.82 | 149.81 | 2026-05-16 | Mizuho Bank | `MHCBJPJTXXX` | ✅ settled | 🟢 **low** |
| 4 | `FX-20260516-AA004` | Axa Investment Mgmt | EUR/GBP | $320,000 | 0.8725 | 0.8541 | 2026-05-19 | Deutsche Bank | `DEUTDEDBFRA` | ⏳ pending | 🟡 **moderate** |
| 5 | `FX-20260516-AA005` | Credit Suisse AM | USD/CHF | $1,500,000 | 0.8998 | 0.8987 | 2026-05-20 | UBS Zurich | `UBSWCHZH80A` | ⏳ pending | 🔴 **high** |
| 6 | `FX-20260517-AA006` | Anonymized Client X | USD/MAD | $95,000 | 9.98 | 9.96 | 2026-05-21 | Attijariwafa | ❌ *missing* | ⏳ pending | 🔴 **critical** |
| 7 | `FX-20260517-AA007` | Gulf Capital LLC | USD/AED | $780,000 | 3.6721 | 3.672 | 2026-05-22 | Emirates NBD | `EBILAEAD` | ⬆️ escalated | 🔴 **critical** |
| 8 | `FX-20260517-AA008` | Falcon Asset Mgmt | EUR/USD | $2,200,000 | 1.092 | 1.085 | 2026-05-21 | Natixis Paris | ❌ *missing* | ⬆️ escalated | 🔴 **critical** |
| 9 | `FX-20260513-AA009` | FinTech Solutions SA | USD/EUR | $400,000 | 1.21 | 1.085 | 2026-05-15 | Société Générale | `SOGEFRPP` | ❌ rejected | 🔴 **critical** |
| 10 | `FX-20260518-AA010` | Nomura Securities | GBP/JPY | $210,000 | 190.45 | 190.12 | 2026-05-22 | Sumitomo Mitsui | `SMBCJPJTXXX` | ⏳ pending | 🟡 **moderate** |
| 11 | `FX-20260518-AA011` | Caisses d'Epargne | EUR/USD | $75,000 | 1.0835 | 1.0842 | 2026-05-22 | JPMorgan Paris | `CHASGB2LXXX` | 📝 draft | 🟢 **low** |
| 12 | `FX-20260512-AA012` | Royal Bank of Canada | USD/CAD | $340,000 | 1.3624 | 1.3621 | 2026-05-14 | TD Bank Toronto | `TDOMCATTTOR` | ✅ validated | 🟢 **low** |
| 13 | `FX-20260518-AA013` | BBVA Mexico | USD/MXN | $130,000 | 17.21 | 17.18 | 2026-05-22 | Banamex | `BNMXMXMMXXX` | ⏳ pending | 🟡 **moderate** |
| 14 | `FX-20260510-AA014` | Nestlé Treasury | EUR/CHF | $620,000 | 0.9551 | 0.9548 | 2026-05-12 | Credit Suisse | `CRESCHZZ80A` | ✅ settled | 🟢 **low** |
| 15 | `FX-20260511-AA015` | AXA Group Treasury | EUR/USD | $1,800,000 | 1.0862 | 1.0851 | 2026-05-13 | BNP Paribas | `BNPAFRPPXXX` | ✅ validated | 🔴 **high** |

---

## ⚠️ Auto-Generated Alerts (Expected After Seed)

The following alerts will be **automatically created** in the `alerts` table by the `generate_alerts()` trigger when the seed SQL runs:

| Operation Ref | Severity | Category | Trigger Reason |
|---|---|---|---|
| `FX-20260516-AA005` | 🔴 High | High Amount | Amount $1.5M > $1,000,000 threshold |
| `FX-20260517-AA006` | 🔴 Critical | Missing SWIFT | No SWIFT reference provided |
| `FX-20260517-AA007` | 🟡 Moderate | Late-Night Transaction | Inserted outside trading hours (3 AM) |
| `FX-20260517-AA008` | 🔴 Critical | Missing SWIFT | No SWIFT reference provided |
| `FX-20260517-AA008` | 🔴 Critical | High Amount | Amount $2.2M > $1,000,000 threshold |
| `FX-20260517-AA008` | 🔴 Critical | Critical Risk Score | Score reached critical due to combined factors |
| `FX-20260511-AA015` | 🔴 High | High Amount | Amount $1.8M > $1,000,000 threshold |

---

## 🧠 Risk Score Breakdown Explained

The `compute_risk()` trigger assigns scores based on these rules:

| Factor | Applies To | Score Added |
|---|---|---|
| Amount > $1,000,000 | OP 5, 8, 15 | +20 |
| SWIFT reference missing | OP 6, 8 | +25 |
| SWIFT format invalid | — | +30 |
| Off-hours transaction (before 7AM / after 8PM) | OP 7 | +15 |
| Rate deviance > 2% vs market | OP 8, 9 | +20 |
| Exotic currency pair (non-major) | OP 6, 7, 13 | +10 |

### Final Score → Risk Level
| Score Range | Level |
|---|---|
| 0 – 20 | 🟢 `low` |
| 21 – 40 | 🟡 `moderate` |
| 41 – 60 | 🟠 `high` |
| > 60 | 🔴 `critical` |

---

## 🔍 Useful Verification Queries

Run these in the Supabase SQL Editor to verify everything looks correct after seeding:

```sql
-- Check all inserted operations with computed risk
SELECT operation_ref, client_name, buy_currency || '/' || sell_currency AS pair,
       amount, status, risk_score, risk_level
FROM public.operations
ORDER BY created_at DESC;

-- Check auto-generated alerts
SELECT a.severity, a.category, a.message, o.operation_ref
FROM public.alerts a
JOIN public.operations o ON o.id = a.operation_id
ORDER BY a.created_at DESC;

-- Summary by risk level
SELECT risk_level, COUNT(*) AS count, SUM(amount) AS total_exposure
FROM public.operations
GROUP BY risk_level
ORDER BY CASE risk_level
  WHEN 'critical' THEN 1 WHEN 'high' THEN 2
  WHEN 'moderate' THEN 3 WHEN 'low' THEN 4 END;

-- Summary by status
SELECT status, COUNT(*) AS count
FROM public.operations
GROUP BY status;
```
