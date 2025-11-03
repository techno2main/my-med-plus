-- =====================================================
-- FIX: Force created_by in RLS policies and schema
-- STEP 1: Update NULL values first
-- Date: 3 novembre 2025
-- =====================================================

-- Update existing NULL created_by to first admin
UPDATE public.pathologies 
SET created_by = '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb'
WHERE created_by IS NULL;

UPDATE public.medication_catalog 
SET created_by = '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb'
WHERE created_by IS NULL;

UPDATE public.allergies 
SET created_by = '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb'
WHERE created_by IS NULL;

-- Now make columns NOT NULL
ALTER TABLE public.pathologies 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE public.medication_catalog 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT auth.uid();

ALTER TABLE public.allergies 
  ALTER COLUMN created_by SET NOT NULL,
  ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Drop and recreate INSERT policies to force created_by = auth.uid()
DROP POLICY IF EXISTS "pathologies_create" ON public.pathologies;
CREATE POLICY "pathologies_create"
  ON public.pathologies FOR INSERT
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (SELECT auth.uid()) IS NOT NULL
  );

DROP POLICY IF EXISTS "medication_catalog_create" ON public.medication_catalog;
CREATE POLICY "medication_catalog_create"
  ON public.medication_catalog FOR INSERT
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (SELECT auth.uid()) IS NOT NULL
  );

DROP POLICY IF EXISTS "allergies_create" ON public.allergies;
CREATE POLICY "allergies_create"
  ON public.allergies FOR INSERT
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (SELECT auth.uid()) IS NOT NULL
  );