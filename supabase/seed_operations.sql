-- ============================================================
-- FX RISK PLATFORM — SEED DATA (Operations)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- The risk_score, risk_level, and alerts are AUTO-COMPUTED
-- by database triggers — you don't need to set them manually.
-- ============================================================

DO $$
DECLARE
  front_id  UUID;
  back_id   UUID;
  admin_id  UUID;
  mgr_id    UUID;
  risk_id   UUID;
BEGIN
  -- Fetch user IDs dynamically by email
  SELECT id INTO front_id FROM auth.users WHERE email = 'front@fxrisk.demo';
  SELECT id INTO back_id  FROM auth.users WHERE email = 'back@fxrisk.demo';
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@fxrisk.demo';
  SELECT id INTO mgr_id   FROM auth.users WHERE email = 'manager@fxrisk.demo';
  SELECT id INTO risk_id  FROM auth.users WHERE email = 'risk@fxrisk.demo';

  -- ── OP 1: Standard EUR/USD — Low Risk, Validated ──────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260515-AA001', 'Société Générale', 'EUR', 'USD',
    250000.00, 1.085200, 1.084900, '2026-05-17',
    'BNP Paribas', 'BNPAFRPPXXX', 'Standard interbank EUR/USD spot',
    'validated', front_id, back_id,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days'
  );

  -- ── OP 2: GBP/USD — Low Risk, Validated ───────────────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260515-AA002', 'Barclays Corporate', 'GBP', 'USD',
    180000.00, 1.268400, 1.267900, '2026-05-17',
    'HSBC London', 'HBUKGB4BXXX', 'Client GBP conversion for US investment',
    'validated', front_id, back_id,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days'
  );

  -- ── OP 3: USD/JPY — Low Risk, Settled ─────────────────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260514-AA003', 'Toyota Finance', 'USD', 'JPY',
    500000.00, 149.820000, 149.810000, '2026-05-16',
    'Mizuho Bank', 'MHCBJPJTXXX', 'Japanese yen procurement for procurement dept',
    'settled', front_id, back_id,
    NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days'
  );

  -- ── OP 4: EUR/GBP — Moderate Risk (rate deviation), Pending ───────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260516-AA004', 'Axa Investment Mgmt', 'EUR', 'GBP',
    320000.00, 0.872500, 0.854100, '2026-05-19',
    'Deutsche Bank', 'DEUTDEDBFRA', 'Cross-border fund transfer EU to UK',
    'pending', front_id, NOW() - INTERVAL '2 days'
  );

  -- ── OP 5: High Amount USD/CHF — High Risk, Pending ────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260516-AA005', 'Credit Suisse AM', 'USD', 'CHF',
    1500000.00, 0.899800, 0.898700, '2026-05-20',
    'UBS Zurich', 'UBSWCHZH80A', 'Large institutional CHF acquisition for Q2 hedging',
    'pending', front_id, NOW() - INTERVAL '2 days'
  );

  -- ── OP 6: Missing SWIFT — Critical Risk, Pending ──────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260517-AA006', 'Anonymized Client X', 'USD', 'MAD',
    95000.00, 9.980000, 9.960000, '2026-05-21',
    'Attijariwafa Bank', NULL, 'Urgent MAD settlement — SWIFT pending confirmation',
    'pending', front_id, NOW() - INTERVAL '1 day'
  );

  -- ── OP 7: Exotic Pair + Off-Hours — Critical Risk, Escalated ──────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260517-AA007', 'Gulf Capital LLC', 'USD', 'AED',
    780000.00, 3.672100, 3.672000, '2026-05-22',
    'Emirates NBD', 'EBILAEAD', 'UAE Dirham funding for construction project',
    'escalated', front_id,
    -- Set to 3am to simulate off-hours insertion
    NOW() - INTERVAL '22 hours'
  );

  -- ── OP 8: EUR/USD Large + Missing SWIFT — Critical, Escalated ────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260517-AA008', 'Falcon Asset Management', 'EUR', 'USD',
    2200000.00, 1.092000, 1.085000, '2026-05-21',
    'Natixis Paris', NULL, 'Emergency liquidity position — SWIFT to follow',
    'escalated', front_id, NOW() - INTERVAL '20 hours'
  );

  -- ── OP 9: USD/EUR — Rejected (invalid rate) ───────────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, rejection_reason, created_at
  ) VALUES (
    'FX-20260513-AA009', 'FinTech Solutions SA', 'USD', 'EUR',
    400000.00, 1.210000, 1.085000, '2026-05-15',
    'Société Générale', 'SOGEFRPP', 'Unrealistic conversion rate flagged by system',
    'rejected', front_id, back_id,
    NOW() - INTERVAL '5 days',
    'Exchange rate of 1.21 is 11.5% above current market rate. Operation rejected per risk policy.',
    NOW() - INTERVAL '6 days'
  );

  -- ── OP 10: GBP/JPY — Moderate Risk, Pending ───────────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260518-AA010', 'Nomura Securities', 'GBP', 'JPY',
    210000.00, 190.450000, 190.120000, '2026-05-22',
    'Sumitomo Mitsui', 'SMBCJPJTXXX', 'Tokyo settlement — GBP/JPY cross pair',
    'pending', front_id, NOW() - INTERVAL '6 hours'
  );

  -- ── OP 11: EUR/USD — Low Risk, Draft ──────────────────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260518-AA011', 'Caisses d''Epargne', 'EUR', 'USD',
    75000.00, 1.083500, 1.084200, '2026-05-22',
    'JPMorgan Paris', 'CHASGB2LXXX', 'Routine EUR/USD spot — awaiting client signature',
    'draft', front_id, NOW() - INTERVAL '3 hours'
  );

  -- ── OP 12: USD/CAD — Low Risk, Validated ──────────────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260512-AA012', 'Royal Bank of Canada', 'USD', 'CAD',
    340000.00, 1.362400, 1.362100, '2026-05-14',
    'TD Bank Toronto', 'TDOMCATTTOR', 'USD to CAD bilateral settlement',
    'validated', front_id, back_id,
    NOW() - INTERVAL '6 days', NOW() - INTERVAL '7 days'
  );

  -- ── OP 13: USD/MXN — Exotic Pair Risk, Pending ────────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260518-AA013', 'BBVA Mexico', 'USD', 'MXN',
    130000.00, 17.210000, 17.180000, '2026-05-22',
    'Banamex', 'BNMXMXMMXXX', 'Mexico operations — MXN payroll funding',
    'pending', front_id, NOW() - INTERVAL '1 hour'
  );

  -- ── OP 14: EUR/CHF — Low Risk, Settled ────────────────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260510-AA014', 'Nestlé Treasury', 'EUR', 'CHF',
    620000.00, 0.955100, 0.954800, '2026-05-12',
    'Credit Suisse', 'CRESCHZZ80A', 'EUR/CHF repatriation for Swiss HQ',
    'settled', front_id, back_id,
    NOW() - INTERVAL '8 days', NOW() - INTERVAL '9 days'
  );

  -- ── OP 15: High Amount EUR/USD — High Risk, Validated ─────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260511-AA015', 'AXA Group Treasury', 'EUR', 'USD',
    1800000.00, 1.086200, 1.085100, '2026-05-13',
    'BNP Paribas', 'BNPAFRPPXXX', 'Quarterly hedging position — bulk EUR purchase',
    'validated', front_id, back_id,
    NOW() - INTERVAL '7 days', NOW() - INTERVAL '8 days'
  );

  RAISE NOTICE '✅ Seed data inserted successfully — 15 operations created.';
  RAISE NOTICE '✅ Risk scores and alerts auto-computed by database triggers.';

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION '❌ Seed failed: % (%)', SQLERRM, SQLSTATE;
END;
$$;
