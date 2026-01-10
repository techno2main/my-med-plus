-- =====================================================
-- SECURITY FIX: Policies manquantes et protection stockage
-- =====================================================

-- 1. Ajouter politique DELETE sur profiles pour conformité RGPD
CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING ((SELECT auth.uid()) = id);

-- 2. Ajouter politique DELETE sur user_preferences
CREATE POLICY "Users can delete own preferences" 
ON public.user_preferences 
FOR DELETE 
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- 3. Vérifier/créer les politiques de stockage pour le bucket prescriptions
-- (S'assurer que le bucket est privé et accessible uniquement par le propriétaire)

-- Politique SELECT pour le bucket prescriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view own prescriptions'
  ) THEN
    CREATE POLICY "Users can view own prescriptions"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'prescriptions' 
      AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );
  END IF;
END $$;

-- Politique INSERT pour le bucket prescriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload own prescriptions'
  ) THEN
    CREATE POLICY "Users can upload own prescriptions"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'prescriptions' 
      AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );
  END IF;
END $$;

-- Politique UPDATE pour le bucket prescriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own prescriptions'
  ) THEN
    CREATE POLICY "Users can update own prescriptions"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'prescriptions' 
      AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );
  END IF;
END $$;

-- Politique DELETE pour le bucket prescriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own prescriptions'
  ) THEN
    CREATE POLICY "Users can delete own prescriptions"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'prescriptions' 
      AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );
  END IF;
END $$;