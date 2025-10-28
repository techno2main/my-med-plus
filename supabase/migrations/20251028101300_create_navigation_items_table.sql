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

CREATE INDEX idx_navigation_items_position ON public.navigation_items(position);
CREATE INDEX idx_navigation_items_is_active ON public.navigation_items(is_active);

ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER update_navigation_items_updated_at
    BEFORE UPDATE ON public.navigation_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
