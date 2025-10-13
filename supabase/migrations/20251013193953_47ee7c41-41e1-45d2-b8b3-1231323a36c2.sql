-- Ajouter user_id à la table allergies pour la sécuriser par utilisateur
ALTER TABLE public.allergies ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Mettre à jour les données existantes avec l'utilisateur actuel (si nécessaire)
-- Note: Les allergies existantes ne seront pas visibles car elles n'ont pas de user_id
-- L'utilisateur devra les recréer

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Authenticated users can view allergies" ON public.allergies;
DROP POLICY IF EXISTS "Authenticated users can add allergies" ON public.allergies;
DROP POLICY IF EXISTS "Authenticated users can update allergies" ON public.allergies;
DROP POLICY IF EXISTS "Authenticated users can delete allergies" ON public.allergies;

-- Créer les nouvelles policies sécurisées par utilisateur
CREATE POLICY "Users can view own allergies"
ON public.allergies
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add own allergies"
ON public.allergies
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own allergies"
ON public.allergies
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own allergies"
ON public.allergies
FOR DELETE
USING (auth.uid() = user_id);