-- =====================================================================================
-- TABLE: medications
-- Description: Médicaments dans les traitements
-- =====================================================================================

DROP TABLE IF EXISTS public.medications CASCADE;

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

-- Enable RLS
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Triggers
CREATE TRIGGER update_medications_updated_at
    BEFORE UPDATE ON public.medications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER medication_times_changed
    AFTER INSERT OR UPDATE OF times ON public.medications
    FOR EACH ROW
    EXECUTE FUNCTION auto_regenerate_intakes_on_times_change();

-- Insert data
INSERT INTO public.medications (id, treatment_id, name, posology, times, initial_stock, current_stock, min_threshold, expiry_date, created_at, updated_at, catalog_id, strength) VALUES 
('0017616d-a18d-40d9-b586-31af1025d5fe', 'b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', 'Xigduo', '1 comprimé matin et soir', '{"09:30","20:00"}', 58, 75, 10, null, '2025-10-13 16:34:33.284419+00', '2025-10-28 07:45:21.574683+00', '20cdc76f-4e18-403c-b05a-71ebd662c620', '5mg/1000mg'),
('86ef1704-fbed-4a65-b026-dc5d0ea26953', 'b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', 'Simvastatine', '1 comprimé le soir', '{"20:00"}', 27, 9, 6, null, '2025-10-13 16:34:33.284419+00', '2025-10-27 19:02:52.889226+00', 'e145c2c2-2c49-4521-9dc0-89b9f2f3c54a', '10mg'),
('98a396ee-051d-4531-bb26-62fe0ccc57e3', 'b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', 'Quviviq', '1 comprimé au coucher', '{"22:00"}', 0, 77, 10, null, '2025-10-13 16:44:56.405072+00', '2025-10-27 21:10:30.246654+00', '6a21de1a-3381-4923-b4c2-194ac8008ae8', '50mg'),
('b3087022-943f-4830-a94c-32866f856776', '4a63ab08-3985-4e13-aaed-7000c229d043', 'Doliprane', '1 comprimé matin, midi et soir', '{"09:30","12:30","19:30"}', 60, 58, 10, null, '2025-10-26 11:10:58.798737+00', '2025-10-26 14:47:12.74632+00', '61a5e9aa-7a8a-4258-9d07-6fc8dde6e42e', null),
('eb3b4d05-b031-4bae-a212-a40087bb28f0', 'b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', 'Venlafaxine', '1 comprimé au coucher', '{"22:00"}', 0, 108, 10, null, '2025-10-13 17:42:17.497951+00', '2025-10-27 21:10:32.935207+00', 'c5be88b2-d692-4a1d-8a7c-134a043ab0cd', '225mg');
