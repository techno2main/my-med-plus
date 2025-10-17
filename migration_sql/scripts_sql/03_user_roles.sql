-- =====================================================
-- TABLE: public.user_roles
-- Rôles des utilisateurs (admin/user)
-- =====================================================

-- ENUM pour les rôles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- STRUCTURE
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS POLICIES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- DONNÉES: Vos 2 rôles admin
INSERT INTO public.user_roles VALUES
('cbea0950-1087-4326-a9e8-f4224aadf3fd', 'b59171b2-0716-4e1e-a68d-7267ab15a603', 'admin', '2025-10-13 21:55:32.021956+00'),
('3d9a32f2-6c68-4ebb-9cb7-af7c0e6b2112', '634b0b48-e193-4827-983b-a0f7d2f1b068', 'admin', '2025-10-13 22:01:20.408837+00');