# Migrations Supabase - MyHealthPlus

> **Date de dernière mise à jour** : 30 octobre 2025
> **Version de la base de données** : 1.2.0
> **Nombre de migrations** : 21

Ce document décrit l'architecture complète des migrations SQL pour initialiser la base de données MyHealthPlus sur Supabase.

## 📋 Ordre d'exécution des migrations

Les migrations sont numérotées dans l'ordre chronologique d'exécution. Supabase les exécutera automatiquement dans l'ordre des timestamps.

### 1. Types et Fonctions (00000)
**Fichier** : `20251028100000_init_types_and_functions.sql`

**Contenu** :
- Type ENUM `app_role` (admin, user)
- Fonction `update_updated_at_column()` - MAJ automatique du timestamp
- Fonction `has_role()` - Vérification des rôles (SECURITY DEFINER)
- Fonction `regenerate_future_intakes()` - Génération des prises futures (7 jours)
- Fonction `update_stock_on_intake()` - Décrémentation automatique du stock
- Fonction `auto_regenerate_intakes_on_times_change()` - Régénération automatique sur changement horaires

### 2. Tables utilisateurs (00100-00300)
- **00100** : `create_profiles_table.sql` - Profils utilisateurs (first_name, last_name, date_of_birth, blood_type, height, weight, avatar_url)
- **00200** : `create_user_roles_table.sql` - Rôles (admin/user avec type ENUM)
- **00300** : `create_user_preferences_table.sql` - Préférences (biometric_enabled, two_factor_enabled)

### 3. Catalogues médicaux (00400-00600)
- **00400** : `create_pathologies_table.sql` - Catalogue des pathologies (name, description, is_approved)
- **00500** : `create_allergies_table.sql` - Allergies connues par utilisateur (name, severity, description)
- **00600** : `create_medication_catalog_table.sql` - Catalogue médicaments (name, active_ingredient, dosage_form, laboratory)

### 4. Professionnels de santé (00700)
- **00700** : `create_health_professionals_table.sql` - Médecins, pharmacies, laboratoires (type, name, specialty, contact info, is_primary_doctor)

### 5. Ordonnances et traitements (00800-01000)
- **00800** : `create_prescriptions_table.sql` - Ordonnances médicales (doctor_id, prescription_date, duration_days, file_url)
- **00900** : `create_treatments_table.sql` - Traitements actifs (name, pathology, start_date, end_date, is_active, description)
- **01000** : `create_medications_table.sql` - Médicaments dans les traitements (name, strength, posology, times, stocks, catalog_id)

### 6. Suivi médical (01100-01200)
- **01100** : `create_pharmacy_visits_table.sql` - Visites en pharmacie (treatment_id, visit_date, actual_visit_date, is_completed)
- **01200** : `create_medication_intakes_table.sql` - Prises de médicaments (scheduled_time, taken_at, status: pending/taken/skipped)

### 7. Navigation (01300)
- **01300** : `create_navigation_items_table.sql` - Menu de navigation dynamique (title, path, icon, order, is_active)

### 8. Données initiales (01400-01900)
- **01400** : `seed_user_data.sql` - Profils, rôles admin, préférences utilisateur Tyson Jackson
- **01500** : `seed_medical_catalog.sql` - 15+ pathologies, 8+ allergies, 10+ médicaments catalogue
- **01600** : `seed_health_professionals.sql` - Médecins traitants, pharmacies, laboratoires
- **01700** : `seed_treatments_medications.sql` - Ordonnances, traitements DT2-CHL et DOULEUR PIED, médicaments Xigduo/Simvastatine/Quviviq/Doliprane
- **01800** : `seed_navigation.sql` - 12 items de navigation (Dashboard, Traitements, Prises, Ordonnances, Stocks, Professionnels, Profil, Admin, etc.)
- **01900** : `seed_intakes.sql` - Historique des prises de médicaments (144 entrées du 13/10 au 02/11/2025)

### 9. Nouvelles fonctionnalités (2025-10-30)
- **20251030000000** : `add_export_config_to_user_preferences.sql` - Ajout colonne JSONB `export_config` pour configuration d'export PDF/JSON

## 🔐 Sécurité (RLS)

Toutes les tables ont **Row Level Security (RLS)** activé avec les politiques suivantes :

### Politique utilisateur standard
```sql
-- SELECT
USING ((SELECT auth.uid()) = user_id)

-- INSERT/UPDATE/DELETE
WITH CHECK ((SELECT auth.uid()) = user_id)
```
**Appliqué à** : profiles, user_preferences, allergies, health_professionals, prescriptions, treatments, medications, medication_intakes, pharmacy_visits

### Politique admin
```sql
-- Toutes opérations
USING (has_role((SELECT auth.uid()), 'admin'::app_role))
```
**Appliqué à** : user_roles, pathologies, medication_catalog, navigation_items

### Politiques publiques
- **pathologies** et **medication_catalog** : SELECT pour tous (lecture publique)
- **allergies** : SELECT pour tous
- **navigation_items** : SELECT pour items actifs (`is_active = true`)

## 🔄 Triggers automatiques

### 1. Mise à jour timestamp (`updated_at`)
**Fonction** : `update_updated_at_column()`  
**Appliqué sur** : TOUTES les tables avec colonne `updated_at`  
**Déclencheur** : `BEFORE UPDATE`

```sql
CREATE TRIGGER update_[table_name]_updated_at 
  BEFORE UPDATE ON public.[table_name]
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
```

### 2. Régénération automatique des prises
**Fonction** : `auto_regenerate_intakes_on_times_change()`  
**Appliqué sur** : `medications`  
**Déclencheur** : `AFTER UPDATE` (quand `times` change)

```sql
CREATE TRIGGER regenerate_intakes_on_times_update
  AFTER UPDATE ON public.medications
  FOR EACH ROW
  WHEN (OLD.times IS DISTINCT FROM NEW.times)
  EXECUTE FUNCTION public.auto_regenerate_intakes_on_times_change();
```

### 3. Décrémentation automatique du stock
**Fonction** : `update_stock_on_intake()`  
**Appliqué sur** : `medication_intakes`  
**Déclencheur** : `AFTER INSERT OR UPDATE` (quand status passe à 'taken')

```sql
CREATE TRIGGER update_medication_stock
  AFTER INSERT OR UPDATE ON public.medication_intakes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_on_intake();
```

## 📊 Schéma des dépendances

```
auth.users (Supabase Auth)
  ├─ profiles (1:1)
  │   ├─ user_roles (1:N)
  │   ├─ user_preferences (1:1) ─── export_config (JSONB)
  │   ├─ pathologies (1:N) ────── créées par l'utilisateur
  │   ├─ allergies (1:N)
  │   ├─ health_professionals (1:N)
  │   │   ├─ doctors (type='doctor')
  │   │   ├─ pharmacies (type='pharmacy')
  │   │   └─ laboratories (type='laboratory')
  │   └─ prescriptions (1:N)
  │       ├─ file_url (Storage Supabase)
  │       └─ treatments (1:N)
  │           ├─ pathology (référence textuelle)
  │           ├─ medications (1:N)
  │           │   ├─ catalog_id (FK → medication_catalog, optionnel)
  │           │   ├─ times (TEXT[]) ─── horaires de prise
  │           │   ├─ current_stock (INT) ─── décrémenté auto
  │           │   └─ medication_intakes (1:N)
  │           │       ├─ scheduled_time (TIMESTAMPTZ)
  │           │       ├─ taken_at (TIMESTAMPTZ, nullable)
  │           │       └─ status (pending|taken|skipped)
  │           └─ pharmacy_visits (1:N)
  │               ├─ visit_date (DATE) ─── date prévue
  │               └─ actual_visit_date (DATE) ─── date réelle
  └─ navigation_items (admin only)

medication_catalog (table globale)
  └─ medications.catalog_id (référence optionnelle)
```

## 🚀 Utilisation avec Supabase

### 1. Via Supabase CLI
```bash
# Appliquer toutes les migrations
supabase db push

# Créer une nouvelle migration
supabase migration new nom_de_la_migration

# Reset complet (DEV ONLY)
supabase db reset
```

### 2. Via l'interface Supabase
1. Allez dans **SQL Editor**
2. Exécutez les fichiers dans l'ordre (00000 → 01900)
3. Vérifiez les erreurs dans l'onglet **Logs**

### 3. Via Lovable.dev
Les migrations sont automatiquement détectées et appliquées lors du déploiement.

## ⚠️ Notes importantes

### Ordre critique
**TOUJOURS** respecter l'ordre des migrations :
1. Types et fonctions (00000)
2. Tables de base (00100-00300)
3. Tables de catalogues (00400-00600)
4. Tables relationnelles (00700-01300)
5. Données initiales (01400-01900)

### Timezone
Toutes les dates/heures utilisent **Europe/Paris** :
```sql
scheduled_time AT TIME ZONE 'Europe/Paris'
```

### UUIDs
Tous les IDs utilisent `gen_random_uuid()` par défaut :
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

### Stocks
- Décrémentation automatique via trigger `update_stock_on_intake()`
- Quand `status` passe à `'taken'` → `current_stock = current_stock - 1`
- Pas de décrémentation si déjà `taken` ou si `skipped`

### Prises futures
- Générées automatiquement pour **7 jours glissants**
- Fonction `regenerate_future_intakes(medication_id)` appelée :
  - À la création d'un médicament
  - Lors du changement des horaires (`times`)
- **Conserve** les prises existantes (pas de doublon)

### Export de données (nouveau 30/10/2025)
Configuration stockée dans `user_preferences.export_config` (JSONB) :
```json
{
  "format": "pdf",
  "startDate": "2025-10-13",
  "endDate": "2025-10-30",
  "includeProfile": true,
  "includeAdherence": true,
  "includeTreatments": true,
  "includePrescriptions": true,
  "includeIntakeHistory": true,
  "includeStocks": true
}
```

## 📝 Maintenance et évolution

### Ajouter une nouvelle migration
1. Créer un fichier `YYYYMMDDHHMMSS_description.sql`
2. Incrémenter le timestamp de 100 secondes par rapport au dernier
3. Format SQL pur (pas de syntaxe TypeScript/JavaScript)
4. Structure recommandée :
   ```sql
   -- CREATE TABLE
   CREATE TABLE...
   
   -- COMMENTS
   COMMENT ON TABLE...
   
   -- ENABLE RLS
   ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
   
   -- POLICIES
   CREATE POLICY...
   
   -- TRIGGERS
   CREATE TRIGGER...
   
   -- INDEXES (si nécessaire)
   CREATE INDEX...
   ```

### Modifier une table existante
**NE JAMAIS** modifier les migrations existantes. Créer une nouvelle migration :
```sql
-- 20251030120000_add_column_to_table.sql
ALTER TABLE public.table_name 
ADD COLUMN new_column TYPE DEFAULT value;
```

### Synchronisation avec TypeScript
Après modification du schéma :
```bash
# Générer les types TypeScript
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

## 🔍 Vérification de l'intégrité

### Requêtes utiles
```sql
-- Lister toutes les tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Vérifier les policies RLS
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Compter les enregistrements
SELECT 
  'profiles' as table, COUNT(*) FROM profiles
UNION ALL
SELECT 'treatments', COUNT(*) FROM treatments
UNION ALL
SELECT 'medications', COUNT(*) FROM medications
UNION ALL
SELECT 'medication_intakes', COUNT(*) FROM medication_intakes;

-- Vérifier les triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## 📚 Documentation associée

- **Architecture** : `docs/refactor/improve_app.md`
- **Synchronisation calendrier** : `docs/refactor/phase6-calendar-sync/`
- **Scripts SQL sources** : `migration_sql/scripts_sql/`
- **Exports CSV** : `migration_sql/exports_csv_supabase/`

## 🐛 Troubleshooting

### Erreur : "relation already exists"
Reset la base de données (DEV ONLY) :
```bash
supabase db reset
```

### Erreur : "permission denied for table"
Vérifier les policies RLS et les rôles :
```sql
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

### Trigger ne s'exécute pas
Vérifier que la fonction existe et est SECURITY DEFINER :
```sql
SELECT proname, prosecdef FROM pg_proc WHERE proname LIKE '%update%';
```

---

**Dernière révision** : 30 octobre 2025  
**Auteur** : Équipe MyHealthPlus  
**Contact** : techno2main@github.com
