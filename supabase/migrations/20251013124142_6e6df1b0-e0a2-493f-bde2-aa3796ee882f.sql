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