# PHASE 4 : COMPOSANTS UI ATOMIQUES PARTAGÉS

## 📋 OBJECTIF

Créer une bibliothèque de composants UI atomiques réutilisables pour assurer la cohérence du design et réduire la duplication de code d'interface.

## 🎯 PÉRIMÈTRE

### Pages concernées
- Toutes les pages de l'application (18 pages refactorisées + autres)
- Focus sur les composants visuels redondants

### Composants à analyser

#### 1. Composants de cartes
**Actuellement dispersés** :
- `StockCard`, `PathologyCard`, `AllergyCard`, `ProfessionalCard`
- `MedicationCard`, `IntakeCard`, `PrescriptionCard`
- `ThemeCard`, `NavigationCard`

**Patterns identifiés** :
- Carte avec header (titre + actions)
- Carte avec badge de statut
- Carte avec informations clé-valeur
- Carte cliquable avec navigation

**Potentiel** :
- `Card` (base)
- `CardHeader` avec actions
- `CardBadge` avec variants
- `CardRow` (clé-valeur)
- `ActionCard` (cliquable)

#### 2. Composants de listes
**Actuellement dispersés** :
- Listes dans Stock, Pathologies, Allergies, etc.
- `EmptyState` (présent dans 5+ pages)
- Messages "Aucun élément"

**Potentiel** :
- `List<T>` générique
- `ListItem<T>` générique
- `EmptyState` unifié (déjà bien factorisé ✅)
- `LoadingList` avec skeleton

#### 3. Composants de formulaire
**Actuellement dispersés** :
- Input text, textarea, select dans multiples pages
- Labels, erreurs de validation
- Boutons submit/cancel

**Potentiel** :
- `FormField` avec label + error
- `Input`, `Textarea`, `Select` stylisés
- `FormActions` (boutons submit/cancel)
- `DatePicker` unifié
- `TimePicker` unifié

#### 4. Composants de dialogues
**Actuellement dispersés** :
- Dialogues dans Stock, Pathologies, Allergies, etc.
- Dialogues de confirmation de suppression
- `ConfirmationDialog` dans Rattrapage

**Potentiel** :
- `Dialog` de base (réutilise shadcn/ui)
- `ConfirmDialog` générique
- `FormDialog<T>` pour formulaires

#### 5. Composants de badges/chips
**Actuellement dispersés** :
- Badges de statut (actif/inactif, pris/manqué)
- Badges de priorité, badges de date
- Différents styles selon les pages

**Potentiel** :
- `Badge` avec variants unifiés
- `StatusBadge` (actif/inactif)
- `PriorityBadge` (haute/moyenne/basse)
- `DateBadge` (J-X format)

#### 6. Composants de navigation
**Actuellement dispersés** :
- `PageHeader` (déjà bien factorisé ✅)
- Boutons de navigation
- Tabs dans certaines pages

**Potentiel** :
- `Tabs` générique
- `NavButton` stylisé
- `BackButton` unifié

#### 7. Composants d'état
**Actuellement dispersés** :
- Loading spinners
- Messages d'erreur
- States vides
- Toasts/notifications

**Potentiel** :
- `LoadingSpinner` unifié
- `ErrorMessage` unifié
- `Toast` personnalisé
- `ProgressBar` (utilisé dans Rattrapage)

## 📊 ANALYSE PRÉLIMINAIRE

### Système de design actuel

**Couleurs** :
- Utilisation de Tailwind + shadcn/ui
- Thèmes : light, dark, system
- Variables CSS personnalisées

**Typographie** :
- Classes Tailwind standard
- Inconsistances potentielles à unifier

**Espacements** :
- Tailwind spacing (p-4, m-2, etc.)
- Généralement cohérent

**Composants shadcn/ui utilisés** :
- Button, Card, Dialog, Input, Label, Select, Textarea
- Toast, Switch, Checkbox
- **Action** : S'appuyer sur shadcn/ui au maximum

## 🔧 PLAN D'EXÉCUTION

### Étape 1 : Audit visuel et inventaire
- [ ] Capturer des screenshots de toutes les pages
- [ ] Identifier visuellement les composants redondants
- [ ] Créer un inventaire complet des patterns UI
- [ ] Identifier les incohérences de design

### Étape 2 : Design System
- [ ] Définir la palette de couleurs standard
- [ ] Définir les variants de composants (primary, secondary, danger, etc.)
- [ ] Créer un guide de style
- [ ] Documenter les espacements et tailles

### Étape 3 : Création des composants atomiques
**Priorité haute** :
- [ ] `Card` et variantes (CardHeader, CardContent, CardFooter)
- [ ] `Badge` et variantes (StatusBadge, PriorityBadge, DateBadge)
- [ ] `FormField` wrapper unifié
- [ ] `ConfirmDialog` générique

**Priorité moyenne** :
- [ ] `List<T>` et `ListItem<T>` génériques
- [ ] `LoadingSpinner` et `LoadingList`
- [ ] `ErrorMessage` et `ErrorBoundary`
- [ ] `Tabs` générique

**Priorité basse** :
- [ ] Composants de formulaire avancés
- [ ] Animations et transitions
- [ ] Composants de data visualization

### Étape 4 : Migration progressive
- [ ] Commencer par Stock (page de référence)
- [ ] Migrer les pages simples (About, NotFound, Settings)
- [ ] Migrer les pages complexes (Pathologies, Allergies, etc.)
- [ ] Adapter les composants au besoin

### Étape 5 : Storybook (optionnel)
- [ ] Installer Storybook
- [ ] Créer des stories pour chaque composant atomique
- [ ] Documenter les props et variants
- [ ] Exemples d'utilisation interactifs

### Étape 6 : Documentation
- [ ] Guide d'utilisation des composants
- [ ] Exemples de code
- [ ] Bonnes pratiques
- [ ] Quand créer un nouveau composant vs réutiliser

## 📈 MÉTRIQUES DE SUCCÈS

- **Réduction de code** : Viser -40% de JSX dupliqué
- **Réutilisabilité** : Chaque composant atomique utilisé dans 3+ pages minimum
- **Cohérence visuelle** : Design unifié sur toutes les pages
- **Maintenabilité** : Modification du design en un seul endroit

## 🚀 LIVRABLES

1. **Composants atomiques** dans `src/components/ui/`
   ```
   src/components/ui/
   ├── atoms/
   │   ├── Badge.tsx
   │   ├── Card.tsx
   │   ├── LoadingSpinner.tsx
   │   └── ...
   ├── molecules/
   │   ├── FormField.tsx
   │   ├── ConfirmDialog.tsx
   │   ├── ListItem.tsx
   │   └── ...
   └── organisms/
       ├── List.tsx
       ├── FormDialog.tsx
       └── ...
   ```

2. **Design System** dans `docs/design-system/`
   - Palette de couleurs
   - Composants documentés
   - Exemples d'utilisation

3. **Pages migrées** utilisant les composants atomiques
   - Toutes les pages refactorisées

## ⚠️ POINTS D'ATTENTION

- **Atomic Design** : Respecter la hiérarchie atoms → molecules → organisms
- **shadcn/ui** : Réutiliser au maximum, ne pas réinventer la roue
- **Accessibilité** : ARIA labels, keyboard navigation, focus management
- **Responsive** : Mobile-first, tous les composants adaptables
- **Performance** : Lazy loading, code splitting si nécessaire
- **TypeScript** : Props strictement typées, génériques quand approprié

## 🎨 ARCHITECTURE PROPOSÉE

### Atomic Design
```
Atoms (composants de base) :
- Badge, Button, Input, Icon, Spinner

Molecules (combinaison d'atoms) :
- FormField (Label + Input + ErrorMessage)
- CardHeader (Title + Actions)
- ListItem (Icon + Text + Badge + Actions)

Organisms (composants complets) :
- Card (CardHeader + CardContent + CardFooter)
- List (EmptyState | LoadingList | [ListItem])
- FormDialog (Dialog + Form + FormActions)
```

## 🔗 DÉPENDANCES

- Phase 1 ✅ Complétée
- Phase 2 ✅ Complétée
- Phase 3 ⏳ À compléter avant Phase 4
- Phase 4 📋 **APRÈS PHASE 3**

---

**Status** : 📋 Planifié
**Branche** : `phase4/composants-atomiques` (à créer)
**Estimation** : 7-10 jours de travail
