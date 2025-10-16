-- =====================================================
-- MyHealth+ - Export SQL Complet
-- Genere le 10/16/2025 23:50:34
-- =====================================================


-- Migration: 20251013121319_aa05233f-9cab-4ab7-b1a8-a2a776fc424a.sql
-- -----------------------------------------------------
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

-- Create health professionals table (médecins et pharmacies)
CREATE TABLE public.health_professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('doctor', 'pharmacy')),
  name TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_primary_doctor BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.health_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health professionals"
  ON public.health_professionals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own health professionals"
  ON public.health_professionals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health professionals"
  ON public.health_professionals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health professionals"
  ON public.health_professionals FOR DELETE
  USING (auth.uid() = user_id);

-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prescribing_doctor_id UUID REFERENCES public.health_professionals(id) ON DELETE SET NULL,
  prescription_date DATE NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 90,
  notes TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prescriptions"
  ON public.prescriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prescriptions"
  ON public.prescriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prescriptions"
  ON public.prescriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own prescriptions"
  ON public.prescriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Create treatments table
CREATE TABLE public.treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
  pharmacy_id UUID REFERENCES public.health_professionals(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  pathology TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own treatments"
  ON public.treatments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own treatments"
  ON public.treatments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own treatments"
  ON public.treatments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own treatments"
  ON public.treatments FOR DELETE
  USING (auth.uid() = user_id);

-- Create medications table
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID REFERENCES public.treatments(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  times TEXT[] NOT NULL,
  initial_stock INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  min_threshold INTEGER DEFAULT 10,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medications"
  ON public.medications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = medications.treatment_id
    AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own medications"
  ON public.medications FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = medications.treatment_id
    AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own medications"
  ON public.medications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = medications.treatment_id
    AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own medications"
  ON public.medications FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = medications.treatment_id
    AND treatments.user_id = auth.uid()
  ));

-- Create pharmacy visits table
CREATE TABLE public.pharmacy_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID REFERENCES public.treatments(id) ON DELETE CASCADE NOT NULL,
  pharmacy_id UUID REFERENCES public.health_professionals(id) ON DELETE SET NULL,
  visit_date DATE NOT NULL,
  visit_number INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pharmacy_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pharmacy visits"
  ON public.pharmacy_visits FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = pharmacy_visits.treatment_id
    AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own pharmacy visits"
  ON public.pharmacy_visits FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = pharmacy_visits.treatment_id
    AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own pharmacy visits"
  ON public.pharmacy_visits FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = pharmacy_visits.treatment_id
    AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own pharmacy visits"
  ON public.pharmacy_visits FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.treatments
    WHERE treatments.id = pharmacy_visits.treatment_id
    AND treatments.user_id = auth.uid()
  ));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_professionals_updated_at BEFORE UPDATE ON public.health_professionals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON public.treatments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pharmacy_visits_updated_at BEFORE UPDATE ON public.pharmacy_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Migration: 20251013124142_6e6df1b0-e0a2-493f-bde2-aa3796ee882f.sql
-- -----------------------------------------------------
-- Create storage bucket for prescriptions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'prescriptions',
  'prescriptions',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
);

-- Create RLS policies for prescriptions bucket
CREATE POLICY "Users can upload their own prescription files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own prescription files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own prescription files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'prescriptions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create medication catalog table
CREATE TABLE public.medication_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pathology TEXT,
  default_dosage TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on medication catalog (public read)
ALTER TABLE public.medication_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view medication catalog"
ON public.medication_catalog
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add to medication catalog"
ON public.medication_catalog
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_medication_catalog_updated_at
BEFORE UPDATE ON public.medication_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add columns to prescriptions table for file storage
ALTER TABLE public.prescriptions
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Add description column to treatments
ALTER TABLE public.treatments
ADD COLUMN IF NOT EXISTS description TEXT;

-- Insert some common medications
INSERT INTO public.medication_catalog (name, pathology, default_dosage, description) VALUES
('Metformine 850mg', 'Diabète', '1 comprimé matin et soir', 'Antidiabétique oral'),
('Doliprane 1000mg', 'Douleur/Fièvre', '1 comprimé jusqu''à 3 fois par jour', 'Antalgique et antipyrétique'),
('Levothyrox 75µg', 'Thyroïde', '1 comprimé le matin à jeun', 'Hormone thyroïdienne'),
('Tahor 20mg', 'Cholestérol', '1 comprimé le soir', 'Hypocholestérolémiant'),
('Kardegic 75mg', 'Cardiovasculaire', '1 comprimé par jour', 'Antiagrégant plaquettaire');


-- Migration: 20251013124154_c2830154-6157-445e-bb0b-0b9b402665a6.sql
-- -----------------------------------------------------
-- Fix search_path for update_updated_at_column function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate all triggers that were using this function
CREATE TRIGGER update_health_professionals_updated_at
BEFORE UPDATE ON public.health_professionals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pharmacy_visits_updated_at
BEFORE UPDATE ON public.pharmacy_visits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON public.prescriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at
BEFORE UPDATE ON public.treatments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medication_catalog_updated_at
BEFORE UPDATE ON public.medication_catalog
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- Migration: 20251013125550_00dba90d-9ab0-42d4-8c42-f4d00ca197e1.sql
-- -----------------------------------------------------
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));


-- Migration: 20251013132115_710b12db-f2e7-45b4-9e22-6510487d4c7b.sql
-- -----------------------------------------------------
-- Make prescription_id nullable in treatments table since it's optional
ALTER TABLE public.treatments 
ALTER COLUMN prescription_id DROP NOT NULL;


-- Migration: 20251013135119_faecf29b-2e37-4375-aa43-51384d70b741.sql
-- -----------------------------------------------------
-- Create pathologies table
CREATE TABLE public.pathologies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pathologies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view pathologies"
ON public.pathologies
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add pathologies"
ON public.pathologies
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update pathologies"
ON public.pathologies
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete pathologies"
ON public.pathologies
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create allergies table
CREATE TABLE public.allergies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  severity TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view allergies"
ON public.allergies
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add allergies"
ON public.allergies
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update allergies"
ON public.allergies
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete allergies"
ON public.allergies
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Add new fields to medication_catalog
ALTER TABLE public.medication_catalog
ADD COLUMN form TEXT,
ADD COLUMN color TEXT,
ADD COLUMN dosage_amount TEXT;

-- Update timestamp trigger for pathologies
CREATE TRIGGER update_pathologies_updated_at
BEFORE UPDATE ON public.pathologies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update timestamp trigger for allergies
CREATE TRIGGER update_allergies_updated_at
BEFORE UPDATE ON public.allergies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();


-- Migration: 20251013141455_3850714c-2c3f-43f8-883c-a7d767a0a8e5.sql
-- -----------------------------------------------------

-- Ajouter 'laboratory' comme type valide pour health_professionals
ALTER TABLE health_professionals DROP CONSTRAINT IF EXISTS health_professionals_type_check;
ALTER TABLE health_professionals ADD CONSTRAINT health_professionals_type_check 
  CHECK (type IN ('doctor', 'pharmacy', 'laboratory'));


-- Migration: 20251013142734_489edfc1-2faa-4e58-b454-32c9a497282d.sql
-- -----------------------------------------------------
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


-- Migration: 20251013160021_ccc59fb1-8241-4718-ae04-79ce82b7cba1.sql
-- -----------------------------------------------------
-- Add catalog_id column to medications table to link with medication_catalog
ALTER TABLE public.medications 
ADD COLUMN catalog_id UUID REFERENCES public.medication_catalog(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX idx_medications_catalog_id ON public.medications(catalog_id);

-- Update existing medications to link with catalog based on name match (best effort)
UPDATE public.medications m
SET catalog_id = mc.id
FROM public.medication_catalog mc
WHERE LOWER(TRIM(m.name)) = LOWER(TRIM(mc.name))
  AND m.catalog_id IS NULL;


-- Migration: 20251013160608_b360ed46-4eac-4cb7-ba65-dff5606f6a07.sql
-- -----------------------------------------------------
-- Create medication_intakes table to track medication history
CREATE TABLE public.medication_intakes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'taken', 'skipped')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medication_intakes ENABLE ROW LEVEL SECURITY;

-- Create policies for medication_intakes
CREATE POLICY "Users can view own medication intakes"
ON public.medication_intakes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.medications m
    INNER JOIN public.treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create own medication intakes"
ON public.medication_intakes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.medications m
    INNER JOIN public.treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own medication intakes"
ON public.medication_intakes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.medications m
    INNER JOIN public.treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
    AND t.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own medication intakes"
ON public.medication_intakes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.medications m
    INNER JOIN public.treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
    AND t.user_id = auth.uid()
  )
);

-- Add indexes for better performance
CREATE INDEX idx_medication_intakes_medication_id ON public.medication_intakes(medication_id);
CREATE INDEX idx_medication_intakes_scheduled_time ON public.medication_intakes(scheduled_time DESC);
CREATE INDEX idx_medication_intakes_status ON public.medication_intakes(status);


-- Migration: 20251013164729_adb51db0-5f7b-42d1-8e48-015f51763aec.sql
-- -----------------------------------------------------
-- Add stock fields to medication_catalog table
ALTER TABLE public.medication_catalog
ADD COLUMN IF NOT EXISTS initial_stock integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_threshold integer DEFAULT 10;


-- Migration: 20251013174749_78b1831c-5ec5-4ce2-897d-896397dc514f.sql
-- -----------------------------------------------------
-- Add default_times column to medication_catalog
ALTER TABLE public.medication_catalog 
ADD COLUMN default_times text[] DEFAULT ARRAY[]::text[];

COMMENT ON COLUMN public.medication_catalog.default_times IS 'Default intake times for this medication (e.g., ["09:00", "19:00"])';


-- Migration: 20251013182129_bf6ac9b7-aa9b-4354-a141-5e55acf8d8b7.sql
-- -----------------------------------------------------
-- Add dosage_amount column to medications table
ALTER TABLE public.medications
ADD COLUMN dosage_amount TEXT;

-- Extract dosage from name and populate dosage_amount
UPDATE public.medications
SET dosage_amount = (
  SELECT substring(name FROM '(\d+(?:/\d+)?(?:mg|g|ml))')
)
WHERE name ~ '\d+(?:/\d+)?(?:mg|g|ml)';

-- Remove dosage from medication names
UPDATE public.medications
SET name = trim(regexp_replace(name, '\s*\d+(?:/\d+)?(?:mg|g|ml)\s*', ' ', 'gi'))
WHERE name ~ '\d+(?:/\d+)?(?:mg|g|ml)';


-- Migration: 20251013184855_89d9f3e8-9030-4406-b5b6-1f4dd3800dbb.sql
-- -----------------------------------------------------
-- Nettoyer les noms de médicaments qui ont des "/" orphelins
UPDATE public.medications
SET name = TRIM(REGEXP_REPLACE(name, '\s*/\s*$', '', 'g'))
WHERE name ~ '\s*/\s*$';


-- Migration: 20251013193455_cfdd35f6-9456-4398-a63a-d199e3cc5444.sql
-- -----------------------------------------------------
-- Sécurisation de la table allergies - réserver aux utilisateurs connectés
DROP POLICY IF EXISTS "Everyone can view allergies" ON public.allergies;

CREATE POLICY "Authenticated users can view allergies"
ON public.allergies
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Sécurisation de la table medication_catalog - réserver aux utilisateurs connectés
DROP POLICY IF EXISTS "Everyone can view medication catalog" ON public.medication_catalog;

CREATE POLICY "Authenticated users can view medication catalog"
ON public.medication_catalog
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);


-- Migration: 20251013193953_47ee7c41-41e1-45d2-b8b3-1231323a36c2.sql
-- -----------------------------------------------------
-- Ajouter user_id à la table allergies pour la sécuriser par utilisateur
ALTER TABLE public.allergies ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Mettre à jour les données existantes avec l'utilisateur actuel (si nécessaire)
-- Note: Les allergies existantes ne seront pas visibles car elles n'ont pas de user_id
-- L'utilisateur devra les recréer

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Authenticated users can view allergies" ON public.allergies;
DROP POLICY IF EXISTS "Authenticated users can add allergies" ON public.allergies;
DROP POLICY IF EXISTS "Authenticated users can update allergies" ON public.allergies;
DROP POLICY IF EXISTS "Authenticated users can delete allergies" ON public.allergies;

-- Créer les nouvelles policies sécurisées par utilisateur
CREATE POLICY "Users can view own allergies"
ON public.allergies
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add own allergies"
ON public.allergies
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own allergies"
ON public.allergies
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own allergies"
ON public.allergies
FOR DELETE
USING (auth.uid() = user_id);


-- Migration: 20251013210911_93fdd7de-791f-4be0-8bbc-8444210f012b.sql
-- -----------------------------------------------------
-- Create navigation_items table
CREATE TABLE public.navigation_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  path text NOT NULL,
  icon text NOT NULL,
  position integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view navigation items
CREATE POLICY "Authenticated users can view navigation items"
  ON public.navigation_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only authenticated users can manage navigation items
CREATE POLICY "Authenticated users can insert navigation items"
  ON public.navigation_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update navigation items"
  ON public.navigation_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete navigation items"
  ON public.navigation_items FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Insert default navigation items
INSERT INTO public.navigation_items (name, path, icon, position, is_active) VALUES
  ('Accueil', '/', 'Home', 1, true),
  ('Traitements', '/treatments', 'Pill', 2, true),
  ('Stock', '/stock', 'Package', 3, true),
  ('Calendrier', '/calendar', 'Calendar', 4, true),
  ('Plus', '/settings', 'Settings', 5, true);


-- Migration: 20251013212919_118b4697-62ac-4be0-9666-7282f4ea2e87.sql
-- -----------------------------------------------------
-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS blood_type TEXT,
ADD COLUMN IF NOT EXISTS height INTEGER,
ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create storage policies for avatars
CREATE POLICY "Users can view all avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);


-- Migration: 20251013220830_393380ab-af65-42da-b898-bc2be8148d86.sql
-- -----------------------------------------------------
-- Add approval system to pathologies table
ALTER TABLE public.pathologies
ADD COLUMN is_approved boolean DEFAULT false NOT NULL,
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add approval system to medication_catalog table
ALTER TABLE public.medication_catalog
ADD COLUMN is_approved boolean DEFAULT false NOT NULL,
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop existing policies for pathologies
DROP POLICY IF EXISTS "Everyone can view pathologies" ON public.pathologies;
DROP POLICY IF EXISTS "Authenticated users can add pathologies" ON public.pathologies;
DROP POLICY IF EXISTS "Authenticated users can update pathologies" ON public.pathologies;
DROP POLICY IF EXISTS "Authenticated users can delete pathologies" ON public.pathologies;

-- Create new policies for pathologies
CREATE POLICY "Users can view approved pathologies"
ON public.pathologies
FOR SELECT
USING (is_approved = true OR created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can create pathologies"
ON public.pathologies
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Admins can update pathologies"
ON public.pathologies
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete pathologies"
ON public.pathologies
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Drop existing policies for medication_catalog
DROP POLICY IF EXISTS "Authenticated users can view medication catalog" ON public.medication_catalog;
DROP POLICY IF EXISTS "Authenticated users can add to medication catalog" ON public.medication_catalog;
DROP POLICY IF EXISTS "Authenticated users can update medication catalog" ON public.medication_catalog;
DROP POLICY IF EXISTS "Authenticated users can delete from medication catalog" ON public.medication_catalog;

-- Create new policies for medication_catalog
CREATE POLICY "Users can view approved medications"
ON public.medication_catalog
FOR SELECT
USING (is_approved = true OR created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can create medications"
ON public.medication_catalog
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Admins can update medications"
ON public.medication_catalog
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete medications"
ON public.medication_catalog
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));


-- Migration: 20251015104528_3f2ca619-4aba-47a5-99c5-a764dc1d76b3.sql
-- -----------------------------------------------------
-- Ajouter une colonne pour stocker la date réelle de visite
ALTER TABLE pharmacy_visits 
ADD COLUMN actual_visit_date DATE;

COMMENT ON COLUMN pharmacy_visits.actual_visit_date IS 'Date réelle de la visite à la pharmacie (peut différer de la date planifiée)';


-- Migration: 20251015215545_cb63a9aa-058d-4cbf-bf36-bb9179a35a07.sql
-- -----------------------------------------------------
-- Table pour stocker les préférences de sécurité des utilisateurs
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  biometric_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies pour user_preferences
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- Migration: 20251016175523_0bd15f6f-1cd1-4f18-a24d-f8db4ed15513.sql
-- -----------------------------------------------------
-- Corriger les dates de fin des traitements existants en fonction du QSP de leur prescription
UPDATE treatments 
SET end_date = (start_date + INTERVAL '1 day' * (
  SELECT duration_days 
  FROM prescriptions 
  WHERE id = treatments.prescription_id
))::date
WHERE prescription_id IS NOT NULL AND end_date IS NOT NULL;


-- Migration: 20251016180033_dc2a619d-dc03-4fcf-ab45-8c2d5fac69a0.sql
-- -----------------------------------------------------
-- Corriger la date de début de l'ordonnance et du traitement DT2-CHL au 07/10/2025
UPDATE prescriptions
SET prescription_date = '2025-10-07'
WHERE id = '9de5ad44-925e-40bf-8916-f0935b190356';

UPDATE treatments
SET start_date = '2025-10-07',
    end_date = ('2025-10-07'::date + INTERVAL '1 day' * 90)::date
WHERE prescription_id = '9de5ad44-925e-40bf-8916-f0935b190356';


-- Migration: 20251016180406_8c44ebc5-81c6-46db-93b7-d0df8bcf392f.sql
-- -----------------------------------------------------
-- Corriger la date réelle du premier rechargement (Initial 1/3) pour qu'elle soit le 07/10/2025
UPDATE pharmacy_visits
SET actual_visit_date = '2025-10-07'
WHERE id = 'b85cbc59-be91-4d49-bf88-360aea84c024';


-- Migration: 20251016181255_1a0dfb81-c7d1-4577-9ef1-caf4bccbcd14.sql
-- -----------------------------------------------------
-- Mettre à jour la visite initiale avec la bonne date et marquer comme complétée
UPDATE pharmacy_visits
SET 
  actual_visit_date = '2025-10-07',
  is_completed = true
WHERE id = 'b85cbc59-be91-4d49-bf88-360aea84c024';

-- =====================================================
-- Export termine le 10/16/2025 23:50:34
-- =====================================================
