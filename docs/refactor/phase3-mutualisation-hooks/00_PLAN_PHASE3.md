# PHASE 3 : MUTUALISATION DES HOOKS

## 📋 OBJECTIF

Identifier et mutualiser les hooks similaires ou redondants entre les différentes pages pour éviter la duplication de code et améliorer la maintenabilité.

## 🎯 PÉRIMÈTRE

### Pages concernées
- Toutes les pages refactorisées en Phase 1 et 2 (18 pages)
- Focus sur les hooks métier et de gestion d'état

### Hooks à analyser

#### 1. Hooks de formulaires
- `useStockForm` (Stock)
- `usePathologyForm` (Pathologies)
- `useAllergyForm` (Allergies)
- `useProfessionalForm` (HealthProfessionals)
- **Potentiel** : Hook générique `useEntityForm<T>` avec validation, submit, reset

#### 2. Hooks de données (fetch + state)
- `useStockData` (Stock)
- `usePathologies` (Pathologies)
- `useAllergies` (Allergies)
- `useProfessionals` (HealthProfessionals)
- **Potentiel** : Hook générique `useEntityData<T>` avec loading, error, refetch

#### 3. Hooks de dialogues/modales
- `useStockDialog` (Stock)
- `usePathologyDialog` (Pathologies)
- `useAllergyDialog` (Allergies)
- `useProfessionalDialog` (HealthProfessionals)
- **Potentiel** : Hook générique `useDialog` avec open/close/selectedItem

#### 4. Hooks de suppression
- `useStockDeletion` (Stock)
- `usePathologyDeletion` (Pathologies)
- `useAllergyDeletion` (Allergies)
- `useProfessionalDeletion` (HealthProfessionals)
- **Potentiel** : Hook générique `useEntityDeletion<T>` avec confirmation, onSuccess

#### 5. Hooks de notifications
- `useNotificationPermission` (NotificationSettings)
- `useNotificationSystem` (déjà partagé ✅)
- **Action** : Vérifier si d'autres pages peuvent bénéficier de useNotificationSystem

#### 6. Hooks de navigation
- `useProfileNavigation` (Profile)
- **Potentiel** : Hook générique `useBackNavigation` avec logique de retour

## 📊 ANALYSE PRÉLIMINAIRE

### Patterns identifiés

#### Pattern 1 : Gestion CRUD standard
```typescript
// Actuellement dupliqué dans 4+ pages
const useEntityData = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // ... fetch, refetch, etc.
}
```

**Solution** : Hook générique avec types génériques

#### Pattern 2 : Dialogues de formulaire
```typescript
// Actuellement dupliqué dans 4+ pages
const useDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  // ... open, close, handlers
}
```

**Solution** : Hook générique réutilisable

#### Pattern 3 : Suppression avec confirmation
```typescript
// Actuellement dupliqué dans 4+ pages
const useDeletion = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  // ... handleDelete, confirmDelete, cancelDelete
}
```

**Solution** : Hook générique avec callbacks

## 🔧 PLAN D'EXÉCUTION

### Étape 1 : Audit complet des hooks
- [ ] Lister tous les hooks de toutes les pages
- [ ] Identifier les similitudes et patterns récurrents
- [ ] Créer une matrice de compatibilité

### Étape 2 : Création des hooks génériques
- [ ] `useEntityData<T>` : Fetch + state management
- [ ] `useEntityForm<T>` : Formulaire + validation
- [ ] `useDialog<T>` : Gestion dialogues/modales
- [ ] `useEntityDeletion<T>` : Suppression avec confirmation
- [ ] `useBackNavigation` : Navigation retour intelligente

### Étape 3 : Migration progressive
- [ ] Commencer par Stock (page de référence)
- [ ] Migrer Pathologies
- [ ] Migrer Allergies
- [ ] Migrer HealthProfessionals
- [ ] Adapter les autres pages si besoin

### Étape 4 : Tests et validation
- [ ] Tester chaque page après migration
- [ ] Vérifier que les fonctionnalités sont identiques
- [ ] Valider la réduction de code

### Étape 5 : Documentation
- [ ] Documenter les hooks génériques créés
- [ ] Créer des exemples d'utilisation
- [ ] Mettre à jour le README si nécessaire

## 📈 MÉTRIQUES DE SUCCÈS

- **Réduction de code** : Viser -30% de lignes dans les hooks
- **Réutilisabilité** : Chaque hook générique utilisé dans 3+ pages minimum
- **Maintenabilité** : Un seul endroit pour corriger les bugs communs
- **Cohérence** : Comportement uniforme entre toutes les pages

## 🚀 LIVRABLES

1. **Hooks génériques** dans `src/hooks/generic/`
   - `useEntityData.ts`
   - `useEntityForm.ts`
   - `useDialog.ts`
   - `useEntityDeletion.ts`
   - `useBackNavigation.ts`

2. **Pages migrées** avec hooks mutualisés
   - Stock, Pathologies, Allergies, HealthProfessionals (minimum)

3. **Documentation**
   - Guide d'utilisation des hooks génériques
   - Exemples de migration

## ⚠️ POINTS D'ATTENTION

- **Typage TypeScript** : Hooks génériques avec types strictement typés
- **Rétrocompatibilité** : Ne pas casser les fonctionnalités existantes
- **Performance** : Éviter les re-renders inutiles
- **Flexibilité** : Hooks suffisamment génériques mais pas trop abstraits

## 🔗 DÉPENDANCES

- Phase 1 ✅ Complétée
- Phase 2 ✅ Complétée
- Phase 3 🎯 **PROCHAINE ÉTAPE**

---

**Status** : 📋 Planifié
**Branche** : `phase3/mutualisation-hooks` (à créer)
**Estimation** : 5-7 jours de travail
