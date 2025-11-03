-- Migration pour améliorer la récupération de l'avatar Google OAuth
-- Date: 2025-11-03
-- Description: Modifier le trigger handle_new_user pour récupérer l'avatar depuis user_metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1),
      split_part(NEW.raw_user_meta_data->>'name', ' ', 1),
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NULLIF(split_part(NEW.raw_user_meta_data->>'full_name', ' ', 2), ''),
      NULLIF(split_part(NEW.raw_user_meta_data->>'name', ' ', 2), '')
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = COALESCE(
      EXCLUDED.avatar_url,
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      profiles.avatar_url
    ),
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Commenter le changement
COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger pour créer/mettre à jour le profil lors de la création/connexion utilisateur.
Récupère automatiquement avatar_url ou picture depuis raw_user_meta_data (OAuth Google).
Mise à jour: 2025-11-03 - Amélioration récupération avatar Google';
