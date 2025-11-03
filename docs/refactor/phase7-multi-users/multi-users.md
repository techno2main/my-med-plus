# Implémentation Multi-Utilisateurs - Référentiels Personnels

## Objectif
Permettre à chaque utilisateur de gérer ses propres référentiels (pathologies, medication_catalog, allergies) sans être admin.

## Principe
- Chaque utilisateur a ses propres entrées dans les référentiels
- Isolation complète des données entre utilisateurs
- Propriété individuelle via le champ `created_by`

---

## 1. MIGRATIONS SUPABASE

### 1.1 Ajouter `created_by` à la table `allergies`

```sql
-- Ajouter la colonne created_by à allergies
ALTER TABLE public.allergies 
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Optionnel : Ajouter is_approved pour cohérence avec les autres tables
ALTER TABLE public.allergies 
ADD COLUMN is_approved boolean DEFAULT false;

-- Mettre à jour les entrées existantes (attribuer à un admin ou laisser NULL)
-- Option 1 : Laisser NULL pour les entrées existantes (référentiel global historique)
-- Option 2 : Attribuer à un utilisateur spécifique
-- UPDATE public.allergies SET created_by = 'uuid-admin' WHERE created_by IS NULL;
```

### 1.2 Modifier les RLS Policies - `pathologies`

```sql
-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "pathologies_create" ON public.pathologies;
DROP POLICY IF EXISTS "pathologies_modify" ON public.pathologies;
DROP POLICY IF EXISTS "pathologies_remove" ON public.pathologies;
DROP POLICY IF EXISTS "pathologies_read" ON public.pathologies;

-- Nouvelle policy SELECT : voir ses propres pathologies OU celles approuvées OU être admin
CREATE POLICY "pathologies_read" ON public.pathologies
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR is_approved = true 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Nouvelle policy INSERT : tout utilisateur authentifié peut créer
CREATE POLICY "pathologies_create" ON public.pathologies
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Nouvelle policy UPDATE : uniquement le créateur OU admin
CREATE POLICY "pathologies_modify" ON public.pathologies
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Nouvelle policy DELETE : uniquement le créateur OU admin
CREATE POLICY "pathologies_remove" ON public.pathologies
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);
```

### 1.3 Modifier les RLS Policies - `medication_catalog`

```sql
-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "medication_catalog_create" ON public.medication_catalog;
DROP POLICY IF EXISTS "medication_catalog_modify" ON public.medication_catalog;
DROP POLICY IF EXISTS "medication_catalog_remove" ON public.medication_catalog;
DROP POLICY IF EXISTS "medication_catalog_read" ON public.medication_catalog;

-- Nouvelle policy SELECT : voir ses propres médicaments OU ceux approuvés OU être admin
CREATE POLICY "medication_catalog_read" ON public.medication_catalog
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR is_approved = true 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Nouvelle policy INSERT : tout utilisateur authentifié peut créer
CREATE POLICY "medication_catalog_create" ON public.medication_catalog
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Nouvelle policy UPDATE : uniquement le créateur OU admin
CREATE POLICY "medication_catalog_modify" ON public.medication_catalog
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Nouvelle policy DELETE : uniquement le créateur OU admin
CREATE POLICY "medication_catalog_remove" ON public.medication_catalog
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);
```

### 1.4 Modifier les RLS Policies - `allergies`

```sql
-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view all allergies" ON public.allergies;
DROP POLICY IF EXISTS "allergies_create" ON public.allergies;
DROP POLICY IF EXISTS "allergies_modify" ON public.allergies;
DROP POLICY IF EXISTS "allergies_remove" ON public.allergies;

-- Nouvelle policy SELECT : voir ses propres allergies OU celles approuvées OU être admin
CREATE POLICY "allergies_read" ON public.allergies
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() 
  OR is_approved = true 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Nouvelle policy INSERT : tout utilisateur authentifié peut créer
CREATE POLICY "allergies_create" ON public.allergies
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Nouvelle policy UPDATE : uniquement le créateur OU admin
CREATE POLICY "allergies_modify" ON public.allergies
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Nouvelle policy DELETE : uniquement le créateur OU admin
CREATE POLICY "allergies_remove" ON public.allergies
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);
```

---

## 2. MODIFICATIONS FRONTEND

### 2.1 Pathologies

**Fichiers à modifier :**
- `src/pages/pathologies/utils/pathologyUtils.ts` - Interface déjà à jour ✅
- `src/pages/pathologies/hooks/usePathologies.ts` (ou équivalent)

**Modifications nécessaires :**

```typescript
// Dans le hook de création de pathologie
const createPathology = async (data: PathologyFormData) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('pathologies')
    .insert({
      ...data,
      created_by: userData?.user?.id, // AJOUTER CETTE LIGNE
      is_approved: false, // Par défaut non approuvé
    });
  
  if (error) throw error;
};

// Dans le SELECT, filtrer pour voir uniquement les siennes + les approuvées
const loadPathologies = async () => {
  const { data, error } = await supabase
    .from('pathologies')
    .select('*')
    .or(`created_by.eq.${userId},is_approved.eq.true`) // Voir les siennes + approuvées
    .order('name');
  
  // La RLS policy s'occupe déjà du filtrage, mais c'est plus explicite
};
```

### 2.2 Medication Catalog

**Fichiers à modifier :**
- `src/pages/medication-catalog/hooks/useMedicationCatalog.ts` (ligne 164-173)

**Modifications nécessaires :**

```typescript
// Dans handleSubmit de useMedicationCatalog.ts

const handleSubmit = async () => {
  // ... validations existantes ...

  try {
    if (editingMed) {
      // UPDATE - inchangé, la RLS policy vérifie déjà la propriété
      const { error } = await supabase
        .from("medication_catalog")
        .update({
          name: formData.name,
          pathology_id: formData.pathology_id || null,
          default_posology: formData.default_posology || null,
          strength: formData.strength || null,
          description: formData.description || null,
          initial_stock: parseInt(formData.initial_stock) || 0,
          min_threshold: parseInt(formData.min_threshold) || 10,
          default_times: formData.default_times.length > 0 ? formData.default_times : null,
        })
        .eq("id", editingMed.id);

      if (error) throw error;
      toast.success("Médicament modifié avec succès");
    } else {
      // INSERT - AJOUTER created_by
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("medication_catalog").insert({
        name: formData.name,
        pathology_id: formData.pathology_id || null,
        default_posology: formData.default_posology || null,
        strength: formData.strength || null,
        description: formData.description || null,
        initial_stock: parseInt(formData.initial_stock) || 0,
        min_threshold: parseInt(formData.min_threshold) || 10,
        default_times: formData.default_times.length > 0 ? formData.default_times : null,
        created_by: userData?.user?.id, // ← AJOUTER CETTE LIGNE
        is_approved: false, // ← AJOUTER CETTE LIGNE
      });

      if (error) throw error;
      toast.success("Médicament ajouté avec succès");
    }

    loadMedications();
    closeDialog();
  } catch (error) {
    console.error("Error saving medication:", error);
    toast.error("Erreur lors de l'enregistrement");
  }
};

// Dans loadMedications, le filtrage est géré par RLS, mais on peut être explicite
const loadMedications = async () => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("medication_catalog")
      .select(`
        *,
        pathologies (
          id,
          name,
          description
        )
      `)
      // La RLS s'en occupe, mais pour être explicite :
      // .or(`created_by.eq.${userData?.user?.id},is_approved.eq.true`)
      .order("name");

    if (error) throw error;

    // ... reste du code inchangé ...
  } catch (error) {
    console.error("Error loading medications:", error);
    toast.error("Erreur lors du chargement du référentiel");
  } finally {
    setLoading(false);
  }
};
```

### 2.3 Allergies

**Fichiers à modifier :**
- Trouver le hook/page qui gère les allergies (probablement dans `src/pages/allergies/` ou `src/hooks/`)

**Modifications nécessaires :**

```typescript
// Dans le hook de création d'allergie
const createAllergy = async (data: AllergyFormData) => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('allergies')
    .insert({
      ...data,
      created_by: userData?.user?.id, // AJOUTER CETTE LIGNE
      is_approved: false, // AJOUTER CETTE LIGNE (si colonne ajoutée)
    });
  
  if (error) throw error;
};

// Dans le SELECT
const loadAllergies = async () => {
  const { data, error } = await supabase
    .from('allergies')
    .select('*')
    .order('name');
  
  // La RLS policy filtre automatiquement
};
```

### 2.4 Utiliser le hook générique `useEntityCrud`

**Si les pages utilisent déjà `useEntityCrud` :**

Le hook `src/hooks/generic/useEntityCrud.ts` a une option `addUserId`. Il faudrait :

1. **Ajouter une option `addCreatedBy`** similaire à `addUserId`
2. **Modifier le hook** pour ajouter automatiquement `created_by` lors des INSERT

```typescript
// Dans useEntityCrud.ts, ajouter dans EntityCrudConfig :
interface EntityCrudConfig<T> {
  // ... existant ...
  addUserId?: boolean;
  addCreatedBy?: boolean; // ← AJOUTER CETTE OPTION
}

// Dans la fonction create :
const create = async (item: C) => {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const newItem = {
    ...item,
    ...(config.addUserId && userId ? { user_id: userId } : {}),
    ...(config.addCreatedBy && userId ? { created_by: userId, is_approved: false } : {}), // ← AJOUTER CETTE LIGNE
  };

  // ... reste du code ...
};
```

Puis dans les pages :

```typescript
// Page pathologies
const { items, create, update, deleteEntity } = useEntityCrud({
  tableName: 'pathologies',
  queryKey: 'pathologies',
  entityName: 'pathologie',
  addCreatedBy: true, // ← ACTIVER CETTE OPTION
});

// Page medication_catalog
const { items, create, update, deleteEntity } = useEntityCrud({
  tableName: 'medication_catalog',
  queryKey: 'medication_catalog',
  entityName: 'médicament',
  addCreatedBy: true, // ← ACTIVER CETTE OPTION
});

// Page allergies
const { items, create, update, deleteEntity } = useEntityCrud({
  tableName: 'allergies',
  queryKey: 'allergies',
  entityName: 'allergie',
  addCreatedBy: true, // ← ACTIVER CETTE OPTION
});
```

---

## 3. TESTS À EFFECTUER

### 3.1 Test User Normal
1. Se connecter avec un compte **user** (non-admin)
2. Créer une pathologie → Doit réussir
3. Créer un médicament du catalogue → Doit réussir
4. Créer une allergie → Doit réussir
5. Modifier sa propre pathologie → Doit réussir
6. Supprimer sa propre pathologie → Doit réussir

### 3.2 Test Isolation
1. Se connecter avec User A
2. Créer "Paracétamol"
3. Se déconnecter
4. Se connecter avec User B
5. Vérifier que "Paracétamol" de User A n'est **PAS visible**
6. Créer son propre "Paracétamol"
7. Vérifier qu'il n'y a pas de conflit

### 3.3 Test Admin
1. Se connecter avec un compte **admin**
2. Vérifier qu'on peut modifier/supprimer les entrées de tous les users
3. Approuver une entrée (mettre `is_approved = true`)
4. Se connecter avec User A
5. Vérifier que l'entrée approuvée est visible

---

## 4. POINTS D'ATTENTION

### ⚠️ Données existantes
- Les entrées existantes dans les référentiels ont `created_by = NULL`
- Options :
  1. Les laisser NULL → Seuls les admins pourront les modifier
  2. Les attribuer à un utilisateur admin
  3. Les supprimer et laisser chaque user recréer les siennes

### ⚠️ TypeScript
- Mettre à jour les interfaces TypeScript si nécessaire
- Vérifier que `created_by` est bien dans les types

### ⚠️ UI
- Optionnel : Afficher un badge "Approuvé" pour les entrées `is_approved = true`
- Optionnel : Ajouter un filtre "Mes référentiels / Tous les approuvés"

---

## 5. ROLLBACK (en cas de problème)

Si besoin de revenir en arrière :

```sql
-- Remettre les anciennes policies admin-only

-- pathologies
DROP POLICY IF EXISTS "pathologies_read" ON public.pathologies;
DROP POLICY IF EXISTS "pathologies_create" ON public.pathologies;
DROP POLICY IF EXISTS "pathologies_modify" ON public.pathologies;
DROP POLICY IF EXISTS "pathologies_remove" ON public.pathologies;

CREATE POLICY "pathologies_read" ON public.pathologies FOR SELECT TO authenticated USING (true);
CREATE POLICY "pathologies_create" ON public.pathologies FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "pathologies_modify" ON public.pathologies FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "pathologies_remove" ON public.pathologies FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Répéter pour medication_catalog et allergies
```

---

## 6. ORDRE D'EXÉCUTION RECOMMANDÉ

1. ✅ **Backup de la base de données** (via Supabase Dashboard)
2. ✅ **Exécuter la migration 1.1** (ajouter created_by à allergies)
3. ✅ **Exécuter les migrations 1.2, 1.3, 1.4** (modifier RLS policies)
4. ✅ **Tester avec un compte user** → Les SELECT devraient fonctionner, INSERT échouera
5. ✅ **Modifier le code frontend** (section 2)
6. ✅ **Tester création/modification/suppression**
7. ✅ **Tester isolation entre utilisateurs**
8. ✅ **Valider avec plusieurs comptes**

---

## 7. AMÉLIORATIONS FUTURES (Optionnel)

### 7.1 Référentiel pré-rempli au signup
Créer un trigger pour ajouter des référentiels par défaut lors de la création d'un utilisateur :

```sql
CREATE OR REPLACE FUNCTION public.create_default_referentials()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer quelques pathologies par défaut
  INSERT INTO public.pathologies (name, description, created_by, is_approved)
  VALUES 
    ('Hypertension', 'Pression artérielle élevée', NEW.id, true),
    ('Diabète', 'Trouble de la régulation du glucose', NEW.id, true);
  
  -- Insérer quelques médicaments par défaut
  INSERT INTO public.medication_catalog (name, strength, created_by, is_approved)
  VALUES 
    ('Paracétamol', '1000mg', NEW.id, true),
    ('Ibuprofène', '400mg', NEW.id, true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_add_referentials
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_referentials();
```

### 7.2 Import/Export de référentiels
Permettre aux users d'exporter leurs référentiels et de les importer dans un autre compte.

### 7.3 Partage de référentiels
Ajouter une table `referential_shares` pour permettre à un user de partager certaines entrées avec d'autres users.

---

**FIN DU DOCUMENT**
