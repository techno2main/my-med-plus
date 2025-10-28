CREATE TABLE public.health_professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('doctor', 'pharmacy', 'laboratory')),
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    street_address TEXT,
    postal_code VARCHAR(10),
    city VARCHAR(100),
    is_primary_doctor BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.health_professionals IS 'Professionnels de santé (médecins, pharmacies, laboratoires)';

ALTER TABLE public.health_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture pour tous les utilisateurs authentifiés" ON public.health_professionals
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres professionnels de santé" ON public.health_professionals
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres professionnels de santé" ON public.health_professionals
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres professionnels de santé" ON public.health_professionals
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE TRIGGER update_health_professionals_updated_at
    BEFORE UPDATE ON public.health_professionals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
