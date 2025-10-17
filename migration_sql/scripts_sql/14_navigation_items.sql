-- =====================================================
-- TABLE: public.navigation_items
-- Éléments de navigation de l'application
-- =====================================================

-- STRUCTURE
CREATE TABLE public.navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  icon TEXT NOT NULL,
  position INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS POLICIES
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view navigation items"
  ON public.navigation_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert navigation items"
  ON public.navigation_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update navigation items"
  ON public.navigation_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete navigation items"
  ON public.navigation_items FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- TRIGGER pour mise à jour automatique
CREATE TRIGGER update_navigation_items_updated_at BEFORE UPDATE ON public.navigation_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DONNÉES: Vos 8 éléments de navigation
INSERT INTO public.navigation_items VALUES
('0432d197-cd60-4882-8ab1-7ed3e690abed', 'Home', '/', 'Home', 1, true, '2025-10-13 21:09:10.522544+00', '2025-10-13 21:09:10.522544+00'),
('12bb4df0-9808-4edc-807d-a704c02031ef', 'Traitements', '/treatments', 'Pill', 2, true, '2025-10-13 21:09:10.522544+00', '2025-10-13 21:09:10.522544+00'),
('22126977-8642-4318-893c-3be26c96f1d5', 'Calendrier', '/calendar', 'Calendar', 3, true, '2025-10-13 21:09:10.522544+00', '2025-10-13 21:09:10.522544+00'),
('793a7a22-868a-4a89-a2c5-bc1336b1e4a0', 'Historique', '/history', 'Search', 4, true, '2025-10-15 09:26:17.565845+00', '2025-10-15 09:26:17.565845+00'),
('e68e36f6-8dcc-43fd-8b0d-a86d7a80e394', 'Ordonnances', '/prescriptions', 'FileText', 5, true, '2025-10-15 09:24:12.181446+00', '2025-10-15 09:24:12.181446+00'),
('d26607a1-c2dc-476d-8575-9d599f1d2b2f', 'Stock', '/stock', 'Package', 6, true, '2025-10-13 21:09:10.522544+00', '2025-10-13 21:09:10.522544+00'),
('50b19d08-bd1a-46a2-ac6a-18fc92ccabd4', 'Réglages', '/settings', 'Settings', 7, true, '2025-10-13 21:09:10.522544+00', '2025-10-13 21:09:10.522544+00'),
('5e27c5b1-e1de-4eb1-a149-a39916193eca', 'Admin', '/admin', 'Shield', 8, true, '2025-10-13 21:55:32.021956+00', '2025-10-13 21:55:32.021956+00');