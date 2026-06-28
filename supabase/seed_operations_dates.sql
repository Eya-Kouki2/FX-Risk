-- ============================================================
-- FX RISK — Operations par plages de dates
-- Periode 1 : 14/06/2026 → 16/06/2026
-- Periode 2 : 23/06/2026 → 26/06/2026
--
-- Coller dans : Supabase Dashboard → SQL Editor → New Query
-- Prerequis : comptes demo (front@fxrisk.demo, back@fxrisk.demo)
-- risk_score, risk_level, alertes = automatiques (triggers)
-- ============================================================

DO $$
DECLARE
  front_id UUID;
  back_id  UUID;
BEGIN
  SELECT id INTO front_id FROM auth.users WHERE email = 'front@fxrisk.demo';
  SELECT id INTO back_id  FROM auth.users WHERE email = 'back@fxrisk.demo';

  IF front_id IS NULL THEN
    RAISE EXCEPTION 'Compte front@fxrisk.demo introuvable. Creez les comptes demo d''abord.';
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- PERIODE 14/06/2026 — 16/06/2026
  -- ═══════════════════════════════════════════════════════════

  -- 14 juin 2026
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260614-D001', 'Banque de Tunisie', 'EUR', 'TND',
    220000.00, 3.349000, 3.348500, '2026-06-16',
    'BIAT Tunis', 'BTUITNTTXXX', 'Spot EUR/TND — 14 juin',
    'validated', front_id, back_id,
    '2026-06-14 11:30:00+00', '2026-06-14 10:15:00+00'
  );

  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260614-D002', 'STB Corporate', 'USD', 'TND',
    175000.00, 3.107000, 3.106800, '2026-06-17',
    'Societe Tunisienne de Banque', 'STTUTNTTXXX', 'Reglement import — 14 juin',
    'pending', front_id, '2026-06-14 14:45:00+00'
  );

  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260614-D003', 'Societe Generale', 'EUR', 'USD',
    310000.00, 1.085800, 1.085500, '2026-06-16',
    'BNP Paribas', 'BNPAFRPPXXX', 'EUR/USD interbancaire — 14 juin',
    'validated', front_id, back_id,
    '2026-06-14 16:00:00+00', '2026-06-14 15:20:00+00'
  );

  -- 15 juin 2026
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260615-D004', 'Amen Bank Treasury', 'TND', 'EUR',
    198000.00, 0.298400, 0.298600, '2026-06-18',
    'Amen Bank', 'CFCTTNTTXXX', 'Conversion TND/EUR — 15 juin',
    'pending', front_id, '2026-06-15 09:30:00+00'
  );

  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260615-D005', 'CEPEX', 'USD', 'TND',
    485000.00, 3.109000, 3.108500, '2026-06-17',
    'STB', 'STTUTNTTXXX', 'Export agricole — 15 juin',
    'settled', front_id, back_id,
    '2026-06-15 13:00:00+00', '2026-06-15 11:45:00+00'
  );

  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260615-D006', 'Attijari Bank Tunisia', 'EUR', 'TND',
    1280000.00, 3.355000, 3.349000, '2026-06-19',
    'Attijariwafa Bank Tunis', 'BSTUTNTTXXX', 'Gros montant EUR/TND — 15 juin',
    'pending', front_id, '2026-06-15 16:30:00+00'
  );

  -- 16 juin 2026
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260616-D007', 'Client Prive Tunis', 'USD', 'TND',
    92000.00, 3.111000, 3.108000, '2026-06-18',
    'UBCI', NULL, 'SWIFT manquant — 16 juin',
    'pending', front_id, '2026-06-16 10:00:00+00'
  );

  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260616-D008', 'Monoprix Tunisie', 'EUR', 'TND',
    142000.00, 3.347000, 3.346800, '2026-06-18',
    'Amen Bank', 'CFCTTNTTXXX', 'Paiement fournisseurs — 16 juin',
    'validated', front_id, back_id,
    '2026-06-16 14:15:00+00', '2026-06-16 13:30:00+00'
  );

  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260616-D009', 'Barclays Corporate', 'GBP', 'USD',
    265000.00, 1.269500, 1.269000, '2026-06-18',
    'HSBC London', 'HBUKGB4BXXX', 'GBP/USD cross — 16 juin',
    'pending', front_id, '2026-06-16 17:45:00+00'
  );

  -- ═══════════════════════════════════════════════════════════
  -- PERIODE 23/06/2026 — 26/06/2026
  -- ═══════════════════════════════════════════════════════════

  -- 23 juin 2026
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260623-D010', 'Orange Tunisie', 'TND', 'USD',
    118000.00, 0.321800, 0.321600, '2026-06-25',
    'BIAT', 'BTUITNTTXXX', 'TND/USD telecom — 23 juin',
    'validated', front_id, back_id,
    '2026-06-23 11:00:00+00', '2026-06-23 10:00:00+00'
  );

  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260623-D011', 'Groupe Poulina', 'USD', 'TND',
    1680000.00, 3.118000, 3.109000, '2026-06-26',
    'BIAT', 'BTUITNTTXXX', 'Import matieres premieres — 23 juin',
    'escalated', front_id, '2026-06-23 14:30:00+00'
  );

  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260623-D012', 'Toyota Finance', 'USD', 'JPY',
    390000.00, 149.950000, 149.900000, '2026-06-25',
    'Mizuho Bank', 'MHCBJPJTXXX', 'USD/JPY spot — 23 juin',
    'pending', front_id, '2026-06-23 16:00:00+00'
  );

  -- 24 juin 2026
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260624-D013', 'Tunisair Finance', 'EUR', 'TND',
    295000.00, 3.351000, 3.350500, '2026-06-26',
    'Banque de Tunisie', 'BKTUTNTTXXX', 'Carburant aviation — 24 juin',
    'validated', front_id, back_id,
    '2026-06-24 10:30:00+00', '2026-06-24 09:45:00+00'
  );

  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260624-D014', 'Startup FinTech Tunis', 'EUR', 'TND',
    88000.00, 3.420000, 3.351000, '2026-06-27',
    'Wifak Bank', 'WKFBTNTTXXX', 'Ecart de taux — 24 juin',
    'pending', front_id, '2026-06-24 13:15:00+00'
  );

  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260624-D015', 'Royal Bank of Canada', 'USD', 'CAD',
    225000.00, 1.363500, 1.363200, '2026-06-26',
    'TD Bank Toronto', 'TDOMCATTTOR', 'USD/CAD bilateral — 24 juin',
    'pending', front_id, '2026-06-24 15:50:00+00'
  );

  -- 25 juin 2026
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260625-D016', 'Nestle Treasury', 'EUR', 'CHF',
    540000.00, 0.956200, 0.955900, '2026-06-27',
    'Credit Suisse', 'CRESCHZZ80A', 'EUR/CHF repatriation — 25 juin',
    'settled', front_id, back_id,
    '2026-06-25 11:20:00+00', '2026-06-25 10:00:00+00'
  );

  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260625-D017', 'Anonymized Client X', 'USD', 'MAD',
    105000.00, 9.975000, 9.960000, '2026-06-28',
    'Attijariwafa Bank', NULL, 'USD/MAD sans SWIFT — 25 juin',
    'pending', front_id, '2026-06-25 14:00:00+00'
  );

  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260625-D018', 'Caisses d''Epargne', 'EUR', 'USD',
    68000.00, 1.084200, 1.084500, '2026-06-27',
    'JPMorgan Paris', 'CHASGB2LXXX', 'Brouillon EUR/USD — 25 juin',
    'draft', front_id, '2026-06-25 16:40:00+00'
  );

  -- 26 juin 2026
  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, created_at
  ) VALUES (
    'FX-20260626-D019', 'AXA Group Treasury', 'EUR', 'USD',
    1950000.00, 1.087500, 1.086800, '2026-06-30',
    'BNP Paribas', 'BNPAFRPPXXX', 'Couverture trimestrielle — 26 juin',
    'validated', front_id, back_id,
    '2026-06-26 12:00:00+00', '2026-06-26 10:30:00+00'
  );

  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, created_at
  ) VALUES (
    'FX-20260626-D020', 'Gulf Capital LLC', 'USD', 'AED',
    620000.00, 3.672500, 3.672000, '2026-06-30',
    'Emirates NBD', 'EBILAEAD', 'USD/AED funding — 26 juin',
    'pending', front_id, '2026-06-26 13:45:00+00'
  );

  INSERT INTO public.operations (
    operation_ref, client_name, buy_currency, sell_currency,
    amount, exchange_rate, market_rate, value_date,
    counterparty, swift_reference, comments, status,
    created_by, validated_by, validated_at, rejection_reason, created_at
  ) VALUES (
    'FX-20260626-D021', 'FinTech Solutions SA', 'USD', 'EUR',
    355000.00, 1.205000, 1.086000, '2026-06-29',
    'Societe Generale', 'SOGEFRPP', 'Taux aberrant — 26 juin',
    'rejected', front_id, back_id,
    '2026-06-26 15:30:00+00',
    'Ecart de taux superieur a 2% vs marche. Rejete selon politique de risque.',
    '2026-06-26 14:00:00+00'
  );

  RAISE NOTICE 'OK — 21 operations inserees (14-16 juin + 23-26 juin 2026).';

EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Reference operation deja existante. Changez operation_ref ou supprimez les doublons.';
WHEN OTHERS THEN
  RAISE EXCEPTION 'Echec : % (%)', SQLERRM, SQLSTATE;
END;
$$;

-- Verification par plage de dates
SELECT operation_ref, client_name,
       buy_currency || '/' || sell_currency AS paire,
       amount, status, risk_score, risk_level,
       created_at::date AS date_creation,
       value_date
FROM public.operations
WHERE created_at::date BETWEEN '2026-06-14' AND '2026-06-16'
   OR created_at::date BETWEEN '2026-06-23' AND '2026-06-26'
ORDER BY created_at;
