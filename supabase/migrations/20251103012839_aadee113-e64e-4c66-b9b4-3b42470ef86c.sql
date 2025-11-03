-- =====================================================
-- CORRECTION RGPD CRITIQUE: Isolation des données personnelles
-- Les admins ne doivent PAS voir les données personnelles non approuvées
-- Date: 2025-11-03
-- =====================================================

-- Fix pathologies RLS policies
DROP POLICY IF EXISTS "pathologies_read" ON public.pathologies;
CREATE POLICY "pathologies_read"
  ON public.pathologies FOR SELECT
  USING (
    (created_by = auth.uid()) OR 
    (is_approved = true)
  );

-- Fix allergies RLS policies  
DROP POLICY IF EXISTS "allergies_read" ON public.allergies;
CREATE POLICY "allergies_read"
  ON public.allergies FOR SELECT
  USING (
    (created_by = auth.uid()) OR 
    (is_approved = true)
  );

-- Fix medication_catalog RLS policies
DROP POLICY IF EXISTS "medication_catalog_read" ON public.medication_catalog;
CREATE POLICY "medication_catalog_read"
  ON public.medication_catalog FOR SELECT
  USING (
    (created_by = auth.uid()) OR 
    (is_approved = true)
  );

-- Les admins gardent leurs droits de modification/suppression pour la modération
-- mais ne voient plus automatiquement les données personnelles non approuvées