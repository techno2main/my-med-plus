-- =====================================================================================
-- TABLE: prescriptions
-- Description: Ordonnances médicales
-- =====================================================================================

DROP TABLE IF EXISTS public.prescriptions CASCADE;

CREATE TABLE public.prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prescribing_doctor_id UUID REFERENCES public.health_professionals(id) ON DELETE SET NULL,
    prescription_date DATE NOT NULL,
    duration_days INTEGER,
    notes TEXT,
    document_url TEXT,
    file_path TEXT,
    original_filename VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.prescriptions IS 'Ordonnances médicales';

-- Enable RLS
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Les utilisateurs peuvent voir leurs propres ordonnances" ON public.prescriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres ordonnances" ON public.prescriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres ordonnances" ON public.prescriptions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres ordonnances" ON public.prescriptions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert data
INSERT INTO public.prescriptions (id, user_id, prescribing_doctor_id, prescription_date, duration_days, notes, document_url, created_at, updated_at, file_path, original_filename) VALUES 
('87897537-7636-4ee7-9178-7b4fee1db175', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', 'e37df190-4f4c-4a4a-a4df-60defd7708ab', '2025-10-26', 30, null, null, '2025-10-26 11:10:58.671081+00', '2025-10-26 11:10:58.671081+00', null, null),
('9de5ad44-925e-40bf-8916-f0935b190356', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', '297348e4-e97b-4f52-a9a9-295947c1f0ad', '2025-10-07', 90, null, null, '2025-10-13 16:34:33.111555+00', '2025-10-16 18:00:30.899187+00', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb/1760373269587.pdf', 'O-2025-09-08-AD.pdf');
