CREATE TABLE public.treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prescription_id UUID REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    pharmacy_id UUID REFERENCES public.health_professionals(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    pathology VARCHAR(255),
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.treatments IS 'Traitements médicaux';

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leurs propres traitements" ON public.treatments
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres traitements" ON public.treatments
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres traitements" ON public.treatments
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres traitements" ON public.treatments
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE TRIGGER update_treatments_updated_at
    BEFORE UPDATE ON public.treatments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
