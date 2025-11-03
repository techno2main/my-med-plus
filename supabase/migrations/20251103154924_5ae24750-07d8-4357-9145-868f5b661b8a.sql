-- Créer le profil manquant pour l'utilisateur Google existant
INSERT INTO public.profiles (id, first_name, last_name, created_at, updated_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'first_name', split_part(raw_user_meta_data->>'name', ' ', 1)),
  COALESCE(raw_user_meta_data->>'last_name', split_part(raw_user_meta_data->>'name', ' ', 2)),
  NOW(),
  NOW()
FROM auth.users
WHERE id = '1f054f62-1788-4881-8d09-61fa4c9f4993'
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  updated_at = NOW();