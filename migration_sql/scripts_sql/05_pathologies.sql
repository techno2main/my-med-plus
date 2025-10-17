-- =====================================================
-- TABLE: public.pathologies
-- Pathologies médicales (diabète, cholestérol, etc.)
-- =====================================================

-- STRUCTURE
CREATE TABLE public.pathologies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_approved BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id)
);

-- RLS POLICIES
ALTER TABLE public.pathologies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approved pathologies"
  ON public.pathologies FOR SELECT
  USING (((is_approved = true) OR (created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Authenticated users can create pathologies"
  ON public.pathologies FOR INSERT
  WITH CHECK (((auth.uid() IS NOT NULL) AND (created_by = auth.uid())));

CREATE POLICY "Admins can update pathologies"
  ON public.pathologies FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete pathologies"
  ON public.pathologies FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- TRIGGER pour mise à jour automatique
CREATE TRIGGER update_pathologies_updated_at BEFORE UPDATE ON public.pathologies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DONNÉES: Vos 5 pathologies exactes (created_by = NULL comme sur Lovable)
INSERT INTO public.pathologies VALUES
('dcb3503e-ac56-42e7-ade1-d75c05926f96', 'Cholestérol', 'Excès de cholestérol dans le sang', '2025-10-13 14:16:00.043063+00', '2025-10-13 14:16:00.043063+00', false, NULL),
('e9079dce-7d53-41e1-af5c-1fffd9c7c238', 'Anxiété', 'Troubles anxieux généralisés', '2025-10-13 14:16:00.043063+00', '2025-10-13 15:35:20.793449+00', false, NULL),
('51051513-8f8d-4999-9465-f2d1a3e6f2e9', 'Douleur/Fièvre', 'Symptômes ponctuels', '2025-10-13 15:20:54.928678+00', '2025-10-13 15:36:01.227607+00', false, NULL),
('a8560fee-3b94-4701-8752-8a6a292b9ab7', 'Insomnie', 'Difficulté à s''endormir ou à rester endormi', '2025-10-13 14:16:00.043063+00', '2025-10-13 15:36:10.760921+00', false, NULL),
('dc47c6b3-2245-486d-ad45-c014e8d15b27', 'Diabète T2', 'Trouble métabolique avec hyperglycémie chronique', '2025-10-13 14:16:00.043063+00', '2025-10-14 10:39:37.609815+00', false, NULL);