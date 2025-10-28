-- =====================================================
-- TABLE: public.allergies
-- Allergies connues
-- Date: 28 octobre 2025
-- =====================================================

-- DROP EXISTING
DROP TABLE IF EXISTS public.allergies CASCADE;

-- CREATE TABLE
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

-- ENABLE RLS
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users can view all allergies"
  ON public.allergies FOR SELECT
  USING (true);

-- TRIGGER
CREATE TRIGGER update_allergies_updated_at 
  BEFORE UPDATE ON public.allergies
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- INSERT DATA
INSERT INTO "public"."allergies" ("id", "name", "severity", "description", "created_at", "updated_at", "user_id") 
VALUES 
('03217b5f-1b70-465c-88d4-1f0db218af39', 'Bactrim', 'Modérée', 'Association sulfaméthoxazole-triméthoprime', '2025-10-13 14:16:00.043063+00', '2025-10-13 15:35:03.203737+00', null),
('671c4659-ba88-4942-b394-380cc4a0b46f', 'Totapem', 'Sévère', 'Antibiotique céphalosporine', '2025-10-13 14:16:00.043063+00', '2025-10-13 15:35:07.088007+00', null),
('a58a2327-6232-4426-81bd-c62689380030', 'Amoxicilline', 'Sévère', 'Antibiotique de la famille des pénicillines', '2025-10-13 14:16:00.043063+00', '2025-10-13 15:34:57.236817+00', null);
