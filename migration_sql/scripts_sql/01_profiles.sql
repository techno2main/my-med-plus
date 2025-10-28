-- =====================================================
-- TABLE: public.profiles
-- Profils utilisateurs avec informations personnelles
-- Date: 28 octobre 2025
-- =====================================================

-- DROP EXISTING
DROP TABLE IF EXISTS public.profiles CASCADE;

-- CREATE TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  blood_type TEXT,
  height INTEGER,
  weight NUMERIC(5,2),
  avatar_url TEXT
);

COMMENT ON TABLE public.profiles IS 'Profils utilisateurs avec informations personnelles et médicales de base';

-- ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);

-- TRIGGER
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- INSERT DATA
INSERT INTO "public"."profiles" ("id", "full_name", "date_of_birth", "created_at", "updated_at", "first_name", "last_name", "phone", "blood_type", "height", "weight", "avatar_url") 
VALUES ('40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', null, '1970-12-12', '2025-10-13 13:07:34.677164+00', '2025-10-18 12:05:18.527115+00', 'Tyson', 'Jackson', '0666101212', 'A+', '177', '78.10', 'https://rozkooglygxyaaedvebn.supabase.co/storage/v1/object/public/avatars/40f221e1-3fcb-4b03-b9b2-5bf8142a37cb/avatar.jpg');
