-- =====================================================
-- TABLE: public.user_roles
-- Rôles des utilisateurs (admin/user)
-- Date: 28 octobre 2025
-- =====================================================

-- DROP EXISTING
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- CREATE TABLE
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user'::app_role,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.user_roles IS 'Gestion des rôles utilisateurs (admin/user)';

-- ENABLE RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "user_roles_select_policy"
  ON public.user_roles FOR SELECT
  USING ((user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "user_roles_insert_policy"
  ON public.user_roles FOR INSERT
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "user_roles_update_policy"
  ON public.user_roles FOR UPDATE
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "user_roles_delete_policy"
  ON public.user_roles FOR DELETE
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));

-- TRIGGER
CREATE TRIGGER update_user_roles_updated_at 
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- INSERT DATA
INSERT INTO "public"."user_roles" ("id", "user_id", "role", "created_at") 
VALUES ('3d9a32f2-6c68-4ebb-9cb7-af7c0e6b2112', '40f221e1-3fcb-4b03-b9b2-5bf8142a37cb', 'admin', '2025-10-13 22:01:20.408837+00');
