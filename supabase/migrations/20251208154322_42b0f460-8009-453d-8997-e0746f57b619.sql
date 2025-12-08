-- Ajouter la colonne pour exiger l'authentification à l'ouverture de l'app
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS require_auth_on_open BOOLEAN DEFAULT false;