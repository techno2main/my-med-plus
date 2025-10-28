-- =====================================================
-- TABLE: public.pathologies
-- Catalogue des pathologies
-- Date: 28 octobre 2025
-- =====================================================

-- DROP EXISTING
DROP TABLE IF EXISTS public.pathologies CASCADE;

-- CREATE TABLE
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

-- ENABLE RLS
ALTER TABLE public.pathologies ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
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

-- TRIGGER
CREATE TRIGGER update_pathologies_updated_at 
  BEFORE UPDATE ON public.pathologies
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- INSERT DATA
INSERT INTO "public"."pathologies" ("id", "name", "description", "created_at", "updated_at", "is_approved", "created_by") 
VALUES 
('51051513-8f8d-4999-9465-f2d1a3e6f2e9', 'Douleur/Fièvre', 'Symptômes ponctuels', '2025-10-13 15:20:54.928678+00', '2025-10-13 15:36:01.227607+00', 'false', null),
('a8560fee-3b94-4701-8752-8a6a292b9ab7', 'Insomnie', 'Troubles du sommeil', '2025-10-13 14:16:00.043063+00', '2025-10-18 08:13:09.955915+00', 'false', null),
('dc47c6b3-2245-486d-ad45-c014e8d15b27', 'Diabète T2', 'Hyperglycémie chronique', '2025-10-13 14:16:00.043063+00', '2025-10-18 08:12:55.18003+00', 'false', null),
('dcb3503e-ac56-42e7-ade1-d75c05926f96', 'Cholestérol', 'Hypercholestérolémie', '2025-10-13 14:16:00.043063+00', '2025-10-18 08:13:36.568136+00', 'false', null),
('e9079dce-7d53-41e1-af5c-1fffd9c7c238', 'Anxiété', 'Troubles anxieux', '2025-10-13 14:16:00.043063+00', '2025-10-18 08:13:16.109111+00', 'false', null);
