-- =====================================================
-- TABLE: public.medication_catalog
-- Catalogue des médicaments disponibles
-- =====================================================

-- STRUCTURE
CREATE TABLE public.medication_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    pathology TEXT,
    default_dosage TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    form TEXT,
    color TEXT,
    dosage_amount TEXT,
    initial_stock INTEGER DEFAULT 0,
    min_threshold INTEGER DEFAULT 10,
    default_times TEXT[] DEFAULT '{}',
    is_approved BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id)
);

-- RLS POLICIES
ALTER TABLE public.medication_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approved medications"
  ON public.medication_catalog FOR SELECT
  USING (((is_approved = true) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Authenticated users can create medications"
  ON public.medication_catalog FOR INSERT
  WITH CHECK (((auth.uid() IS NOT NULL) AND (created_by = auth.uid())));

CREATE POLICY "Admins can update medications"
  ON public.medication_catalog FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete medications"
  ON public.medication_catalog FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- TRIGGER pour mise à jour automatique
CREATE TRIGGER update_medication_catalog_updated_at BEFORE UPDATE ON public.medication_catalog
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DONNÉES: Vos 5 médicaments UNIQUEMENT (created_by = NULL comme sur Lovable)
INSERT INTO public.medication_catalog VALUES
('6a21de1a-3381-4923-b4c2-194ac8008ae8', 'Quviviq', 'Insomnie', '1 comprimé le soir', 'Troubles du Sommeil', '2025-10-13 16:41:06.990099+00', '2025-10-13 18:31:42.958251+00', NULL, NULL, '50mg', 0, 10, ARRAY['22:30'], false, NULL),
('e145c2c2-2c49-4521-9dc0-89b9f2f3c54a', 'Simvastatine', 'Cholestérol', '1 comprimé le soir', 'Hypocholestérolémiant', '2025-10-13 12:41:41.333622+00', '2025-10-13 18:31:50.831373+00', NULL, NULL, '10mg', 0, 10, ARRAY['19:00'], false, NULL),
('c5be88b2-d692-4a1d-8a7c-134a043ab0cd', 'Venlafaxine', 'Anxiété', '1 comprimé le soir', 'Anxiété chronique', '2025-10-13 16:41:43.414395+00', '2025-10-13 18:32:02.518282+00', NULL, NULL, '225mg', 0, 10, ARRAY['22:00'], false, NULL),
('5306d671-af1b-4911-b61f-51287934765e', 'Doliprane', 'Douleur/Fièvre', '1 comprimé jusqu''à 3 fois par jour', 'Antalgique et antipyrétique', '2025-10-13 12:41:41.333622+00', '2025-10-13 18:33:16.382017+00', NULL, NULL, ' 1g', 0, 10, ARRAY['10:00','16:00','22:00'], false, NULL),
('20cdc76f-4e18-403c-b05a-71ebd662c620', 'Xigduo', 'Diabète T2', '1 comprimé matin et soir', 'Metformine', '2025-10-13 12:41:41.333622+00', '2025-10-14 10:42:36.015538+00', NULL, NULL, '5mg/1000mg', 0, 10, ARRAY['09:30','19:00'], false, NULL);