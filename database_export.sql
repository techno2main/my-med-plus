-- =====================================================
-- MyHealthPlus - Complete Database Schema Export
-- Generated: 2025-10-13
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- =====================================================
-- TABLES
-- =====================================================

-- Profiles Table
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  date_of_birth date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User Roles Table
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Pathologies Table
CREATE TABLE public.pathologies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.pathologies ENABLE ROW LEVEL SECURITY;

-- Allergies Table
CREATE TABLE public.allergies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  severity text,
  description text,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;

-- Health Professionals Table
CREATE TABLE public.health_professionals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  specialty text,
  phone text,
  email text,
  address text,
  is_primary_doctor boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.health_professionals ENABLE ROW LEVEL SECURITY;

-- Prescriptions Table
CREATE TABLE public.prescriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prescribing_doctor_id uuid,
  prescription_date date NOT NULL,
  duration_days integer NOT NULL DEFAULT 90,
  notes text,
  document_url text,
  file_path text,
  original_filename text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Medication Catalog Table
CREATE TABLE public.medication_catalog (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pathology text,
  description text,
  default_dosage text,
  dosage_amount text,
  form text,
  color text,
  default_times text[] DEFAULT ARRAY[]::text[],
  min_threshold integer DEFAULT 10,
  initial_stock integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.medication_catalog ENABLE ROW LEVEL SECURITY;

-- Treatments Table
CREATE TABLE public.treatments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  pathology text,
  prescription_id uuid,
  pharmacy_id uuid,
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

-- Medications Table
CREATE TABLE public.medications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  treatment_id uuid NOT NULL,
  catalog_id uuid,
  name text NOT NULL,
  dosage text NOT NULL,
  dosage_amount text,
  times text[] NOT NULL,
  initial_stock integer DEFAULT 0,
  current_stock integer DEFAULT 0,
  min_threshold integer DEFAULT 10,
  expiry_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- Medication Intakes Table
CREATE TABLE public.medication_intakes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  medication_id uuid NOT NULL,
  scheduled_time timestamp with time zone NOT NULL,
  taken_at timestamp with time zone,
  status text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.medication_intakes ENABLE ROW LEVEL SECURITY;

-- Pharmacy Visits Table
CREATE TABLE public.pharmacy_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  treatment_id uuid NOT NULL,
  pharmacy_id uuid,
  visit_date date NOT NULL,
  visit_number integer NOT NULL,
  is_completed boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.pharmacy_visits ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STORAGE
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: Check user role (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
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

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User Roles Policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Pathologies Policies
CREATE POLICY "Everyone can view pathologies"
  ON public.pathologies FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add pathologies"
  ON public.pathologies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update pathologies"
  ON public.pathologies FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete pathologies"
  ON public.pathologies FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Allergies Policies
CREATE POLICY "Users can view own allergies"
  ON public.allergies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add own allergies"
  ON public.allergies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own allergies"
  ON public.allergies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own allergies"
  ON public.allergies FOR DELETE
  USING (auth.uid() = user_id);

-- Health Professionals Policies
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

-- Prescriptions Policies
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

-- Medication Catalog Policies
CREATE POLICY "Authenticated users can view medication catalog"
  ON public.medication_catalog FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can add to medication catalog"
  ON public.medication_catalog FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update medication catalog"
  ON public.medication_catalog FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete from medication catalog"
  ON public.medication_catalog FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Treatments Policies
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

-- Medications Policies
CREATE POLICY "Users can view own medications"
  ON public.medications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM treatments
    WHERE treatments.id = medications.treatment_id
      AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own medications"
  ON public.medications FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM treatments
    WHERE treatments.id = medications.treatment_id
      AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own medications"
  ON public.medications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM treatments
    WHERE treatments.id = medications.treatment_id
      AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own medications"
  ON public.medications FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM treatments
    WHERE treatments.id = medications.treatment_id
      AND treatments.user_id = auth.uid()
  ));

-- Medication Intakes Policies
CREATE POLICY "Users can view own medication intakes"
  ON public.medication_intakes FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM medications m
    JOIN treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
      AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own medication intakes"
  ON public.medication_intakes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1
    FROM medications m
    JOIN treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
      AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own medication intakes"
  ON public.medication_intakes FOR UPDATE
  USING (EXISTS (
    SELECT 1
    FROM medications m
    JOIN treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
      AND t.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own medication intakes"
  ON public.medication_intakes FOR DELETE
  USING (EXISTS (
    SELECT 1
    FROM medications m
    JOIN treatments t ON t.id = m.treatment_id
    WHERE m.id = medication_intakes.medication_id
      AND t.user_id = auth.uid()
  ));

-- Pharmacy Visits Policies
CREATE POLICY "Users can view own pharmacy visits"
  ON public.pharmacy_visits FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM treatments
    WHERE treatments.id = pharmacy_visits.treatment_id
      AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own pharmacy visits"
  ON public.pharmacy_visits FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM treatments
    WHERE treatments.id = pharmacy_visits.treatment_id
      AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own pharmacy visits"
  ON public.pharmacy_visits FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM treatments
    WHERE treatments.id = pharmacy_visits.treatment_id
      AND treatments.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own pharmacy visits"
  ON public.pharmacy_visits FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM treatments
    WHERE treatments.id = pharmacy_visits.treatment_id
      AND treatments.user_id = auth.uid()
  ));

-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- Prescriptions Bucket Policies
CREATE POLICY "Users can view their own prescription files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'prescriptions' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own prescription files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'prescriptions' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own prescription files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'prescriptions' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own prescription files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'prescriptions' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- NOTES
-- =====================================================
-- Ce fichier contient la structure complète de votre base de données MyHealthPlus.
-- Il inclut :
-- - 11 tables avec leurs colonnes et contraintes
-- - 1 enum (app_role)
-- - 3 fonctions (handle_new_user, update_updated_at_column, has_role)
-- - 1 trigger (on_auth_user_created)
-- - Toutes les policies RLS pour chaque table
-- - Les policies de stockage pour le bucket prescriptions
-- 
-- Pour exporter également les données, utilisez pg_dump avec l'option --data-only
