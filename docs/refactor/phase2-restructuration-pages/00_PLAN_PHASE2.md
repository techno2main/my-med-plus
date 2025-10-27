# Phase 2 : Restructuration et Allègement des Pages

## 🎯 Objectifs

1. **Réorganiser la structure des pages** en sous-dossiers dédiés
2. **Décomposer les pages massives** en composants réutilisables
3. **Extraire les hooks locaux** spécifiques à chaque page
4. **Isoler les types/interfaces** dans des fichiers dédiés
5. **Réduire la taille des pages principales** à ~100-150 lignes (orchestrateurs)

## 📊 État Actuel

### 28 Pages Totales à Restructurer

#### Pages Publiques (User Space) - 27 pages

| Page | Lignes | Complexité | Priorité | Cible |
|------|--------|------------|----------|-------|
| Index.tsx | ~834 | Très haute | 🔴 P1 | pages/index/ |
| History.tsx | ~663 | Très haute | 🔴 P1 | pages/history/ |
| Calendar.tsx | ~608 | Très haute | 🔴 P1 | pages/calendar/ |
| Prescriptions.tsx | ~434 | Haute | 🟡 P2 | pages/prescriptions/ |
| MedicationCatalog.tsx | ~400 | Haute | 🟡 P2 | pages/medications/ |
| Treatments.tsx | ~353 | Haute | 🟡 P2 | pages/treatments/ |
| Auth.tsx | ~319 | Moyenne | 🟡 P2 | pages/auth/ |
| TreatmentEdit.tsx | ~500 | Haute | 🟡 P2 | pages/treatment-edit/ |
| Stock.tsx | ~171 | Faible | 🟢 P3 | pages/stock/ |
| StockDetails.tsx | ~150 | Faible | 🟢 P3 | pages/stock-details/ |
| StockForm.tsx | ~200 | Faible | 🟢 P3 | pages/stock-form/ |
| TreatmentForm.tsx | ~200 | Faible | 🟢 P3 | pages/treatment-form/ |
| Pros.tsx | ~150 | Faible | 🟢 P3 | pages/pros/ |
| ProForm.tsx | ~150 | Faible | 🟢 P3 | pages/pro-form/ |
| Pathologies.tsx | ~150 | Faible | 🟢 P3 | pages/pathologies/ |
| Allergies.tsx | ~150 | Faible | 🟢 P3 | pages/allergies/ |
| HealthProfessionals.tsx | ~150 | Faible | 🟢 P3 | pages/health-professionals/ |
| Referentials.tsx | ~100 | Faible | 🟢 P3 | pages/referentials/ |
| Profile.tsx | ~150 | Faible | 🟢 P3 | pages/profile/ |
| Settings.tsx | ~150 | Faible | 🟢 P3 | pages/settings/ |
| NavigationManager.tsx | ~150 | Faible | 🟢 P3 | pages/navigation-manager/ |
| NotificationSettings.tsx | ~150 | Faible | 🟢 P3 | pages/notification-settings/ |
| NotificationDebug.tsx | ~100 | Faible | 🟢 P3 | pages/notification-debug/ |
| Rattrapage.tsx | ~100 | Faible | 🟢 P3 | pages/rattrapage/ |
| Privacy.tsx | ~50 | Faible | 🟢 P3 | pages/privacy/ |
| About.tsx | ~50 | Faible | 🟢 P3 | pages/about/ |
| NotFound.tsx | ~30 | Faible | 🟢 P3 | pages/not-found/ |

#### Pages Admin (Admin Space) - 1 page + sous-structure

| Page | Lignes | Complexité | Priorité | Cible |
|------|--------|------------|----------|-------|
| Admin.tsx | ~115 | Faible | 🟡 P2 | pages/admin/dashboard/ |

**IMPORTANT** : L'espace admin sera un sous-dossier dédié `pages/admin/` avec sa propre arborescence complète (dashboard, users, settings, logs, etc.)

### Pages à restructurer (priorité par taille) :

| Page | Lignes actuelles | Complexité | Priorité |
|------|------------------|------------|----------|
| Index.tsx | ~840 | Très haute | 🔴 P1 |
| History.tsx | ~670 | Haute | 🔴 P1 |
| Calendar.tsx | ~615 | Haute | 🔴 P1 |
| MedicationCatalog.tsx | ~760 | Haute | 🟡 P2 |
| TreatmentEdit.tsx | ~470 | Moyenne | 🟡 P2 |
| Treatments.tsx | ~375 | Moyenne | 🟡 P2 |
| TreatmentForm.tsx | ~? | Moyenne | 🟢 P3 |

### Problèmes identifiés :

- ❌ Tout dans un seul fichier (logique + UI + données + handlers)
- ❌ Difficile à maintenir et tester
- ❌ Réutilisation de code limitée
- ❌ Violations du principe de responsabilité unique
- ❌ Imports non organisés

## 🏗️ Nouvelle Structure Cible

### Structure Pages Publiques (User Space)

```
src/pages/
  ├── index/
  │   ├── Index.tsx              # Orchestrateur principal (~100-150 lignes)
  │   ├── components/            # Composants UI spécifiques
  │   │   ├── TodaySection.tsx
  │   │   ├── TomorrowSection.tsx
  │   │   ├── IntakeCard.tsx
  │   │   └── TreatmentAccordion.tsx
  │   ├── hooks/                 # Hooks métier locaux
  │   │   ├── useDashboardData.ts
  │   │   ├── useTakeIntake.ts
  │   │   └── useAccordionState.ts
  │   └── types.ts               # Interfaces TypeScript
  │
  ├── calendar/
  │   ├── Calendar.tsx
  │   ├── components/
  │   │   ├── CalendarView.tsx
  │   │   ├── CalendarHeader.tsx
  │   │   └── DayDetailsPanel.tsx
  │   ├── hooks/
  │   │   ├── useMonthIntakes.ts
  │   │   └── useDayDetails.ts
  │   ├── types.ts
  │   └── utils.ts               # Helpers (dots styling)
  │
  ├── history/
  │   ├── History.tsx
  │   ├── components/
  │   │   ├── HistoryTabs.tsx
  │   │   ├── FilterButtons.tsx
  │   │   └── DaySection.tsx
  │   ├── hooks/
  │   │   ├── useHistoryData.ts
  │   │   └── useFilteredHistory.ts
  │   └── types.ts
  │
  ├── auth/
  │   ├── Auth.tsx
  │   ├── components/
  │   ├── hooks/
  │   └── types.ts
  │
  ├── treatments/
  │   ├── Treatments.tsx
  │   ├── components/
  │   ├── hooks/
  │   └── types.ts
  │
  ├── treatment-edit/
  │   ├── TreatmentEdit.tsx
  │   ├── components/
  │   ├── hooks/
  │   └── types.ts
  │
  ├── medications/               # Ex: MedicationCatalog
  │   ├── MedicationCatalog.tsx
  │   ├── components/
  │   ├── hooks/
  │   └── types.ts
  │
  ├── prescriptions/
  ├── stock/
  ├── pros/
  ├── profile/
  ├── settings/
  ├── ... (toutes les autres pages)
```

### Structure Admin (Admin Space) 🔐

```
src/pages/
  ├── admin/
  │   ├── dashboard/             # Point d'entrée admin (ex: Admin.tsx)
  │   │   ├── AdminDashboard.tsx # Orchestrateur
  │   │   ├── components/
  │   │   │   ├── AdminHeader.tsx
  │   │   │   ├── StatsCards.tsx
  │   │   │   └── QuickActions.tsx
  │   │   ├── hooks/
  │   │   └── types.ts
  │   │
  │   ├── users/                 # Gestion utilisateurs (future)
  │   │   ├── AdminUsers.tsx
  │   │   ├── components/
  │   │   ├── hooks/
  │   │   └── types.ts
  │   │
  │   ├── settings/              # Settings admin (future)
  │   │   ├── AdminSettings.tsx
  │   │   ├── components/
  │   │   ├── hooks/
  │   │   └── types.ts
  │   │
  │   └── logs/                  # Logs système (future)
  │       ├── AdminLogs.tsx
  │       ├── components/
  │       ├── hooks/
  │       └── types.ts
```

**Principe** : Chaque page (publique ou admin) a sa propre structure identique :
- 📄 `[PageName].tsx` : Orchestrateur (~100-150 lignes)
- 📁 `components/` : Composants UI spécifiques
- 🪝 `hooks/` : Hooks métier locaux
- 🏷️ `types.ts` : Interfaces TypeScript
- ⚙️ `utils.ts` : Helpers (si nécessaire)
  │   ├── History.tsx
  │   ├── components/
  │   ├── hooks/
  │   └── types.ts
  │
  └── ... (autres pages)
```

## 📋 Plan d'Exécution

### Étape 1 : Préparation (cette doc)
- [x] Analyser les pages existantes
- [ ] Créer la documentation complète
- [ ] Identifier les composants à extraire
- [ ] Planifier l'ordre de restructuration

### Étape 2 : Index.tsx (P1)
- [ ] Créer la structure de dossiers
- [ ] Extraire les types/interfaces
- [ ] Créer les composants sections
- [ ] Créer les hooks locaux
- [ ] Refactorer la page principale
- [ ] Mettre à jour les imports dans App.tsx
- [ ] Vérifier 0 erreur

### Étape 3 : History.tsx (P1)
- [ ] Même processus qu'Index

### Étape 4 : Calendar.tsx (P1)
- [ ] Même processus qu'Index

### Étape 5 : Pages P2 (optionnel selon temps)
- [ ] MedicationCatalog.tsx
- [ ] TreatmentEdit.tsx
- [ ] Treatments.tsx

### Étape 6 : Validation
- [ ] npm run build (0 erreur)
- [ ] Tests manuels de toutes les pages refactorées
- [ ] Vérification des routes
- [ ] Commit + Push + Merge

## 🎨 Principes de Décomposition

### 1. Page Principale (Index.tsx)
**Rôle** : Orchestrateur
- Import des hooks
- Gestion de l'état global de la page
- Composition des sections
- **Max 150 lignes**

### 2. Composants (/components)
**Rôle** : UI réutilisable
- Composants présentationnels purs
- Props bien typées
- Logique minimale
- **Max 100 lignes par composant**

### 3. Hooks (/hooks)
**Rôle** : Logique métier
- Appels Supabase
- Transformations de données
- Gestion d'état local
- **1 responsabilité par hook**

### 4. Types (/types.ts)
**Rôle** : Contrats TypeScript
- Toutes les interfaces de la page
- Types exportés pour réutilisation
- Documentation des structures

## ⚠️ Points d'Attention

1. **Ne PAS casser les fonctionnalités existantes**
2. **Vérifier CHAQUE changement avec get_errors**
3. **Tester après chaque page refactorée**
4. **Garder les noms de composants explicites**
5. **Documenter les hooks complexes**

## 📦 Dépendances

- Phase 1 (utils) : ✅ Terminée
- Aucune dépendance externe supplémentaire

## 🔄 Flow de Travail

Pour chaque page :
1. Créer la structure de dossiers
2. Extraire types.ts
3. Créer les composants un par un
4. Créer les hooks un par un
5. Refactorer la page principale
6. Mettre à jour App.tsx
7. Vérifier avec get_errors
8. Tester manuellement
9. Commit intermédiaire

## 📝 Critères de Succès

- ✅ Toutes les pages restructurées < 200 lignes
- ✅ Composants réutilisables identifiés
- ✅ Hooks bien isolés
- ✅ 0 erreur TypeScript
- ✅ Toutes les fonctionnalités intactes
- ✅ Imports organisés proprement
- ✅ Documentation à jour

## 🚀 Après Phase 2

Phase 3 : Mutualisation des hooks entre pages
Phase 4 : Composants UI atomiques partagés
Phase 5 : Performance & Tests
