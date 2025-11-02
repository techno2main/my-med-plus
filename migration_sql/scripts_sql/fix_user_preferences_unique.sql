-- Migration: Ajouter contrainte UNIQUE sur user_id dans user_preferences
-- Date: 2025-11-02
-- Description: Empêche les doublons et permet l'upsert de fonctionner correctement

-- Fusionner les doublons : mettre à jour l'ancien avec les nouvelles données, puis supprimer le nouveau
UPDATE public.user_preferences a
SET settings_section_order = b.settings_section_order,
    updated_at = b.updated_at
FROM public.user_preferences b
WHERE a.user_id = b.user_id 
  AND a.created_at < b.created_at
  AND b.settings_section_order IS NOT NULL;

-- Supprimer les doublons (garder le plus ancien qui a toutes les données)
DELETE FROM public.user_preferences a
USING public.user_preferences b
WHERE a.user_id = b.user_id 
  AND a.created_at > b.created_at;

-- Ajouter la contrainte UNIQUE
ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id);

COMMENT ON CONSTRAINT user_preferences_user_id_unique ON public.user_preferences 
IS 'Un utilisateur ne peut avoir qu''une seule ligne de préférences';
