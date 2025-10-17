-- =====================================================
-- TABLE: auth.users
-- Utilisateurs d'authentification Supabase
-- =====================================================

-- STRUCTURE: Gérée par Supabase Auth (pas de CREATE TABLE nécessaire)

-- DONNÉES: Vos 2 utilisateurs
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at,
    is_sso_user
) VALUES 
-- Utilisateur 1: techno2main@gmail.com
(
    '00000000-0000-0000-0000-000000000000',
    'b59f7fb2-0716-4e1e-a68d-7267ab15a603',
    'authenticated',
    'authenticated',
    'techno2main@gmail.com',
    '$2a$10$K7MgKrTVHYrB8f8VYOKkJhTrV8PcJhKq8rS9QK7MgKrTVHYrB8f8VY',
    '2025-10-13 13:05:04+00',
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Techno2main"}',
    '2025-10-13 13:05:04+00',
    '2025-10-13 20:43:32+00',
    '2025-10-13 20:43:32+00',
    false
),
-- Utilisateur 2: tyson.nomansa@gmail.com  
(
    '00000000-0000-0000-0000-000000000000',
    '634b0b48-e193-4827-983b-a0f7d2f1b068',
    'authenticated',
    'authenticated',
    'tyson.nomansa@gmail.com',
    '$2a$10$K7MgKrTVHYrB8f8VYOKkJhTrV8PcJhKq8rS9QK7MgKrTVHYrB8f8VY',
    '2025-10-13 13:07:34+00',
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Tyson Nomansa"}',
    '2025-10-13 13:07:34+00',
    '2025-10-17 13:19:26+00',
    '2025-10-17 13:19:26+00',
    false
) ON CONFLICT (id) DO NOTHING;