-- Fonction pour synchroniser l'avatar Google depuis auth.users vers profiles
CREATE OR REPLACE FUNCTION public.sync_google_avatar_to_profile(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
  avatar_url_value text;
  first_name_value text;
  last_name_value text;
BEGIN
  -- Récupérer les données depuis auth.users
  SELECT 
    raw_user_meta_data->>'avatar_url',
    COALESCE(raw_user_meta_data->>'first_name', split_part(email, '@', 1)),
    raw_user_meta_data->>'last_name'
  INTO avatar_url_value, first_name_value, last_name_value
  FROM auth.users
  WHERE id = user_uuid;

  -- Mettre à jour le profil
  UPDATE public.profiles
  SET 
    avatar_url = COALESCE(avatar_url_value, avatar_url),
    first_name = COALESCE(first_name_value, first_name),
    last_name = COALESCE(last_name_value, last_name),
    updated_at = NOW()
  WHERE id = user_uuid;
END;
$$;

-- Synchroniser l'avatar pour l'utilisateur actuel
SELECT sync_google_avatar_to_profile('1f054f62-1788-4881-8d09-61fa4c9f4993');