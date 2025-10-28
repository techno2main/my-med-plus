CREATE TABLE public.medication_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pathology TEXT,
  default_posology TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  form TEXT,
  color TEXT,
  strength TEXT,
  initial_stock INTEGER DEFAULT 0,
  min_threshold INTEGER DEFAULT 10,
  default_times TEXT[] DEFAULT '{}',
  is_approved BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE public.medication_catalog IS 'Catalogue centralisé des médicaments disponibles';

ALTER TABLE public.medication_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medication_catalog_read"
  ON public.medication_catalog FOR SELECT
  USING (true);

CREATE POLICY "medication_catalog_create"
  ON public.medication_catalog FOR INSERT
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "medication_catalog_modify"
  ON public.medication_catalog FOR UPDATE
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "medication_catalog_remove"
  ON public.medication_catalog FOR DELETE
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE TRIGGER update_medication_catalog_updated_at 
  BEFORE UPDATE ON public.medication_catalog
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
