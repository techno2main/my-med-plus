CREATE TABLE public.allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE public.allergies IS 'Allergies et intolérances médicamenteuses';

ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all allergies"
  ON public.allergies FOR SELECT
  USING (true);

CREATE TRIGGER update_allergies_updated_at 
  BEFORE UPDATE ON public.allergies
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
