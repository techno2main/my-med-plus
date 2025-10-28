# Migrations Supabase - MyHealthPlus

Ce dossier contient toutes les migrations SQL pour initialiser la base de données MyHealthPlus sur Supabase.

## 📋 Ordre d'exécution des migrations

Les migrations sont numérotées dans l'ordre chronologique d'exécution. Supabase les exécutera automatiquement dans l'ordre des timestamps.

### 1. Types et Fonctions (00000)
- `20251028100000_init_types_and_functions.sql`
  - Type ENUM `app_role` (admin, user)
  - Fonction `update_updated_at_column()` - MAJ automatique du timestamp
  - Fonction `has_role()` - Vérification des rôles (SECURITY DEFINER)
  - Fonction `regenerate_future_intakes()` - Génération des prises futures (7 jours)
  - Fonction `update_stock_on_intake()` - Décrémentation automatique du stock
  - Fonction `auto_regenerate_intakes_on_times_change()` - Régénération automatique sur changement horaires

### 2. Tables utilisateurs (00100-00300)
- `20251028100100_create_profiles_table.sql` - Profils utilisateurs
- `20251028100200_create_user_roles_table.sql` - Rôles (admin/user)
- `20251028100300_create_user_preferences_table.sql` - Préférences (biométrie, 2FA)

### 3. Catalogues médicaux (00400-00600)
- `20251028100400_create_pathologies_table.sql` - Catalogue des pathologies
- `20251028100500_create_allergies_table.sql` - Allergies connues
- `20251028100600_create_medication_catalog_table.sql` - Catalogue des médicaments

### 4. Professionnels de santé (00700)
- `20251028100700_create_health_professionals_table.sql` - Médecins, pharmacies, laboratoires

### 5. Ordonnances et traitements (00800-01000)
- `20251028100800_create_prescriptions_table.sql` - Ordonnances médicales
- `20251028100900_create_treatments_table.sql` - Traitements actifs
- `20251028101000_create_medications_table.sql` - Médicaments dans les traitements

### 6. Suivi médical (01100-01200)
- `20251028101100_create_pharmacy_visits_table.sql` - Visites en pharmacie
- `20251028101200_create_medication_intakes_table.sql` - Prises de médicaments

### 7. Navigation (01300)
- `20251028101300_create_navigation_items_table.sql` - Menu de navigation

### 8. Données initiales (01400-01800)
- `20251028101400_seed_user_data.sql` - Profils, rôles, préférences
- `20251028101500_seed_medical_catalog.sql` - Pathologies, allergies, médicaments catalogue
- `20251028101600_seed_health_professionals.sql` - Médecins, pharmacies, laboratoires
- `20251028101700_seed_treatments_medications.sql` - Ordonnances, traitements, médicaments, visites
- `20251028101800_seed_navigation.sql` - Items de navigation

## 🔐 Sécurité (RLS)

Toutes les tables ont Row Level Security (RLS) activé avec les politiques suivantes :

### Politique utilisateur standard
- **SELECT** : Utilisateur voit uniquement ses propres données
- **INSERT** : Utilisateur crée uniquement ses propres données
- **UPDATE** : Utilisateur modifie uniquement ses propres données
- **DELETE** : Utilisateur supprime uniquement ses propres données

### Politique admin
- Tables `user_roles`, `pathologies`, `medication_catalog`, `navigation_items`
- **ALL** : Les admins ont tous les droits

### Politiques publiques
- `pathologies` et `medication_catalog` : Lecture publique (SELECT pour tous)
- `allergies` : Lecture publique
- `navigation_items` : Lecture des items actifs pour tous

## 🔄 Triggers automatiques

Chaque table dispose de triggers pour :
1. **updated_at** : Mise à jour automatique du timestamp lors d'un UPDATE
2. **Médicaments** : Régénération automatique des prises futures lors du changement d'horaires
3. **Prises** : Décrémentation automatique du stock lors d'une prise confirmée

## 📊 Dépendances entre tables

```
auth.users (Supabase Auth)
  ├─ profiles (1:1)
  │   ├─ user_roles (1:N)
  │   ├─ user_preferences (1:1)
  │   ├─ pathologies (1:N)
  │   ├─ allergies (1:N)
  │   ├─ health_professionals (1:N)
  │   └─ prescriptions (1:N)
  │       └─ treatments (1:N)
  │           ├─ medications (1:N)
  │           │   └─ medication_intakes (1:N)
  │           └─ pharmacy_visits (1:N)
  └─ medication_catalog (référence optionnelle)
```

## 🚀 Utilisation avec Supabase

1. **Via Supabase CLI** :
   ```bash
   supabase db push
   ```

2. **Via l'interface Supabase** :
   - Allez dans SQL Editor
   - Exécutez les fichiers dans l'ordre (00000 → 01800)

3. **Via Lovable.dev** :
   - Les migrations sont automatiquement détectées et appliquées

## ⚠️ Notes importantes

1. **Ordre critique** : Respecter l'ordre des migrations (types → tables → données)
2. **Données de test** : Les fichiers seed contiennent des données de développement
3. **UUID** : Tous les IDs utilisent `gen_random_uuid()` par défaut
4. **Timezone** : Europe/Paris utilisé pour les dates/heures
5. **Stock** : Décrémentation automatique via trigger sur les prises
6. **Prises futures** : Générées automatiquement pour 7 jours

## 📝 Maintenance

Pour ajouter une nouvelle migration :
1. Créer un fichier `YYYYMMDDHHMMSS_description.sql`
2. Incrémenter le timestamp de 100 secondes
3. Respecter le format SQL pur (pas de commentaires inutiles)
4. Inclure : table → RLS → trigger → indexes
