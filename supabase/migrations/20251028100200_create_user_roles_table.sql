CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user'::app_role,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.user_roles IS 'Gestion des rôles utilisateurs (admin/user)';

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

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

CREATE TRIGGER update_user_roles_updated_at 
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
