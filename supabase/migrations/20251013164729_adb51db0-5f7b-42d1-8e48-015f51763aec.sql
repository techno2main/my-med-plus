-- Add stock fields to medication_catalog table
ALTER TABLE public.medication_catalog
ADD COLUMN IF NOT EXISTS initial_stock integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_threshold integer DEFAULT 10;