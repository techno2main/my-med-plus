-- Add default_times column to medication_catalog
ALTER TABLE public.medication_catalog 
ADD COLUMN default_times text[] DEFAULT ARRAY[]::text[];

COMMENT ON COLUMN public.medication_catalog.default_times IS 'Default intake times for this medication (e.g., ["09:00", "19:00"])';