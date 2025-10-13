-- Create navigation_items table
CREATE TABLE public.navigation_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  path text NOT NULL,
  icon text NOT NULL,
  position integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view navigation items
CREATE POLICY "Authenticated users can view navigation items"
  ON public.navigation_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only authenticated users can manage navigation items
CREATE POLICY "Authenticated users can insert navigation items"
  ON public.navigation_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update navigation items"
  ON public.navigation_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete navigation items"
  ON public.navigation_items FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Insert default navigation items
INSERT INTO public.navigation_items (name, path, icon, position, is_active) VALUES
  ('Accueil', '/', 'Home', 1, true),
  ('Traitements', '/treatments', 'Pill', 2, true),
  ('Stock', '/stock', 'Package', 3, true),
  ('Calendrier', '/calendar', 'Calendar', 4, true),
  ('Plus', '/settings', 'Settings', 5, true);