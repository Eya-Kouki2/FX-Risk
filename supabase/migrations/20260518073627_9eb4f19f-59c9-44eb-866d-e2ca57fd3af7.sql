
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('front_office', 'back_office', 'risk_team', 'manager', 'admin');
CREATE TYPE public.operation_status AS ENUM ('draft', 'pending', 'validated', 'rejected', 'escalated', 'settled');
CREATE TYPE public.risk_level AS ENUM ('low', 'moderate', 'high', 'critical');
CREATE TYPE public.alert_severity AS ENUM ('informational', 'moderate', 'high', 'critical');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS public.app_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 1 WHEN 'manager' THEN 2 WHEN 'risk_team' THEN 3
    WHEN 'back_office' THEN 4 WHEN 'front_office' THEN 5 END
  LIMIT 1
$$;

-- ============ OPERATIONS ============
CREATE TABLE public.operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_ref TEXT NOT NULL UNIQUE DEFAULT ('FX-' || to_char(now(), 'YYYYMMDD') || '-' || substring(gen_random_uuid()::text, 1, 6)),
  client_name TEXT NOT NULL,
  buy_currency TEXT NOT NULL,
  sell_currency TEXT NOT NULL,
  amount NUMERIC(18, 2) NOT NULL,
  exchange_rate NUMERIC(18, 6) NOT NULL,
  market_rate NUMERIC(18, 6),
  value_date DATE NOT NULL,
  counterparty TEXT NOT NULL,
  swift_reference TEXT,
  comments TEXT,
  status public.operation_status NOT NULL DEFAULT 'pending',
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_level public.risk_level NOT NULL DEFAULT 'low',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_operations_status ON public.operations(status);
CREATE INDEX idx_operations_risk ON public.operations(risk_level);
CREATE INDEX idx_operations_created_by ON public.operations(created_by);

-- ============ ALERTS ============
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id UUID REFERENCES public.operations(id) ON DELETE CASCADE,
  severity public.alert_severity NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_alerts_severity ON public.alerts(severity);
CREATE INDEX idx_alerts_ack ON public.alerts(acknowledged);

-- ============ AUDIT LOGS ============
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT 'success',
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at DESC);

-- ============ RLS POLICIES ============
-- profiles
CREATE POLICY "view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "view roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- operations
CREATE POLICY "view operations by role" ON public.operations FOR SELECT USING (
  created_by = auth.uid()
  OR public.has_role(auth.uid(), 'back_office')
  OR public.has_role(auth.uid(), 'risk_team')
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "front office creates" ON public.operations FOR INSERT WITH CHECK (
  auth.uid() = created_by AND (
    public.has_role(auth.uid(), 'front_office')
    OR public.has_role(auth.uid(), 'admin')
  )
);
CREATE POLICY "validators update" ON public.operations FOR UPDATE USING (
  public.has_role(auth.uid(), 'back_office')
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_role(auth.uid(), 'admin')
  OR (created_by = auth.uid() AND status = 'draft')
);

-- alerts
CREATE POLICY "view alerts" ON public.alerts FOR SELECT USING (
  public.has_role(auth.uid(), 'back_office')
  OR public.has_role(auth.uid(), 'risk_team')
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "ack alerts" ON public.alerts FOR UPDATE USING (
  public.has_role(auth.uid(), 'risk_team')
  OR public.has_role(auth.uid(), 'manager')
  OR public.has_role(auth.uid(), 'admin')
);

-- audit logs
CREATE POLICY "view own audit" ON public.audit_logs FOR SELECT USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'manager')
);
CREATE POLICY "insert audit" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ TRIGGERS ============
-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_operations_updated BEFORE UPDATE ON public.operations
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- new user → profile + default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, department)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(
      NEW.raw_user_meta_data->>'department',
      CASE COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'front_office')
        WHEN 'admin' THEN 'IT / Security'
        WHEN 'manager' THEN 'Executive / Management'
        WHEN 'risk_team' THEN 'Risk Management'
        WHEN 'back_office' THEN 'Back Office Operations'
        ELSE 'Front Office'
      END
    )
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'front_office'));

  RETURN NEW;
END; $$;

CREATE TRIGGER trg_handle_new_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- risk scoring engine
CREATE OR REPLACE FUNCTION public.compute_risk()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  score INTEGER := 0;
  lvl public.risk_level;
  hour_of_day INTEGER;
  rate_dev NUMERIC := 0;
  unusual_pair BOOLEAN := false;
  common_pairs TEXT[] := ARRAY['EUR/USD','USD/EUR','USD/JPY','GBP/USD','USD/GBP','USD/CHF','EUR/GBP','EUR/JPY'];
  pair TEXT;
BEGIN
  hour_of_day := EXTRACT(HOUR FROM NEW.created_at);
  pair := NEW.buy_currency || '/' || NEW.sell_currency;

  IF NEW.amount > 1000000 THEN score := score + 20; END IF;
  IF NEW.swift_reference IS NULL OR length(trim(NEW.swift_reference)) = 0 THEN
    score := score + 25;
  ELSIF NEW.swift_reference !~ '^[A-Z]{6}[A-Z0-9]{2,5}$' THEN
    score := score + 30;
  END IF;
  IF hour_of_day < 7 OR hour_of_day >= 20 THEN score := score + 15; END IF;
  IF NEW.market_rate IS NOT NULL AND NEW.market_rate > 0 THEN
    rate_dev := ABS(NEW.exchange_rate - NEW.market_rate) / NEW.market_rate;
    IF rate_dev > 0.02 THEN score := score + 20; END IF;
  END IF;
  IF NOT (pair = ANY(common_pairs)) THEN
    unusual_pair := true;
    score := score + 10;
  END IF;

  IF score <= 20 THEN lvl := 'low';
  ELSIF score <= 40 THEN lvl := 'moderate';
  ELSIF score <= 60 THEN lvl := 'high';
  ELSE lvl := 'critical'; END IF;

  NEW.risk_score := score;
  NEW.risk_level := lvl;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_operations_risk
BEFORE INSERT OR UPDATE OF amount, exchange_rate, swift_reference, market_rate, buy_currency, sell_currency
ON public.operations
FOR EACH ROW EXECUTE FUNCTION public.compute_risk();

-- alert generation
CREATE OR REPLACE FUNCTION public.generate_alerts()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE hr INTEGER;
BEGIN
  hr := EXTRACT(HOUR FROM NEW.created_at);
  IF NEW.amount > 1000000 THEN
    INSERT INTO public.alerts (operation_id, severity, category, message)
    VALUES (NEW.id, 'high', 'High Amount',
      'Transaction amount ' || NEW.amount::text || ' exceeds threshold of 1,000,000.');
  END IF;
  IF NEW.swift_reference IS NULL OR length(trim(NEW.swift_reference)) = 0 THEN
    INSERT INTO public.alerts (operation_id, severity, category, message)
    VALUES (NEW.id, 'critical', 'Missing SWIFT',
      'Operation submitted without SWIFT confirmation reference.');
  END IF;
  IF hr < 7 OR hr >= 20 THEN
    INSERT INTO public.alerts (operation_id, severity, category, message)
    VALUES (NEW.id, 'moderate', 'Late-Night Transaction',
      'Operation entered outside normal trading hours (' || hr::text || 'h).');
  END IF;
  IF NEW.risk_level = 'critical' THEN
    INSERT INTO public.alerts (operation_id, severity, category, message)
    VALUES (NEW.id, 'critical', 'Critical Risk Score',
      'Operation risk score reached ' || NEW.risk_score::text || ' (Critical).');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_operations_alerts
AFTER INSERT ON public.operations
FOR EACH ROW EXECUTE FUNCTION public.generate_alerts();
