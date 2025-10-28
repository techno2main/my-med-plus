-- =====================================================================================
-- TABLE: pharmacy_visits
-- Description: Visites en pharmacie
-- =====================================================================================

DROP TABLE IF EXISTS public.pharmacy_visits CASCADE;

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

-- Enable RLS
ALTER TABLE public.pharmacy_visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Trigger for updated_at
CREATE TRIGGER update_pharmacy_visits_updated_at
    BEFORE UPDATE ON public.pharmacy_visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert data
INSERT INTO public.pharmacy_visits (id, treatment_id, pharmacy_id, visit_date, visit_number, is_completed, notes, created_at, updated_at, actual_visit_date) VALUES 
('28e90775-14eb-4ff7-ae65-51210f4a22ea', 'b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', '90969f97-f2c9-476b-979b-c97b3813cab5', '2025-11-06', 2, false, null, '2025-10-13 16:34:33.364388+00', '2025-10-27 14:59:43.227176+00', null),
('b85cbc59-be91-4d49-bf88-360aea84c024', 'b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', '90969f97-f2c9-476b-979b-c97b3813cab5', '2025-10-07', 1, true, null, '2025-10-13 16:34:33.364388+00', '2025-10-16 18:12:54.730655+00', '2025-10-07'),
('c6be868c-6824-4b6a-9db4-9bb4e84fd600', '4a63ab08-3985-4e13-aaed-7000c229d043', 'e38a3a24-e92d-4ea2-bee4-d06ad8e94b0d', '2025-10-27', 1, false, null, '2025-10-26 11:10:58.867394+00', '2025-10-26 15:22:04.701068+00', null),
('e24f375b-d15e-416f-92a0-395a00bc6d59', 'b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', '90969f97-f2c9-476b-979b-c97b3813cab5', '2025-12-06', 3, false, null, '2025-10-13 16:34:33.364388+00', '2025-10-26 15:22:04.701068+00', null);
