-- Script pour créer le compte démo
-- À exécuter dans le SQL Editor de Supabase

-- 1. Créer l'utilisateur Auth (via Dashboard Supabase > Authentication > Users > Invite user)
--    Email: antonymasson.tad@gmail.com
--    Password: abc123DEF!DEMO
--    Confirmer l'email automatiquement

-- 2. Une fois l'utilisateur créé, récupérer son UUID et l'insérer ci-dessous
-- Remplacer 'USER_UUID_ICI' par l'UUID réel de l'utilisateur

-- 3. Créer le profil associé
INSERT INTO profiles (
  id,
  first_name,
  last_name,
  date_of_birth,
  gender,
  blood_type,
  height,
  weight,
  created_at,
  updated_at
) VALUES (
  'USER_UUID_ICI', -- Remplacer par l'UUID de l'utilisateur créé
  'Démo',
  'MyHealth+',
  '1990-01-01',
  'other',
  NULL,
  NULL,
  NULL,
  NOW(),
  NOW()
);

-- 4. Créer les préférences utilisateur (biométrie DÉSACTIVÉE)
INSERT INTO user_preferences (
  user_id,
  theme,
  notifications_enabled,
  email_notifications,
  language,
  biometric_enabled,
  two_factor_enabled,
  created_at,
  updated_at
) VALUES (
  'USER_UUID_ICI', -- Même UUID
  'system',
  true,
  true,
  'fr',
  false, -- ⚠️ IMPORTANT : Biométrie désactivée pour les tests
  false,
  NOW(),
  NOW()
);

-- 5. (Optionnel) Ajouter un rôle
INSERT INTO user_roles (
  user_id,
  role
) VALUES (
  'USER_UUID_ICI', -- Même UUID
  'user'
);
