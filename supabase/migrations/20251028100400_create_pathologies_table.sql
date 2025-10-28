CREATE TABLE public.pathologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_approved BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE public.pathologies IS 'Catalogue des pathologies médicales';

ALTER TABLE public.pathologies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pathologies_read"
  ON public.pathologies FOR SELECT
  USING (true);

CREATE POLICY "pathologies_create"
  ON public.pathologies FOR INSERT
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "pathologies_modify"
  ON public.pathologies FOR UPDATE
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "pathologies_remove"
  ON public.pathologies FOR DELETE
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE TRIGGER update_pathologies_updated_at 
  BEFORE UPDATE ON public.pathologies
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
