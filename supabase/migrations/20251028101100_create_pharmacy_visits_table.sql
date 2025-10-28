CREATE TABLE public.pharmacy_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
    pharmacy_id UUID REFERENCES public.health_professionals(id) ON DELETE SET NULL,
    visit_date DATE NOT NULL,
    actual_visit_date DATE,
    visit_number INTEGER,
    is_completed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.pharmacy_visits IS 'Visites en pharmacie pour renouvellement de traitements';

ALTER TABLE public.pharmacy_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs propres visites" ON public.pharmacy_visits
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.treatments t
            WHERE t.id = pharmacy_visits.treatment_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Les utilisateurs peuvent créer leurs propres visites" ON public.pharmacy_visits
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.treatments t
            WHERE t.id = pharmacy_visits.treatment_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres visites" ON public.pharmacy_visits
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.treatments t
            WHERE t.id = pharmacy_visits.treatment_id
            AND t.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.treatments t
            WHERE t.id = pharmacy_visits.treatment_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres visites" ON public.pharmacy_visits
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.treatments t
            WHERE t.id = pharmacy_visits.treatment_id
            AND t.user_id = auth.uid()
        )
    );

CREATE TRIGGER update_pharmacy_visits_updated_at
    BEFORE UPDATE ON public.pharmacy_visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
