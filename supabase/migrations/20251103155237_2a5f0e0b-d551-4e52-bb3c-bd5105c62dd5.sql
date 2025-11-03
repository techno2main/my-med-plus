-- Corriger le trigger pour utiliser le bon champ 'picture' de Google
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insérer ou mettre à jour le profil avec les données Google
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
      split_part(NEW.raw_user_meta_data->>'name', ' ', 1),
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      split_part(NEW.raw_user_meta_data->>'name', ' ', 2)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'picture',
      NEW.raw_user_meta_data->>'avatar_url'
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Mettre à jour le profil existant avec l'avatar Google
UPDATE public.profiles p
SET avatar_url = u.raw_user_meta_data->>'picture',
    updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND u.id = '1f054f62-1788-4881-8d09-61fa4c9f4993'
  AND u.raw_user_meta_data->>'picture' IS NOT NULL;