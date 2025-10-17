-- =====================================================
-- TABLE: public.medication_intakes
-- HISTORIQUE COMPLET DES PRISES DE MÉDICAMENTS
-- =====================================================

-- STRUCTURE
CREATE TABLE public.medication_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  taken_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'skipped')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS POLICIES
ALTER TABLE public.medication_intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medication intakes"
  ON public.medication_intakes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.medications m
    JOIN public.treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
    AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own medication intakes"
  ON public.medication_intakes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.medications m
    JOIN public.treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
    AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own medication intakes"
  ON public.medication_intakes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.medications m
    JOIN public.treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
    AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own medication intakes"
  ON public.medication_intakes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.medications m
    JOIN public.treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
    AND t.user_id = auth.uid()
  ));

-- INDEX pour performances
CREATE INDEX idx_medication_intakes_medication_id ON public.medication_intakes(medication_id);
CREATE INDEX idx_medication_intakes_scheduled_time ON public.medication_intakes(scheduled_time DESC);
CREATE INDEX idx_medication_intakes_status ON public.medication_intakes(status);

-- TRIGGER pour mise à jour automatique
CREATE TRIGGER update_medication_intakes_updated_at BEFORE UPDATE ON public.medication_intakes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DONNÉES: VOS 20 PRISES EXACTES - HISTORIQUE COMPLET
INSERT INTO public.medication_intakes VALUES
('29691141-29ba-4612-8a37-068fc5e9e490', '0017616d-a18d-40d9-b586-31af1025d5fe', '2025-10-13 07:30:00+00', '2025-10-13 07:35:00+00', 'taken', NULL, '2025-10-13 18:06:39.095974+00', '2025-10-13 18:06:39.095974+00'),
('6cbbc5da-3d19-4bd4-95e0-786b27b0d3ed', '0017616d-a18d-40d9-b586-31af1025d5fe', '2025-10-13 07:30:00+00', '2025-10-13 07:35:00+00', 'taken', NULL, '2025-10-13 18:06:55.615427+00', '2025-10-13 18:06:55.615427+00'),
('3bc149e3-8e89-4615-abc3-5911cdb9e8c7', '98a396ee-051d-4531-bb26-62fe0ccc57e3', '2025-10-13 20:30:00+00', '2025-10-13 19:54:53.601+00', 'taken', NULL, '2025-10-13 19:54:54.228402+00', '2025-10-13 19:54:54.228402+00'),
('bd437bab-b389-4237-9778-51387df090ec', 'eb3b4d05-b031-4bae-a212-a40087bb28f0', '2025-10-13 20:00:00+00', '2025-10-13 19:54:56.002+00', 'taken', NULL, '2025-10-13 19:54:56.542983+00', '2025-10-13 19:54:56.542983+00'),
('da646409-45ab-49df-9149-bc4da2fd13f7', '0017616d-a18d-40d9-b586-31af1025d5fe', '2025-10-14 07:30:00+00', '2025-10-14 07:27:07.466+00', 'taken', NULL, '2025-10-14 07:27:08.062511+00', '2025-10-14 07:27:08.062511+00'),
('16873248-e56e-458c-bb7f-2f1c1d19ddfb', '86ef1704-fbed-4a65-b026-dc5d0ea26953', '2025-10-14 17:00:00+00', '2025-10-14 21:14:25+00', 'taken', NULL, '2025-10-14 21:14:25.129307+00', '2025-10-14 21:14:25.129307+00'),
('f7016615-fa21-4d25-b500-25d3b39f6253', '0017616d-a18d-40d9-b586-31af1025d5fe', '2025-10-14 17:00:00+00', '2025-10-14 21:14:30.08+00', 'taken', NULL, '2025-10-14 21:14:30.165046+00', '2025-10-14 21:14:30.165046+00'),
('41dfde9c-62be-4d52-86d8-698aa25e7a24', 'eb3b4d05-b031-4bae-a212-a40087bb28f0', '2025-10-14 20:00:00+00', '2025-10-14 21:14:31.864+00', 'taken', NULL, '2025-10-14 21:14:31.961378+00', '2025-10-14 21:14:31.961378+00'),
('b8edd283-3fe9-4204-928e-b33bd6fb3a2d', '98a396ee-051d-4531-bb26-62fe0ccc57e3', '2025-10-14 20:30:00+00', '2025-10-14 21:14:33.168+00', 'taken', NULL, '2025-10-14 21:14:33.262174+00', '2025-10-14 21:14:33.262174+00'),
('0a8a9d65-ed3d-4836-9598-95d7f2c18f3e', '0017616d-a18d-40d9-b586-31af1025d5fe', '2025-10-15 07:30:00+00', '2025-10-15 07:55:12.958+00', 'taken', NULL, '2025-10-15 07:55:13.111933+00', '2025-10-15 07:55:13.111933+00'),
('9d032905-9c9b-481c-979c-fb50f67e6b00', '0017616d-a18d-40d9-b586-31af1025d5fe', '2025-10-15 17:00:00+00', '2025-10-15 17:27:32.092+00', 'taken', NULL, '2025-10-15 17:27:34.864766+00', '2025-10-15 17:27:34.864766+00'),
('bff90761-7830-488f-b78d-3de4c2315505', '86ef1704-fbed-4a65-b026-dc5d0ea26953', '2025-10-15 17:00:00+00', '2025-10-15 17:27:33.84+00', 'taken', NULL, '2025-10-15 17:27:36.588742+00', '2025-10-15 17:27:36.588742+00'),
('81fcfc3a-8a43-4ef3-b791-5d4a198bfc44', 'eb3b4d05-b031-4bae-a212-a40087bb28f0', '2025-10-15 20:00:00+00', '2025-10-15 21:59:23.401+00', 'taken', NULL, '2025-10-15 21:59:26.574716+00', '2025-10-15 21:59:26.574716+00'),
('0d1cae80-2d80-49c1-9b14-6a3855497046', '98a396ee-051d-4531-bb26-62fe0ccc57e3', '2025-10-15 20:30:00+00', '2025-10-15 21:59:25.333+00', 'taken', NULL, '2025-10-15 21:59:28.432837+00', '2025-10-15 21:59:28.432837+00'),
('7aec3cdd-c642-4124-83a7-4b73c3360c36', '0017616d-a18d-40d9-b586-31af1025d5fe', '2025-10-16 07:30:00+00', '2025-10-16 07:43:20.43+00', 'taken', NULL, '2025-10-16 07:43:20.644588+00', '2025-10-16 07:43:20.644588+00'),
('6c621925-a254-4014-a37d-c126a931e68f', '86ef1704-fbed-4a65-b026-dc5d0ea26953', '2025-10-16 17:00:00+00', '2025-10-16 16:42:41.8+00', 'taken', NULL, '2025-10-16 16:42:42.029979+00', '2025-10-16 16:42:42.029979+00'),
('0f30e474-b745-4ab2-bef6-a8066fa34bb4', '0017616d-a18d-40d9-b586-31af1025d5fe', '2025-10-16 17:00:00+00', '2025-10-16 16:42:44.924+00', 'taken', NULL, '2025-10-16 16:42:45.094357+00', '2025-10-16 16:42:45.094357+00'),
('34f1f951-3910-499c-87d4-848d62260d7b', 'eb3b4d05-b031-4bae-a212-a40087bb28f0', '2025-10-16 20:00:00+00', '2025-10-16 21:34:00.252+00', 'taken', NULL, '2025-10-16 21:34:04.975808+00', '2025-10-16 21:34:04.975808+00'),
('06a8f558-7fc2-43e7-a961-6a1ca918547c', '98a396ee-051d-4531-bb26-62fe0ccc57e3', '2025-10-16 20:30:00+00', '2025-10-16 21:34:01.696+00', 'taken', NULL, '2025-10-16 21:34:06.415505+00', '2025-10-16 21:34:06.415505+00'),
('c9f43b74-ba44-4a6d-aace-ed2229017d94', '0017616d-a18d-40d9-b586-31af1025d5fe', '2025-10-17 07:30:00+00', '2025-10-17 08:33:34.389+00', 'taken', NULL, '2025-10-17 08:33:34.656807+00', '2025-10-17 08:33:34.656807+00');