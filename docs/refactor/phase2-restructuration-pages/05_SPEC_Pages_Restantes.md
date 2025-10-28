# SPEC 05 : Restructuration Pages P2/P3 - Guide Standardisé

## 🎯 Objectif

Documenter la restructuration de **TOUTES les pages restantes** (24 pages) selon la **structure standardisée** :
- Orchestrateur ~100-150 lignes
- Sous-dossier dédié avec components/, hooks/, types.ts
- Même convention pour toutes les pages

## 📋 Convention Standardisée

**Pour CHAQUE page :**

```
src/pages/[page-name]/
  ├── [PageName].tsx        # Orchestrateur (~100-150 lignes)
  ├── components/           # Composants UI spécifiques
  │   ├── [Component1].tsx  # <100 lignes chacun
  │   ├── [Component2].tsx
  │   └── ...
  ├── hooks/                # Hooks métier locaux
  │   ├── use[Hook1].ts
  │   ├── use[Hook2].ts
  │   └── ...
  ├── types.ts              # Interfaces TypeScript
  └── utils.ts              # Helpers (optionnel)
```

## 📊 Pages à Restructurer (Priorité P2)

### 1. Auth (~319 lignes) → pages/auth/

**Responsabilités** :
- Authentification email/password
- Inscription + auto-login
- Biométrie (fingerprint)
- Gestion sessions

**Structure cible** :
```
auth/
  ├── Auth.tsx                  # Orchestrateur (~120 lignes)
  ├── components/
  │   ├── LoginForm.tsx         # Formulaire connexion
  │   ├── SignUpForm.tsx        # Formulaire inscription
  │   ├── BiometricButton.tsx   # Bouton empreinte
  │   └── AuthTabs.tsx          # Tabs login/signup
  ├── hooks/
  │   ├── useEmailAuth.ts       # Login/signup email
  │   └── useBiometricAuth.ts   # Auth empreinte
  └── types.ts                  # AuthFormData, BiometricResult
```

---

### 2. Treatments (~353 lignes) → pages/treatments/

**Responsabilités** :
- Liste des traitements actifs/terminés
- Filtres (actif/terminé/tous)
- Navigation vers détails/édition
- Export PDF

**Structure cible** :
```
treatments/
  ├── Treatments.tsx            # Orchestrateur (~100 lignes)
  ├── components/
  │   ├── TreatmentList.tsx     # Liste avec filtres
  │   ├── TreatmentCard.tsx     # Card traitement individuel
  │   ├── FilterTabs.tsx        # Tabs filtres
  │   └── EmptyState.tsx        # État vide
  ├── hooks/
  │   ├── useTreatmentsList.ts  # Chargement + filtres
  │   └── useExportPDF.ts       # Export PDF
  └── types.ts                  # Treatment, FilterStatus
```

---

### 3. TreatmentEdit (~500 lignes) → pages/treatment-edit/

**Responsabilités** :
- Édition traitement existant
- Formulaire complexe (médication, durée, fréquence)
- Validation + sauvegarde
- Gestion QSP

**Structure cible** :
```
treatment-edit/
  ├── TreatmentEdit.tsx         # Orchestrateur (~120 lignes)
  ├── components/
  │   ├── TreatmentForm.tsx     # Formulaire principal
  │   ├── MedicationSelect.tsx  # Sélection médication
  │   ├── FrequencySelector.tsx # Fréquence prises
  │   ├── DurationInput.tsx     # Durée traitement
  │   └── QSPCalculator.tsx     # Calcul QSP
  ├── hooks/
  │   ├── useTreatmentEdit.ts   # Load + update
  │   ├── useFormValidation.ts  # Validation
  │   └── useQSPCalculation.ts  # Calcul QSP
  └── types.ts                  # TreatmentFormData
```

---

### 4. MedicationCatalog (~400 lignes) → pages/medications/

**Responsabilités** :
- Catalogue médicaments
- Recherche + filtres
- Ajout/édition médicaments
- Modal de sélection

**Structure cible** :
```
medications/
  ├── MedicationCatalog.tsx     # Orchestrateur (~100 lignes)
  ├── components/
  │   ├── MedicationList.tsx    # Liste avec recherche
  │   ├── MedicationCard.tsx    # Card médicament
  │   ├── SearchBar.tsx         # Barre recherche
  │   ├── MedicationDialog.tsx  # Dialog ajout/édition
  │   └── EmptyState.tsx
  ├── hooks/
  │   ├── useMedicationsList.ts # Load + search
  │   └── useMedicationForm.ts  # CRUD médicament
  └── types.ts                  # Medication, SearchFilters
```

---

### 5. Prescriptions (~434 lignes) → pages/prescriptions/

**Responsabilités** :
- Liste ordonnances
- Upload fichiers
- Statut renouvellement
- Suppression

**Structure cible** :
```
prescriptions/
  ├── Prescriptions.tsx         # Orchestrateur (~100 lignes)
  ├── components/
  │   ├── PrescriptionList.tsx  # Liste ordonnances
  │   ├── PrescriptionCard.tsx  # Card ordonnance
  │   ├── UploadDialog.tsx      # Dialog upload
  │   └── EmptyState.tsx
  ├── hooks/
  │   ├── usePrescriptionsList.ts # Load + delete
  │   └── useUploadFile.ts      # Upload Supabase
  └── types.ts                  # Prescription, UploadResult
```

---

## 📊 Pages à Restructurer (Priorité P3)

### Pages Simples (~100-200 lignes)

Pour ces pages plus légères, la structure reste identique mais avec **moins de composants** :

**Pattern standard P3** :
```
[page-name]/
  ├── [PageName].tsx            # Orchestrateur (~80-100 lignes)
  ├── components/
  │   ├── [Main]List.tsx        # Composant liste principal
  │   ├── [Item]Card.tsx        # Card item individuel
  │   └── [Action]Dialog.tsx    # Dialog action (optionnel)
  ├── hooks/
  │   └── use[Page]Data.ts      # Hook chargement données
  └── types.ts                  # Interface principale
```

### Liste Pages P3

1. **Stock (~171 lignes)** → `pages/stock/`
   - Components: StockList, StockCard, AlertBadge
   - Hooks: useStockList
   - Types: StockItem, AlertLevel

2. **StockDetails (~150 lignes)** → `pages/stock-details/`
   - Components: StockInfo, HistoryList, AdjustDialog
   - Hooks: useStockDetails, useStockAdjust
   - Types: StockDetail, AdjustmentHistory

3. **StockForm (~200 lignes)** → `pages/stock-form/`
   - Components: StockFormFields, MedicationSelect, QuantityInput
   - Hooks: useStockForm
   - Types: StockFormData

4. **TreatmentForm (~200 lignes)** → `pages/treatment-form/`
   - Components: TreatmentFormFields, FrequencySelector, DurationInput
   - Hooks: useTreatmentForm
   - Types: TreatmentFormData

5. **Pros (~150 lignes)** → `pages/pros/`
   - Components: ProList, ProCard
   - Hooks: useProsList
   - Types: HealthPro

6. **ProForm (~150 lignes)** → `pages/pro-form/`
   - Components: ProFormFields, SpecialtySelect
   - Hooks: useProForm
   - Types: ProFormData

7. **Pathologies (~150 lignes)** → `pages/pathologies/`
   - Components: PathologyList, PathologyCard, PathologyDialog
   - Hooks: usePathologiesList
   - Types: Pathology

8. **Allergies (~150 lignes)** → `pages/allergies/`
   - Components: AllergyList, AllergyCard, AllergyDialog
   - Hooks: useAllergiesList
   - Types: Allergy

9. **HealthProfessionals (~150 lignes)** → `pages/health-professionals/`
   - Components: ProfessionalList, ProfessionalCard
   - Hooks: useProfessionalsList
   - Types: HealthProfessional

10. **Referentials (~100 lignes)** → `pages/referentials/`
    - Components: ReferentialCard
    - Hooks: (aucun, juste navigation)
    - Types: ReferentialRoute

11. **Profile (~150 lignes)** → `pages/profile/`
    - Components: ProfileForm, AvatarUpload, DeleteAccount
    - Hooks: useProfile, useProfileUpdate
    - Types: ProfileData

12. **Settings (~150 lignes)** → `pages/settings/`
    - Components: SettingsSection, ToggleOption
    - Hooks: useSettings
    - Types: SettingsData

13. **NavigationManager (~150 lignes)** → `pages/navigation-manager/`
    - Components: NavigationList, NavItemCard, NavItemDialog
    - Hooks: useNavigationItems
    - Types: NavigationItem

14. **NotificationSettings (~150 lignes)** → `pages/notification-settings/`
    - Components: NotificationForm, ToggleList
    - Hooks: useNotificationSettings
    - Types: NotificationPreferences

15. **NotificationDebug (~100 lignes)** → `pages/notification-debug/`
    - Components: DebugPanel, LogsList
    - Hooks: useNotificationDebug
    - Types: DebugLog

16. **Rattrapage (~100 lignes)** → `pages/rattrapage/`
    - Components: MissedIntakesList, IntakeCard
    - Hooks: useMissedIntakes
    - Types: MissedIntake

17. **Privacy (~50 lignes)** → `pages/privacy/`
    - Components: PrivacyContent
    - Hooks: (aucun)
    - Types: (aucun)

18. **About (~50 lignes)** → `pages/about/`
    - Components: AboutContent, VersionInfo
    - Hooks: (aucun)
    - Types: (aucun)

19. **NotFound (~30 lignes)** → `pages/not-found/`
    - Components: NotFoundContent
    - Hooks: (aucun)
    - Types: (aucun)

---

## 🔄 Plan d'Exécution Global

### Ordre d'implémentation recommandé :

1. **P1 (Priorité Haute)** : Index, History, Calendar ✅ SPECS CRÉÉES
2. **P2 (Priorité Moyenne)** : Auth, Treatments, TreatmentEdit, MedicationCatalog, Prescriptions, Admin
3. **P3 (Priorité Faible)** : Toutes les autres pages (19 pages)

### Workflow pour CHAQUE page :

1. ✅ Créer `src/pages/[page-name]/` directory
2. ✅ Créer `types.ts` (interfaces)
3. ✅ Créer `hooks/use[Hook].ts` (chaque hook)
4. ✅ Créer `components/[Component].tsx` (chaque composant)
5. ✅ Créer `utils.ts` (si nécessaire)
6. ✅ Créer `[PageName].tsx` (orchestrateur)
7. ✅ Supprimer ancien `src/pages/[PageName].tsx`
8. ✅ Mettre à jour `src/App.tsx` import
9. ✅ Vérifier avec `get_errors`
10. ✅ Tester manuellement
11. ✅ Commit : `feat(phase2): Restructure [PageName]`

---

## ⚠️ Points d'Attention Communs

Pour **TOUTES les pages** :

- **Hooks partagés** : useAuth, useUserRole, useAdherenceStats, useIntakeOverdue, etc. → Restent dans `@/hooks/`
- **Utils Phase 1** : sortingUtils, groupingUtils, filterUtils, dateUtils → Restent dans `@/lib/`
- **Composants partagés** : AppLayout, PageHeader, Card, Button, etc. → Restent dans `@/components/`
- **Supabase client** : Import depuis `@/integrations/supabase/client`
- **Imports organisés** : React → UI → Hooks → Utils → Types (dans cet ordre)

---

## ✅ Critères de Validation Globaux

Pour **CHAQUE page restructurée** :

- [ ] Orchestrateur < 150 lignes
- [ ] Composants < 100 lignes chacun
- [ ] Hooks bien isolés avec responsabilité unique
- [ ] Types dans types.ts (pas dans composants)
- [ ] 0 erreur TypeScript
- [ ] Fonctionnalités intactes (aucune régression)
- [ ] Import dans App.tsx mis à jour
- [ ] Build npm run build OK
- [ ] Tests manuels OK

---

## 🎯 Résumé

**28 pages totales** à restructurer :
- ✅ **3 pages P1** : Index, History, Calendar (specs détaillées créées)
- ✅ **1 page Admin** : Admin → admin/dashboard/ (spec créée)
- 📄 **5 pages P2** : Auth, Treatments, TreatmentEdit, MedicationCatalog, Prescriptions (guide ci-dessus)
- 📄 **19 pages P3** : Toutes les autres (structure standardisée)

**Convention finale** :
```
pages/[page-name]/
  ├── [PageName].tsx       # Orchestrateur
  ├── components/          # UI
  ├── hooks/               # Logique
  └── types.ts             # Interfaces
```

**Admin** :
```
pages/admin/
  ├── dashboard/           # Point d'entrée
  ├── users/               # FUTURE
  ├── settings/            # FUTURE
  └── logs/                # FUTURE
```

Chaque page suit la **même structure** pour maintenir la cohérence du projet.
