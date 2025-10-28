-- =====================================================================================
-- TABLE: treatments
-- Description: Traitements médicaux
-- =====================================================================================

DROP TABLE IF EXISTS public.treatments CASCADE;

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

-- Enable RLS
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Trigger for updated_at
CREATE TRIGGER update_treatments_updated_at
    BEFORE UPDATE ON public.treatments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert data
INSERT INTO public.treatments (id, user_id, prescription_id, pharmacy_id, name, pathology, start_date, end_date, notes, is_active, created_at, updated_at, description) VALUES 
('4a63ab08-3985-4e13-aaed-7000c229d043', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', '87897537-7636-4ee7-9178-7b4fee1db175', 'e38a3a24-e92d-4ea2-bee4-d06ad8e94b0d', 'DOULEURS PIED', 'Douleur/Fièvre', '2025-10-26', '2025-11-25', null, false, '2025-10-26 11:10:58.726826+00', '2025-10-26 17:57:05.998365+00', 'Traitement ponctuel'),
('b9e3808d-c8ee-45bb-8c25-fa83aa94eb0b', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', '9de5ad44-925e-40bf-8916-f0935b190356', '90969f97-f2c9-476b-979b-c97b3813cab5', 'DT2-CHL', 'Diabète Type 2, Cholestérol', '2025-10-07', '2026-01-05', 'Ordonnance du 8 septembre 2025', true, '2025-10-13 16:34:33.198177+00', '2025-10-19 19:39:11.627823+00', 'Ordonnance du 8 septembre 2025');
