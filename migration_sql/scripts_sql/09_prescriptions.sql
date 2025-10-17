-- =====================================================
-- TABLE: public.prescriptions
-- Ordonnances médicales
-- =====================================================

-- STRUCTURE
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prescribing_doctor_id UUID REFERENCES public.health_professionals(id) ON DELETE SET NULL,
  prescription_date DATE NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 90,
  notes TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  file_path TEXT,
  original_filename TEXT
);

-- RLS POLICIES
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prescriptions"
  ON public.prescriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prescriptions"
  ON public.prescriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prescriptions"
  ON public.prescriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prescriptions"
  ON public.prescriptions FOR DELETE
  USING (auth.uid() = user_id);

-- TRIGGER pour mise à jour automatique
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DONNÉES: Votre prescription
INSERT INTO public.prescriptions VALUES
('9de5ad44-925e-40bf-8916-f0935b190356', '634b0b48-e193-4827-983b-a0f7d2f1b068', '297348e4-e97b-4f52-a9a9-295947c1f0ad', '2025-10-07', 90, NULL, NULL, '2025-10-13 16:34:33.111555+00', '2025-10-16 18:00:30.899187+00', '634b0b48-e193-4827-983b-a0f7d2f1b068/1760373269587.pdf', 'O-2025-09-08-AD.pdf');