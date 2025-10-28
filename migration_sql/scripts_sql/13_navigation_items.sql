-- =====================================================================================
-- TABLE: navigation_items
-- Description: Items de navigation de l'application
-- =====================================================================================

DROP TABLE IF EXISTS public.navigation_items CASCADE;

CREATE TABLE public.navigation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    path VARCHAR(255) NOT NULL UNIQUE,
    icon VARCHAR(50) NOT NULL,
    position INTEGER NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.navigation_items IS 'Items de navigation de l''application';
COMMENT ON COLUMN public.navigation_items.path IS 'Chemin de la route';
COMMENT ON COLUMN public.navigation_items.icon IS 'Nom de l''icône (lucide-react)';
COMMENT ON COLUMN public.navigation_items.position IS 'Position dans le menu (ordre)';
COMMENT ON COLUMN public.navigation_items.is_active IS 'Item activé ou non';

-- Indexes
CREATE INDEX idx_navigation_items_position ON public.navigation_items(position);
CREATE INDEX idx_navigation_items_is_active ON public.navigation_items(is_active);

-- Enable RLS
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tout le monde peut voir les items de navigation actifs" ON public.navigation_items
    FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Les admins peuvent gérer les items de navigation" ON public.navigation_items
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Trigger pour updated_at
CREATE TRIGGER update_navigation_items_updated_at
    BEFORE UPDATE ON public.navigation_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert data
INSERT INTO public.navigation_items (id, name, path, icon, position, is_active, created_at, updated_at) VALUES
('0432d197-cd60-4882-8ab1-7ed3e690abed', 'Home', '/', 'Home', 1, true, '2025-10-13 21:09:10.522544+00', '2025-10-17 16:30:34.596743+00'),
('22126977-8642-4318-893c-3be26c96f1d5', 'Calendrier', '/calendar', 'Calendar', 2, true, '2025-10-13 21:09:10.522544+00', '2025-10-17 16:30:34.5621+00'),
('12bb4df0-9808-4edc-807d-a704c02031ef', 'Traitements', '/treatments', 'Pill', 3, true, '2025-10-13 21:09:10.522544+00', '2025-10-17 16:30:34.565158+00'),
('793a7a22-868a-4a89-a2c5-bc1336b1e4a0', 'Historique', '/history', 'Search', 4, true, '2025-10-15 09:26:17.565845+00', '2025-10-17 16:30:34.570969+00'),
('e68e36f6-8dcc-43fd-8b0d-a86d7a80e394', 'Ordonnances', '/prescriptions', 'FileText', 5, true, '2025-10-15 09:24:12.181446+00', '2025-10-17 16:30:34.591201+00'),
('d26607a1-c2dc-476d-8575-9d599f1d2b2f', 'Stock', '/stock', 'Package', 6, true, '2025-10-13 21:09:10.522544+00', '2025-10-17 16:30:34.56881+00'),
('50b19d08-bd1a-46a2-ac6a-18fc92ccabd4', 'Réglages', '/settings', 'Settings', 7, true, '2025-10-13 21:09:10.522544+00', '2025-10-17 16:30:34.584811+00'),
('5e27c5b1-e1de-4eb1-a149-a39916193eca', 'Admin', '/admin', 'Shield', 8, true, '2025-10-13 21:55:32.021956+00', '2025-10-17 16:30:34.570418+00');
