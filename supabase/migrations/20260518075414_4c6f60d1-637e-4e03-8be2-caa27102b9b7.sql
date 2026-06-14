DROP POLICY IF EXISTS "validators update" ON public.operations;
CREATE POLICY "validators update" ON public.operations FOR UPDATE
USING (
  public.has_role(auth.uid(), 'back_office') OR
  public.has_role(auth.uid(), 'risk_team') OR
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'admin') OR
  (created_by = auth.uid() AND status IN ('draft','rejected'))
)
WITH CHECK (
  public.has_role(auth.uid(), 'back_office') OR
  public.has_role(auth.uid(), 'risk_team') OR
  public.has_role(auth.uid(), 'manager') OR
  public.has_role(auth.uid(), 'admin') OR
  (created_by = auth.uid() AND status IN ('draft','rejected','pending'))
);

-- Triggers to wire risk + alerts (in case missing)
DROP TRIGGER IF EXISTS trg_operations_risk ON public.operations;
DROP TRIGGER IF EXISTS trg_compute_risk ON public.operations;
CREATE TRIGGER trg_compute_risk BEFORE INSERT OR UPDATE ON public.operations
FOR EACH ROW EXECUTE FUNCTION public.compute_risk();

DROP TRIGGER IF EXISTS trg_operations_alerts ON public.operations;
DROP TRIGGER IF EXISTS trg_generate_alerts ON public.operations;
CREATE TRIGGER trg_generate_alerts AFTER INSERT ON public.operations
FOR EACH ROW EXECUTE FUNCTION public.generate_alerts();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;
CREATE TRIGGER trg_handle_new_user AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();