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

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER update_prescriptions_updated_at
    BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
