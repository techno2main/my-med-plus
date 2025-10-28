-- =====================================================
-- POLITIQUES RLS (Row Level Security) - MyHealthPlus
-- Date: 28 octobre 2025
-- Source: Row-Level Security Policies for public schema.csv
-- =====================================================

-- ===================================
-- TABLE: profiles
-- ===================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = id);


-- ===================================
-- TABLE: user_roles
-- ===================================
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


-- ===================================
-- TABLE: user_preferences
-- ===================================
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);


-- ===================================
-- TABLE: pathologies
-- ===================================
ALTER TABLE public.pathologies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pathologies_read"
  ON public.pathologies FOR SELECT
  USING (true);

CREATE POLICY "pathologies_create"
  ON public.pathologies FOR INSERT
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "pathologies_modify"
  ON public.pathologies FOR UPDATE
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "pathologies_remove"
  ON public.pathologies FOR DELETE
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));


-- ===================================
-- TABLE: allergies
-- ===================================
ALTER TABLE public.allergies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all allergies"
  ON public.allergies FOR SELECT
  USING (true);


-- ===================================
-- TABLE: medication_catalog
-- ===================================
ALTER TABLE public.medication_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medication_catalog_read"
  ON public.medication_catalog FOR SELECT
  USING (true);

CREATE POLICY "medication_catalog_create"
  ON public.medication_catalog FOR INSERT
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "medication_catalog_modify"
  ON public.medication_catalog FOR UPDATE
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "medication_catalog_remove"
  ON public.medication_catalog FOR DELETE
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));


-- ===================================
-- TABLE: health_professionals
-- ===================================
ALTER TABLE public.health_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health professionals"
  ON public.health_professionals FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own health professionals"
  ON public.health_professionals FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own health professionals"
  ON public.health_professionals FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own health professionals"
  ON public.health_professionals FOR DELETE
  USING ((SELECT auth.uid()) = user_id);


-- ===================================
-- TABLE: prescriptions
-- ===================================
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prescriptions"
  ON public.prescriptions FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own prescriptions"
  ON public.prescriptions FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own prescriptions"
  ON public.prescriptions FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own prescriptions"
  ON public.prescriptions FOR DELETE
  USING ((SELECT auth.uid()) = user_id);


-- ===================================
-- TABLE: treatments
-- ===================================
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own treatments"
  ON public.treatments FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own treatments"
  ON public.treatments FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own treatments"
  ON public.treatments FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own treatments"
  ON public.treatments FOR DELETE
  USING ((SELECT auth.uid()) = user_id);


-- ===================================
-- TABLE: medications
-- ===================================
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medications"
  ON public.medications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.treatments
      WHERE treatments.id = medications.treatment_id
        AND treatments.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create own medications"
  ON public.medications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.treatments
      WHERE treatments.id = medications.treatment_id
        AND treatments.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own medications"
  ON public.medications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.treatments
      WHERE treatments.id = medications.treatment_id
        AND treatments.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own medications"
  ON public.medications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.treatments
      WHERE treatments.id = medications.treatment_id
        AND treatments.user_id = (SELECT auth.uid())
    )
  );


-- ===================================
-- TABLE: pharmacy_visits
-- ===================================
ALTER TABLE public.pharmacy_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pharmacy visits"
  ON public.pharmacy_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.treatments
      WHERE treatments.id = pharmacy_visits.treatment_id
        AND treatments.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create own pharmacy visits"
  ON public.pharmacy_visits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.treatments
      WHERE treatments.id = pharmacy_visits.treatment_id
        AND treatments.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own pharmacy visits"
  ON public.pharmacy_visits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.treatments
      WHERE treatments.id = pharmacy_visits.treatment_id
        AND treatments.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own pharmacy visits"
  ON public.pharmacy_visits FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.treatments
      WHERE treatments.id = pharmacy_visits.treatment_id
        AND treatments.user_id = (SELECT auth.uid())
    )
  );


-- ===================================
-- TABLE: medication_intakes
-- ===================================
ALTER TABLE public.medication_intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medication intakes"
  ON public.medication_intakes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.medications
      JOIN public.treatments ON medications.treatment_id = treatments.id
      WHERE medications.id = medication_intakes.medication_id
        AND treatments.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create own medication intakes"
  ON public.medication_intakes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.medications
      JOIN public.treatments ON medications.treatment_id = treatments.id
      WHERE medications.id = medication_intakes.medication_id
        AND treatments.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own medication intakes"
  ON public.medication_intakes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.medications
      JOIN public.treatments ON medications.treatment_id = treatments.id
      WHERE medications.id = medication_intakes.medication_id
        AND treatments.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own medication intakes"
  ON public.medication_intakes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 
      FROM public.medications
      JOIN public.treatments ON medications.treatment_id = treatments.id
      WHERE medications.id = medication_intakes.medication_id
        AND treatments.user_id = (SELECT auth.uid())
    )
  );


-- ===================================
-- TABLE: navigation_items
-- ===================================
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view navigation items"
  ON public.navigation_items FOR SELECT
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can insert navigation items"
  ON public.navigation_items FOR INSERT
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update navigation items"
  ON public.navigation_items FOR UPDATE
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete navigation items"
  ON public.navigation_items FOR DELETE
  USING ((SELECT auth.uid()) IS NOT NULL);
