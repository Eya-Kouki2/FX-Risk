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
