CREATE TABLE public.medication_intakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
    scheduled_time TIMESTAMPTZ NOT NULL,
    taken_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'skipped')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.medication_intakes IS 'Prises de médicaments planifiées et effectuées';
COMMENT ON COLUMN public.medication_intakes.status IS 'Statut de la prise: pending, taken, missed, skipped';
COMMENT ON COLUMN public.medication_intakes.scheduled_time IS 'Heure planifiée de la prise';
COMMENT ON COLUMN public.medication_intakes.taken_at IS 'Heure réelle de la prise';

CREATE INDEX idx_medication_intakes_medication_id ON public.medication_intakes(medication_id);
CREATE INDEX idx_medication_intakes_scheduled_time ON public.medication_intakes(scheduled_time);
CREATE INDEX idx_medication_intakes_status ON public.medication_intakes(status);
CREATE INDEX idx_medication_intakes_scheduled_status ON public.medication_intakes(scheduled_time, status);

ALTER TABLE public.medication_intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs propres prises" ON public.medication_intakes
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.medications m
            JOIN public.treatments t ON t.id = m.treatment_id
            WHERE m.id = medication_intakes.medication_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Les utilisateurs peuvent créer leurs propres prises" ON public.medication_intakes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.medications m
            JOIN public.treatments t ON t.id = m.treatment_id
            WHERE m.id = medication_intakes.medication_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres prises" ON public.medication_intakes
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.medications m
            JOIN public.treatments t ON t.id = m.treatment_id
            WHERE m.id = medication_intakes.medication_id
            AND t.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.medications m
            JOIN public.treatments t ON t.id = m.treatment_id
            WHERE m.id = medication_intakes.medication_id
            AND t.user_id = auth.uid()
        )
    );

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres prises" ON public.medication_intakes
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.medications m
            JOIN public.treatments t ON t.id = m.treatment_id
            WHERE m.id = medication_intakes.medication_id
            AND t.user_id = auth.uid()
        )
    );

CREATE TRIGGER update_medication_intakes_updated_at
    BEFORE UPDATE ON public.medication_intakes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
