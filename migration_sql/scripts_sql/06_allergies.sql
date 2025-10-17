-- =====================================================
-- TABLE: public.allergies
-- Allergies médicamenteuses de l'utilisateur
-- =====================================================

-- STRUCTURE
CREATE TABLE public.allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- RLS POLICIES
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own allergies"
  ON public.allergies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own allergies"
  ON public.allergies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own allergies"
  ON public.allergies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own allergies"
  ON public.allergies FOR DELETE
  USING (auth.uid() = user_id);

-- TRIGGER pour mise à jour automatique
CREATE TRIGGER update_allergies_updated_at BEFORE UPDATE ON public.allergies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DONNÉES: Vos 3 allergies exactes (user_id = NULL comme sur Lovable)
INSERT INTO public.allergies VALUES
('a58a2327-6232-4426-81bd-c62689380030', 'Amoxicilline', 'Sévère', 'Antibiotique de la famille des pénicillines', '2025-10-13 14:16:00.043063+00', '2025-10-13 15:34:57.236817+00', NULL),
('03217b5f-1b70-465c-88d4-1f0db218af39', 'Bactrim', 'Modérée', 'Association sulfaméthoxazole-triméthoprime', '2025-10-13 14:16:00.043063+00', '2025-10-13 15:35:03.203737+00', NULL),
('671c4659-ba88-4942-b394-380cc4a0b46f', 'Totapem', 'Sévère', 'Antibiotique céphalosporine', '2025-10-13 14:16:00.043063+00', '2025-10-13 15:35:07.088007+00', NULL);