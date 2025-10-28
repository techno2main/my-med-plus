-- =====================================================================================
-- TABLE: health_professionals
-- Description: Professionnels de santé (médecins, pharmacies, laboratoires)
-- =====================================================================================

DROP TABLE IF EXISTS public.health_professionals CASCADE;

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

-- Enable RLS
ALTER TABLE public.health_professionals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Trigger for updated_at
CREATE TRIGGER update_health_professionals_updated_at
    BEFORE UPDATE ON public.health_professionals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert data
INSERT INTO public.health_professionals (id, user_id, type, name, specialty, phone, email, street_address, is_primary_doctor, created_at, updated_at, postal_code, city) VALUES 
('297348e4-e97b-4f52-a9a9-295947c1f0ad', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', 'doctor', 'Dr Alice Denambride', 'Généraliste', '01 43 05 52 22', 'alicedenambride@gmail.com', '6 Promenade Michel Simon', true, '2025-10-13 13:08:47.965359+00', '2025-10-20 18:51:34.404036+00', '93160', 'Noisy-le-Grand'),
('90969f97-f2c9-476b-979b-c97b3813cab5', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', 'pharmacy', 'Pharmacie de l''Étoile', null, '01 30 90 22 00', 'pharmacieetoile78@gmail.com', '2 Bd de la République', false, '2025-10-13 13:08:47.965359+00', '2025-10-20 18:51:34.404036+00', '78410', 'Aubergenville'),
('9676e2b0-adc1-4a1a-978a-463d767487d5', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', 'laboratory', 'Laboratoire CCR du Champy', null, '01 43 04 14 49', 'labo.champy@biogroup.fr', '3 Promenade Michel Simon', false, '2025-10-13 14:16:00.043063+00', '2025-10-20 18:51:34.404036+00', '93160', 'Noisy-le-Grand'),
('d786e12a-266d-490e-9414-56e1026327a2', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', 'laboratory', 'Laboratoire Cerballiance', null, '01 30 95 96 96', 'laboaubergenville.idfo@cerballiance.fr', '26 Rue de Quarante Sous', false, '2025-10-13 14:16:00.043063+00', '2025-10-20 18:51:34.404036+00', '78410', 'Aubergenville'),
('e37df190-4f4c-4a4a-a4df-60defd7708ab', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', 'doctor', 'Dr Y-Lan Phung', 'Généraliste', '01 43 05 52 22', 'ylan.pgh@gmail.com', '6 Promenade Michel Simon', false, '2025-10-13 13:08:47.965359+00', '2025-10-20 18:51:34.404036+00', '93160', 'Noisy-le-Grand'),
('e38a3a24-e92d-4ea2-bee4-d06ad8e94b0d', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', 'pharmacy', 'Pharmacie du Champy', null, '01 43 05 51 16', 'contact@pharmacieduchampy.fr', '20 All. Bataillon Hildevert', false, '2025-10-13 13:08:47.965359+00', '2025-10-20 18:51:34.404036+00', '93160', 'Noisy-le-Grand'),
('edcce445-dd7b-45a9-8bf6-241f4f21c929', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', 'doctor', 'Dr Faiz Kassab', 'Psychiatre', '02 30 32 19 05', 'faiz.kassab@cliniqueparc-caen.fr', '20 Avenue Capitaine Georges Guynemer', false, '2025-10-13 13:08:47.965359+00', '2025-10-20 18:51:34.404036+00', '14000', 'Caen');
