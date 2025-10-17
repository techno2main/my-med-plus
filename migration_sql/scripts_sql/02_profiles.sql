-- =====================================================
-- TABLE: public.profiles
-- Profils utilisateurs avec informations personnelles
-- =====================================================

-- STRUCTURE
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

-- RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- TRIGGER pour mise à jour automatique
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DONNÉES: Vos 2 profils complets
INSERT INTO public.profiles VALUES
('b59171b2-0716-4e1e-a68d-7267ab15a603', 'T2 TAD', NULL, '2025-10-13 13:05:04.68745+00', '2025-10-13 13:05:04.68745+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('634b0b48-e193-4827-983b-a0f7d2f1b068', NULL, '1970-12-12', '2025-10-13 13:07:34.677164+00', '2025-10-15 18:33:01.226572+00', 'Tyson', 'Nomansa', '0666101212', 'A+', 177, 78.10, 'https://phnydcqronyofqroptkf.supabase.co/storage/v1/object/public/avatars/634b0b48-e193-4827-983b-a0f7d2f1b068/avatar.jpg?t=1760391310651');