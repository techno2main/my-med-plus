-- =====================================================
-- TABLE: public.medications
-- Médicaments dans les traitements actifs
-- =====================================================

-- STRUCTURE
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID REFERENCES public.treatments(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  times TEXT[] NOT NULL,
  initial_stock INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  min_threshold INTEGER DEFAULT 10,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  catalog_id UUID REFERENCES public.medication_catalog(id),
  dosage_amount TEXT
);

-- RLS POLICIES
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medications"
  ON public.medications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = medications.treatment_id
    AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own medications"
  ON public.medications FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = medications.treatment_id
    AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own medications"
  ON public.medications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = medications.treatment_id
    AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own medications"
  ON public.medications FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = medications.treatment_id
    AND treatments.user_id = auth.uid()
  ));

-- TRIGGER pour mise à jour automatique
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DONNÉES: Vos 4 médicaments actifs
INSERT INTO public.medications VALUES
('86ef1704-fbed-4a65-b026-dc5d0ea26953', 'b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', 'Simvastatine', '1 comprimé le soir', ARRAY['19:00'], 27, 21, 10, NULL, '2025-10-13 16:34:33.284419+00', '2025-10-16 16:42:42.165961+00', 'e145c2c2-2c49-4521-9dc0-89b9f2f3c54a', '10mg'),
('eb3b4d05-b031-4bae-a212-a40087bb28f0', 'b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', 'Venlafaxine', '1 comprimé le soir', ARRAY['22:00'], 0, 119, 10, NULL, '2025-10-13 17:42:17.497951+00', '2025-10-16 21:34:05.065396+00', 'c5be88b2-d692-4a1d-8a7c-134a043ab0cd', '225mg'),
('98a396ee-051d-4531-bb26-62fe0ccc57e3', 'b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', 'Quviviq', '1 comprimé le soir', ARRAY['22:30'], 0, 127, 10, NULL, '2025-10-13 16:44:56.405072+00', '2025-10-16 21:34:06.500154+00', '6a21de1a-3381-4923-b4c2-194ac8008ae8', '50mg'),
('0017616d-a18d-40d9-b586-31af1025d5fe', 'b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', 'Xigduo', '1 comprimé matin et soir', ARRAY['19:00','09:30'], 58, 100, 10, NULL, '2025-10-13 16:34:33.284419+00', '2025-10-17 08:33:34.822416+00', '20cdc76f-4e18-403c-b05a-71ebd662c620', '5mg');