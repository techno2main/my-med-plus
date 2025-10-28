CREATE TABLE public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
    catalog_id UUID REFERENCES public.medication_catalog(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    posology TEXT NOT NULL,
    strength VARCHAR(50),
    times TEXT[] NOT NULL,
    initial_stock INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    min_threshold INTEGER DEFAULT 5,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.medications IS 'Médicaments dans les traitements';
COMMENT ON COLUMN public.medications.times IS 'Horaires de prise au format HH:MM';
COMMENT ON COLUMN public.medications.posology IS 'Posologie détaillée du médicament';

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs propres médicaments" ON public.medications
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.treatments t
            WHERE t.id = medications.treatment_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Les utilisateurs peuvent créer leurs propres médicaments" ON public.medications
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.treatments t
            WHERE t.id = medications.treatment_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres médicaments" ON public.medications
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.treatments t
            WHERE t.id = medications.treatment_id
            AND t.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.treatments t
            WHERE t.id = medications.treatment_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres médicaments" ON public.medications
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.treatments t
            WHERE t.id = medications.treatment_id
            AND t.user_id = auth.uid()
        )
    );

CREATE TRIGGER update_medications_updated_at
    BEFORE UPDATE ON public.medications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER medication_times_changed
    AFTER INSERT OR UPDATE OF times ON public.medications
    FOR EACH ROW
    EXECUTE FUNCTION auto_regenerate_intakes_on_times_change();
