-- Add missing RLS policies for medication_catalog to allow updates and deletes
CREATE POLICY "Authenticated users can update medication catalog"
ON medication_catalog
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from medication catalog"
ON medication_catalog
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);