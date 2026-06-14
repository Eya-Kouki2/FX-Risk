-- Keep a single risk trigger and a single alert trigger on operations.
-- Older migrations used these legacy names before the canonical triggers were added.
DROP TRIGGER IF EXISTS trg_operations_risk ON public.operations;
DROP TRIGGER IF EXISTS trg_operations_alerts ON public.operations;
