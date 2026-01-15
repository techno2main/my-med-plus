# HOOKS GÉNÉRIQUES - Documentation

## 📚 Vue d'ensemble

Phase 3 a introduit 2 hooks génériques réutilisables pour éliminer la duplication de code dans les opérations CRUD et la gestion des dialogues.

## 🎯 Hooks disponibles

### 1. `useEntityCrud<T, C, U>`

Hook générique pour les opérations CRUD avec React Query et Supabase.

#### Types génériques

- `T` : Type de l'entité complète (ex: `Pathology`)
- `C` : Type pour la création (par défaut : `Omit<T, 'id' | 'user_id'>`)
- `U` : Type pour la mise à jour (par défaut : `C`)

#### Configuration

```typescript
interface EntityCrudConfig<T> {
  tableName: SupabaseTable; // Nom de la table Supabase
  queryKey: string[]; // Clé React Query (ex: ["pathologies"])
  entityName: string; // Nom d'affichage (ex: "Pathologie")
  orderBy?: keyof T; // Champ de tri (défaut: "name")
  addUserId?: boolean; // Ajouter user_id auto (défaut: true)
  messages?: {
    // Messages personnalisés
    createSuccess?: string;
    updateSuccess?: string;
    deleteSuccess?: string;
    errorCreate?: string;
    errorUpdate?: string;
    errorDelete?: string;
  };
}
```

#### Valeur de retour

```typescript
{
  items: T[];                          // Liste des entités
  isLoading: boolean;                  // État de chargement
  error: Error | null;                 // Erreur éventuelle
  create: (formData: C) => Promise<boolean>;
  update: (id: string, formData: U) => Promise<boolean>;
  deleteEntity: (id: string) => Promise<boolean>;
  refetch: () => void;                 // Rafraîchir manuellement
}
```

#### Fonctionnalités intégrées

1. **Conversion automatique** : `""` → `null` pour compatibilité SQL
2. **Gestion user_id** : Ajout automatique si `addUserId: true`
3. **Toast notifications** : Messages de succès/erreur avec genre accordé
4. **Invalidation React Query** : Refresh automatique après mutations
5. **Type safety** : Validation stricte côté appelant

#### Exemples d'utilisation

##### Référentiel admin (sans user_id)

```typescript
// pathologies/Pathologies.tsx
import { useEntityCrud } from "@/hooks/generic/useEntityCrud";
import type { Pathology, PathologyFormData } from "./utils/pathologyUtils";

const {
  items: pathologies,
  isLoading,
  create: createPathology,
  update: updatePathology,
  deleteEntity: deletePathology,
} = useEntityCrud<Pathology, PathologyFormData>({
  tableName: "pathologies",
  queryKey: ["pathologies"],
  entityName: "Pathologie",
  orderBy: "name",
  addUserId: false, // Référentiel admin, pas de user_id
});

// Utilisation
await createPathology({ name: "Diabète", description: "Type 2" });
await updatePathology(id, {
  name: "Diabète",
  description: "Type 2 insulino-dépendant",
});
await deletePathology(id);
```

##### Données user-owned (avec user_id)

```typescript
// health-professionals/HealthProfessionals.tsx
import { useEntityCrud } from "@/hooks/generic/useEntityCrud";
import type {
  HealthProfessional,
  HealthProfessionalFormData,
} from "./utils/professionalUtils";

const {
  items: professionals,
  isLoading,
  create: createProfessional,
  update: updateProfessional,
  deleteEntity: deleteProfessional,
} = useEntityCrud<HealthProfessional, HealthProfessionalFormData>({
  tableName: "health_professionals",
  queryKey: ["health_professionals"],
  entityName: "Professionnel",
  orderBy: "name",
  addUserId: true, // Données user-owned, user_id requis (défaut)
});

// user_id ajouté automatiquement lors de la création
await createProfessional({
  type: "doctor",
  name: "Dr Martin",
  specialty: "Généraliste",
  phone: "01 23 45 67 89",
});
```

##### Messages personnalisés

```typescript
const { create, update } = useEntityCrud<Medication, MedicationFormData>({
  tableName: "medications",
  queryKey: ["medications"],
  entityName: "Médicament",
  messages: {
    createSuccess: "Médicament ajouté au traitement",
    updateSuccess: "Posologie mise à jour",
    deleteSuccess: "Médicament retiré du traitement",
  },
});
```

---

### 2. `useEntityDialog<T, F>`

Hook générique pour gérer l'état d'un dialogue CRUD (Create/Edit).

#### Types génériques

- `T` : Type de l'entité avec `id` (ex: `Pathology`)
- `F` : Type du formulaire (par défaut : `Omit<T, 'id' | 'user_id'>`)

#### Configuration

```typescript
// Fournir les valeurs initiales du formulaire
useEntityDialog<Pathology, PathologyFormData>({
  name: "",
  description: "",
});
```

#### Valeur de retour

```typescript
{
  showDialog: boolean;                 // État d'ouverture du dialogue
  editingItem: T | null;               // Item en cours d'édition (null si création)
  formData: F;                         // Données du formulaire
  setFormData: (data: F) => void;      // Mettre à jour le formulaire
  openDialog: (item?: T) => void;      // Ouvrir en mode create/edit
  closeDialog: () => void;             // Fermer et réinitialiser
  isEditing: boolean;                  // true si mode édition
}
```

#### Fonctionnalités intégrées

1. **Mode create/edit automatique** : Déterminé par présence d'`item` dans `openDialog()`
2. **Extraction des champs** : Retire automatiquement `id`, `user_id`, `created_at`, `updated_at`
3. **Conversion null → ""** : Pour compatibilité inputs React (pas de `value={null}`)
4. **Reset automatique** : Réinitialise le formulaire à la fermeture

#### Exemples d'utilisation

##### Dialogue simple

```typescript
// pathologies/Pathologies.tsx
import { useEntityDialog } from "@/hooks/generic/useEntityDialog";
import type { Pathology, PathologyFormData } from "./utils/pathologyUtils";

const {
  showDialog,
  editingItem,
  formData,
  setFormData,
  openDialog,
  closeDialog
} = useEntityDialog<Pathology, PathologyFormData>({
  name: "",
  description: ""
});

// Ouvrir en mode création
const handleAdd = () => {
  openDialog(); // formData = { name: "", description: "" }
};

// Ouvrir en mode édition
const handleEdit = (pathology: Pathology) => {
  openDialog(pathology); // formData = { name: pathology.name, description: pathology.description || "" }
};

// Dans le dialogue
<Dialog open={showDialog} onOpenChange={closeDialog}>
  <Input
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
  />
</Dialog>
```

##### Dialogue avec champs multiples

```typescript
// health-professionals/HealthProfessionals.tsx
const {
  showDialog,
  editingItem,
  formData,
  setFormData,
  openDialog,
  closeDialog,
} = useEntityDialog<HealthProfessional, HealthProfessionalFormData>({
  type: "",
  name: "",
  specialty: "",
  phone: "",
  email: "",
  street_address: "",
  postal_code: "",
  city: "",
  is_primary_doctor: false,
});

// Pré-remplir certains champs avant ouverture
const handleAddDoctor = () => {
  setFormData({ ...formData, type: "doctor" });
  openDialog();
};

// Éditer un professionnel existant
const handleEdit = (professional: HealthProfessional) => {
  openDialog(professional);
  // Tous les champs sont pré-remplis, null → "" automatiquement
};
```

---

## 🔧 Utilisation combinée

Pattern recommandé : Combiner les deux hooks dans une page CRUD.

```typescript
import { useEntityCrud } from "@/hooks/generic/useEntityCrud";
import { useEntityDialog } from "@/hooks/generic/useEntityDialog";

const MyEntityPage = () => {
  // Hook CRUD
  const {
    items,
    isLoading,
    create,
    update,
    deleteEntity
  } = useEntityCrud<MyEntity, MyEntityFormData>({
    tableName: "my_entities",
    queryKey: ["my_entities"],
    entityName: "Mon Entité",
    addUserId: true
  });

  // Hook Dialog
  const {
    showDialog,
    editingItem,
    formData,
    setFormData,
    openDialog,
    closeDialog
  } = useEntityDialog<MyEntity, MyEntityFormData>({
    field1: "",
    field2: ""
  });

  // Handler submit unifié
  const handleSubmit = async () => {
    if (!formData.field1) {
      toast.error("Champ obligatoire");
      return;
    }

    const success = editingItem
      ? await update(editingItem.id, formData)
      : await create(formData);

    if (success) closeDialog();
  };

  return (
    <div>
      <Button onClick={() => openDialog()}>Ajouter</Button>

      <MyEntityList
        items={items}
        onEdit={openDialog}
        onDelete={deleteEntity}
      />

      <MyEntityDialog
        open={showDialog}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        editingItem={editingItem}
        formData={formData}
        onFormChange={setFormData}
      />
    </div>
  );
};
```

---

## ⚙️ Configuration RLS Supabase

Les hooks sont compatibles avec deux types de politiques RLS :

### Référentiels admin (addUserId: false)

```sql
-- Exemple : pathologies, allergies, medication_catalog
CREATE POLICY "entity_create"
  ON public.my_table
  FOR INSERT
  TO public
  WITH CHECK (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "entity_modify"
  ON public.my_table
  FOR UPDATE
  TO public
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "entity_read"
  ON public.my_table
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "entity_remove"
  ON public.my_table
  FOR DELETE
  TO public
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));
```

### Données user-owned (addUserId: true)

```sql
-- Exemple : health_professionals, prescriptions, treatments
CREATE POLICY "entity_create"
  ON public.my_table
  FOR INSERT
  TO public
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "entity_modify"
  ON public.my_table
  FOR UPDATE
  TO public
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "entity_read"
  ON public.my_table
  FOR SELECT
  TO public
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "entity_remove"
  ON public.my_table
  FOR DELETE
  TO public
  USING ((SELECT auth.uid()) = user_id);
```

---

## 🎨 Bonnes pratiques

### 1. Définir les types FormData

```typescript
// utils/entityUtils.ts
export interface MyEntity {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export type MyEntityFormData = Omit<
  MyEntity,
  "id" | "user_id" | "created_at" | "updated_at"
>;
```

### 2. Gérer les champs nullable

```typescript
// Initialiser avec "" pour les inputs
const dialog = useEntityDialog<MyEntity, MyEntityFormData>({
  name: "",
  description: "", // Pas null, même si nullable en DB
});

// Le hook convertit automatiquement "" → null lors de l'insert/update
```

### 3. Validation avant submit

```typescript
const handleSubmit = async () => {
  // Validation côté client
  if (!formData.name.trim()) {
    toast.error("Le nom est obligatoire");
    return;
  }

  if (formData.email && !isValidEmail(formData.email)) {
    toast.error("Email invalide");
    return;
  }

  // Submit
  const success = editingItem
    ? await update(editingItem.id, formData)
    : await create(formData);

  if (success) closeDialog();
};
```

### 4. Messages personnalisés avec genre

```typescript
// Accord féminin automatique si entityName se termine par 'e'
useEntityCrud<Allergy, AllergyFormData>({
  entityName: "Allergie", // → "Allergie ajoutée avec succès"
});

// Accord masculin sinon
useEntityCrud<Treatment, TreatmentFormData>({
  entityName: "Traitement", // → "Traitement ajouté avec succès"
});
```

---

## 🐛 Résolution de problèmes

### Erreur RLS "violates row-level security policy"

**Cause** : Politiques RLS manquantes ou `addUserId` mal configuré.

**Solution** :

```typescript
// Si table a user_id NOT NULL
useEntityCrud({ ..., addUserId: true });

// Si table référentiel admin (pas de user_id ou nullable)
useEntityCrud({ ..., addUserId: false });
```

### Warning React "value prop should not be null"

**Cause** : Champ nullable de la DB passé directement à un input.

**Solution** : Le hook `useEntityDialog` convertit automatiquement `null → ""`. Si l'erreur persiste, vérifier que vous utilisez bien `formData` du hook et pas l'entité brute.

```typescript
// ❌ Mauvais
<Input value={editingItem?.description} />

// ✅ Bon
<Input value={formData.description} />
```

### Les données ne se rafraîchissent pas après mutation

**Cause** : `queryKey` incorrecte ou non cohérente.

**Solution** : Utiliser la même `queryKey` partout.

```typescript
// Hook CRUD
useEntityCrud({ queryKey: ["my_entities"] });

// Ailleurs dans l'app si besoin
useQuery({ queryKey: ["my_entities"], ... });
```

---

## 📊 Métriques Phase 3

- **Hooks créés** : 2 (useEntityCrud, useEntityDialog)
- **Hooks remplacés** : 6 (usePathologies, usePathologyDialog, useAllergies, useAllergyDialog, useHealthProfessionals, useProfessionalDialog)
- **Pages migrées** : 3 (Pathologies, Allergies, HealthProfessionals)
- **Réduction de code** : -46% (~450 → 243 lignes)
- **Réutilisabilité** : Chaque hook utilisé dans 3+ pages
- **Type safety** : 100% (Record<string, unknown> + caller-side validation)

---

**Prochaine étape** : Phase 4 - Mutualisation des composants atomiques (Dialogs, Lists, Forms)
