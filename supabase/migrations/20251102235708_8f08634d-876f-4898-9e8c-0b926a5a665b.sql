-- =====================================================
-- PHASE 7: SYSTÈME MULTI-UTILISATEURS POUR RÉFÉRENTIELS
-- =====================================================

-- 1. Ajouter created_by à la table allergies
ALTER TABLE public.allergies 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Ajouter is_approved à allergies pour cohérence
ALTER TABLE public.allergies 
ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

-- =====================================================
-- 3. MODIFIER LES RLS POLICIES - PATHOLOGIES
-- =====================================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "pathologies_create" ON public.pathologies;
DROP POLICY IF EXISTS "pathologies_modify" ON public.pathologies;
DROP POLICY IF EXISTS "pathologies_remove" ON public.pathologies;
DROP POLICY IF EXISTS "pathologies_read" ON public.pathologies;

-- Nouvelle policy SELECT : voir ses propres pathologies OU celles approuvées OU être admin
CREATE POLICY "pathologies_read" ON public.pathologies
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR is_approved = true 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Nouvelle policy INSERT : tout utilisateur authentifié peut créer
CREATE POLICY "pathologies_create" ON public.pathologies
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Nouvelle policy UPDATE : uniquement le créateur OU admin
CREATE POLICY "pathologies_modify" ON public.pathologies
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Nouvelle policy DELETE : uniquement le créateur OU admin
CREATE POLICY "pathologies_remove" ON public.pathologies
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- =====================================================
-- 4. MODIFIER LES RLS POLICIES - MEDICATION_CATALOG
-- =====================================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "medication_catalog_create" ON public.medication_catalog;
DROP POLICY IF EXISTS "medication_catalog_modify" ON public.medication_catalog;
DROP POLICY IF EXISTS "medication_catalog_remove" ON public.medication_catalog;
DROP POLICY IF EXISTS "medication_catalog_read" ON public.medication_catalog;

-- Nouvelle policy SELECT : voir ses propres médicaments OU ceux approuvés OU être admin
CREATE POLICY "medication_catalog_read" ON public.medication_catalog
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR is_approved = true 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Nouvelle policy INSERT : tout utilisateur authentifié peut créer
CREATE POLICY "medication_catalog_create" ON public.medication_catalog
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Nouvelle policy UPDATE : uniquement le créateur OU admin
CREATE POLICY "medication_catalog_modify" ON public.medication_catalog
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Nouvelle policy DELETE : uniquement le créateur OU admin
CREATE POLICY "medication_catalog_remove" ON public.medication_catalog
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- =====================================================
-- 5. MODIFIER LES RLS POLICIES - ALLERGIES
-- =====================================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view all allergies" ON public.allergies;
DROP POLICY IF EXISTS "allergies_create" ON public.allergies;
DROP POLICY IF EXISTS "allergies_modify" ON public.allergies;
DROP POLICY IF EXISTS "allergies_remove" ON public.allergies;

-- Nouvelle policy SELECT : voir ses propres allergies OU celles approuvées OU être admin
CREATE POLICY "allergies_read" ON public.allergies
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR is_approved = true 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Nouvelle policy INSERT : tout utilisateur authentifié peut créer
CREATE POLICY "allergies_create" ON public.allergies
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Nouvelle policy UPDATE : uniquement le créateur OU admin
CREATE POLICY "allergies_modify" ON public.allergies
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Nouvelle policy DELETE : uniquement le créateur OU admin
CREATE POLICY "allergies_remove" ON public.allergies
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);