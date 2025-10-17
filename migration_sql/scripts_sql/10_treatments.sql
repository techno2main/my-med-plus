-- =====================================================
-- TABLE: public.treatments
-- Traitements médicaux en cours ou passés
-- =====================================================

-- STRUCTURE
CREATE TABLE public.treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  pharmacy_id UUID REFERENCES public.health_professionals(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  pathology TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  description TEXT
);

-- RLS POLICIES
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own treatments"
  ON public.treatments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own treatments"
  ON public.treatments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own treatments"
  ON public.treatments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own treatments"
  ON public.treatments FOR DELETE
  USING (auth.uid() = user_id);

-- TRIGGER pour mise à jour automatique
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON public.treatments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DONNÉES: Votre traitement DT2-CHL
INSERT INTO public.treatments VALUES
('b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', '634b0b48-e193-4827-983b-a0f7d2f1b068', '9de5ad44-925e-40bf-8916-f0935b190356', '90969f97-f2c9-476b-979b-c97b3813cab5', 'DT2-CHL', 'Diabète Type 2, Cholestérol', '2025-10-07', '2026-01-05', 'Ordonnance du 8 septembre 2025', true, '2025-10-13 16:34:33.198177+00', '2025-10-16 18:00:30.899187+00', 'Ordonnance du 8 septembre 2025');