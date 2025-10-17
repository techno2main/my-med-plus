-- =====================================================
-- TABLE: public.pharmacy_visits
-- Visites en pharmacie (passées et futures)
-- =====================================================

-- STRUCTURE
CREATE TABLE public.pharmacy_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID REFERENCES public.treatments(id) ON DELETE CASCADE NOT NULL,
  pharmacy_id UUID REFERENCES public.health_professionals(id) ON DELETE SET NULL,
  visit_date DATE NOT NULL,
  visit_number INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  actual_visit_date DATE
);

-- RLS POLICIES
ALTER TABLE public.pharmacy_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pharmacy visits"
  ON public.pharmacy_visits FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = pharmacy_visits.treatment_id
    AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own pharmacy visits"
  ON public.pharmacy_visits FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = pharmacy_visits.treatment_id
    AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own pharmacy visits"
  ON public.pharmacy_visits FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = pharmacy_visits.treatment_id
    AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own pharmacy visits"
  ON public.pharmacy_visits FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = pharmacy_visits.treatment_id
    AND treatments.user_id = auth.uid()
  ));

-- TRIGGER pour mise à jour automatique
CREATE TRIGGER update_pharmacy_visits_updated_at BEFORE UPDATE ON public.pharmacy_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DONNÉES: Vos 3 visites pharmacie (1 passée, 2 futures)
INSERT INTO public.pharmacy_visits VALUES
('b85cbc59-be91-4d49-bf88-360aea84c024', 'b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', '90969f97-f2c9-476b-979b-c97b3813cab5', '2025-10-07', 1, true, NULL, '2025-10-13 16:34:33.364388+00', '2025-10-16 18:12:54.730655+00', '2025-10-07'),
('e24f375b-d15e-416f-92a0-395a00bc6d59', 'b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', '90969f97-f2c9-476b-979b-c97b3813cab5', '2025-12-07', 3, false, NULL, '2025-10-13 16:34:33.364388+00', '2025-10-16 18:17:42.37083+00', NULL),
('28e90775-14eb-4ff7-ae65-51210f4a22ea', 'b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', '90969f97-f2c9-476b-979b-c97b3813cab5', '2025-11-07', 2, false, NULL, '2025-10-13 16:34:33.364388+00', '2025-10-16 21:33:53.995754+00', NULL);