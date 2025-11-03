-- Fix auth RLS initialization plan warnings by optimizing auth.uid() calls

-- Drop and recreate pathologies policies with optimized auth.uid()
DROP POLICY IF EXISTS "pathologies_read" ON public.pathologies;
DROP POLICY IF EXISTS "pathologies_create" ON public.pathologies;
DROP POLICY IF EXISTS "pathologies_modify" ON public.pathologies;
DROP POLICY IF EXISTS "pathologies_remove" ON public.pathologies;

CREATE POLICY "pathologies_read" 
ON public.pathologies 
FOR SELECT 
USING (
  created_by = (SELECT auth.uid()) 
  OR is_approved = true 
  OR has_role((SELECT auth.uid()), 'admin'::app_role)
);

CREATE POLICY "pathologies_create" 
ON public.pathologies 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "pathologies_modify" 
ON public.pathologies 
FOR UPDATE 
USING (
  created_by = (SELECT auth.uid()) 
  OR has_role((SELECT auth.uid()), 'admin'::app_role)
);

CREATE POLICY "pathologies_remove" 
ON public.pathologies 
FOR DELETE 
USING (
  created_by = (SELECT auth.uid()) 
  OR has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- Drop and recreate medication_catalog policies with optimized auth.uid()
DROP POLICY IF EXISTS "medication_catalog_read" ON public.medication_catalog;
DROP POLICY IF EXISTS "medication_catalog_create" ON public.medication_catalog;
DROP POLICY IF EXISTS "medication_catalog_modify" ON public.medication_catalog;
DROP POLICY IF EXISTS "medication_catalog_remove" ON public.medication_catalog;

CREATE POLICY "medication_catalog_read" 
ON public.medication_catalog 
FOR SELECT 
USING (
  created_by = (SELECT auth.uid()) 
  OR is_approved = true 
  OR has_role((SELECT auth.uid()), 'admin'::app_role)
);

CREATE POLICY "medication_catalog_create" 
ON public.medication_catalog 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "medication_catalog_modify" 
ON public.medication_catalog 
FOR UPDATE 
USING (
  created_by = (SELECT auth.uid()) 
  OR has_role((SELECT auth.uid()), 'admin'::app_role)
);

CREATE POLICY "medication_catalog_remove" 
ON public.medication_catalog 
FOR DELETE 
USING (
  created_by = (SELECT auth.uid()) 
  OR has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- Drop and recreate allergies policies with optimized auth.uid()
DROP POLICY IF EXISTS "allergies_read" ON public.allergies;
DROP POLICY IF EXISTS "allergies_create" ON public.allergies;
DROP POLICY IF EXISTS "allergies_modify" ON public.allergies;
DROP POLICY IF EXISTS "allergies_remove" ON public.allergies;

CREATE POLICY "allergies_read" 
ON public.allergies 
FOR SELECT 
USING (
  created_by = (SELECT auth.uid()) 
  OR is_approved = true 
  OR has_role((SELECT auth.uid()), 'admin'::app_role)
);

CREATE POLICY "allergies_create" 
ON public.allergies 
FOR INSERT 
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "allergies_modify" 
ON public.allergies 
FOR UPDATE 
USING (
  created_by = (SELECT auth.uid()) 
  OR has_role((SELECT auth.uid()), 'admin'::app_role)
);

CREATE POLICY "allergies_remove" 
ON public.allergies 
FOR DELETE 
USING (
  created_by = (SELECT auth.uid()) 
  OR has_role((SELECT auth.uid()), 'admin'::app_role)
);