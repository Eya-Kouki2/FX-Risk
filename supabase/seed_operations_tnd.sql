-- ============================================================
-- FX RISK — DONNEES OPERATIONS (TND + paires courantes)
-- Coller dans : Supabase Dashboard → SQL Editor → New Query
--
-- Prerequis : comptes demo crees (front@fxrisk.demo, etc.)
-- risk_score, risk_level et alertes = calcules automatiquement
-- ============================================================

DO $$
DECLARE
  front_id UUID;
  back_id  UUID;
  mgr_id   UUID;
BEGIN
  SELECT id INTO front_id FROM auth.users WHERE email = 'front@fxrisk.demo';
  SELECT id INTO back_id  FROM auth.users WHERE email = 'back@fxrisk.demo';
  SELECT id INTO mgr_id   FROM auth.users WHERE email = 'manager@fxrisk.demo';

  IF front_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur front@fxrisk.demo introuvable. Creez les comptes demo d''abord.';
  END IF;

  -- ── TND 1 : EUR/TND standard — faible risque, validee ─────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260610-TND001', 'Banque de Tunisie', 'EUR', 'TND',
    185000.00, 3.352000, 3.351200, CURRENT_DATE + 2,
    'BIAT Tunis', 'BTUITNTTXXX', 'Achat EUR pour refinancement TND — operation courante',
    'validated', front_id, back_id,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days'
  );

  -- ── TND 2 : USD/TND — faible risque, reglee ───────────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260608-TND002', 'STB Corporate', 'USD', 'TND',
    420000.00, 3.108500, 3.108000, CURRENT_DATE - 1,
    'Societe Tunisienne de Banque', 'STTUTNTTXXX', 'Import equipements industriels — reglement USD/TND',
    'settled', front_id, back_id,
    NOW() - INTERVAL '8 days', NOW() - INTERVAL '9 days'
  );

  -- ── TND 3 : TND/EUR — paire exotique, en attente ──────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260615-TND003', 'Amen Bank Treasury', 'TND', 'EUR',
    275000.00, 0.298200, 0.298500, CURRENT_DATE + 3,
    'Amen Bank', 'CFCTTNTTXXX', 'Conversion TND vers EUR pour paiement fournisseur europeen',
    'pending', front_id, NOW() - INTERVAL '2 days'
  );

  -- ── TND 4 : EUR/TND montant eleve — haut risque, en attente ───────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260616-TND004', 'Attijari Bank Tunisia', 'EUR', 'TND',
    1350000.00, 3.358000, 3.351500, CURRENT_DATE + 4,
    'Attijariwafa Bank Tunis', 'BSTUTNTTXXX', 'Position de change importante Q2 — couverture EUR/TND',
    'pending', front_id, NOW() - INTERVAL '1 day'
  );

  -- ── TND 5 : USD/TND sans SWIFT — critique, en attente ─────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260617-TND005', 'Client Prive Tunis', 'USD', 'TND',
    88000.00, 3.112000, 3.108500, CURRENT_DATE + 2,
    'UBCI', NULL, 'Urgent — SWIFT en attente de confirmation back office',
    'pending', front_id, NOW() - INTERVAL '18 hours'
  );

  -- ── TND 6 : USD/TND gros montant + SWIFT manquant — escaladee ─────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260617-TND006', 'Groupe Poulina', 'USD', 'TND',
    2100000.00, 3.125000, 3.108000, CURRENT_DATE + 5,
    'Banque Internationale Arabe de Tunisie', NULL, 'Financement import matieres premieres — SWIFT a suivre',
    'escalated', front_id, NOW() - INTERVAL '12 hours'
  );

  -- ── TND 7 : EUR/TND ecart de taux — moderee, en attente ───────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260616-TND007', 'Tunisair Finance', 'EUR', 'TND',
    310000.00, 3.420000, 3.351000, CURRENT_DATE + 3,
    'Banque de Tunisie', 'BKTUTNTTXXX', 'Achat carburant — ecart de taux a justifier',
    'pending', front_id, NOW() - INTERVAL '30 hours'
  );

  -- ── TND 8 : TND/USD brouillon ─────────────────────────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260618-TND008', 'Orange Tunisie', 'TND', 'USD',
    95000.00, 0.321500, 0.321700, CURRENT_DATE + 7,
    'BIAT', 'BTUITNTTXXX', 'Brouillon — en attente signature client',
    'draft', front_id, NOW() - INTERVAL '4 hours'
  );

  -- ── TND 9 : EUR/TND rejetee (taux aberrant) ────────────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, rejection_reason, created_at
  ) VALUES (
    'FX-20260605-TND009', 'Startup FinTech Tunis', 'EUR', 'TND',
    150000.00, 3.850000, 3.351000, CURRENT_DATE - 5,
    'Wifak Bank', 'WKFBTNTTXXX', 'Taux de change hors marche detecte automatiquement',
    'rejected', front_id, back_id,
    NOW() - INTERVAL '10 days',
    'Ecart de taux superieur a 2%% par rapport au marche. Operation rejetee selon la politique de risque.',
    NOW() - INTERVAL '11 days'
  );

  -- ── TND 10 : USD/TND validee — historique tendance ────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260601-TND010', 'CEPEX', 'USD', 'TND',
    560000.00, 3.105000, 3.104500, CURRENT_DATE - 10,
    'STB', 'STTUTNTTXXX', 'Export agricole — reglement client international',
    'validated', front_id, back_id,
    NOW() - INTERVAL '13 days', NOW() - INTERVAL '14 days'
  );

  -- ── TND 11 : EUR/TND historique — tendance graphique ──────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260528-TND011', 'Monoprix Tunisie', 'EUR', 'TND',
    120000.00, 3.348000, 3.347500, CURRENT_DATE - 14,
    'Amen Bank', 'CFCTTNTTXXX', 'Paiement fournisseurs alimentaires UE',
    'validated', front_id, back_id,
    NOW() - INTERVAL '16 days', NOW() - INTERVAL '17 days'
  );

  -- ── EUR/USD complementaire (paire majeure) ────────────────────────────────
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260612-EUR001', 'Societe Generale', 'EUR', 'USD',
    290000.00, 1.086500, 1.086100, CURRENT_DATE + 1,
    'BNP Paribas', 'BNPAFRPPXXX', 'Operation interbancaire standard EUR/USD',
    'validated', front_id, back_id,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days'
  );

  RAISE NOTICE 'OK — 12 operations inserees (11 avec TND). Scores et alertes calcules automatiquement.';

EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Une operation avec la meme reference existe deja. Supprimez les doublons ou changez operation_ref.';
WHEN OTHERS THEN
  RAISE EXCEPTION 'Echec seed TND : % (%)', SQLERRM, SQLSTATE;
END;
$$;

-- Verification rapide
SELECT operation_ref, client_name,
       buy_currency || '/' || sell_currency AS paire,
       amount, status, risk_score, risk_level,
       created_at::date AS date_creation
FROM public.operations
WHERE buy_currency = 'TND' OR sell_currency = 'TND'
ORDER BY created_at DESC;
