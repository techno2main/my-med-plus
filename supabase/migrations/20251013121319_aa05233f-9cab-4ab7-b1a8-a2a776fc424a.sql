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