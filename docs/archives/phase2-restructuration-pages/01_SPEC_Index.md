# SPEC 01 : Restructuration Index.tsx

## 📊 État Actuel

**Fichier** : `src/pages/Index.tsx`
**Taille** : ~834 lignes
**Complexité** : Très haute

### Responsabilités actuelles (TROP !)

1. Chargement des données dashboard (traitements, prises, stocks)
2. Gestion de l'état local (dialogs, filtres, accordions)
3. Logique métier (détection retards, calcul QSP)
4. Handlers d'actions (prendre médicament, skip)
5. Rendu UI complet (sections Today/Tomorrow, cards, dialogs)
6. Gestion des alertes stocks
7. Statistiques d'adhérence

### Interfaces actuelles

```typescript
interface UpcomingIntake {
  id: string;
  medicationId: string;
  medication: string;
  dosage: string;
  time: string;
  date: Date;
  treatment: string;
  treatmentId: string;
  pathology: string;
  currentStock: number;
  minThreshold: number;
  treatmentQspDays?: number | null;
  treatmentEndDate?: string | null;
}

interface StockAlert {
  id: string;
  medication: string;
  remaining: number;
  daysLeft: number;
}

interface ActiveTreatment {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  qspDays: number | null;
}
```

## 🎯 Structure Cible

```
src/pages/index/
  ├── Index.tsx                    # ~120 lignes - Orchestrateur
  ├── types.ts                     # Toutes les interfaces
  ├── components/
  │   ├── DashboardHeader.tsx      # Stats + missed intakes badge
  │   ├── TreatmentFilter.tsx      # Filtre par traitement
  │   ├── TodaySection.tsx         # Section "Aujourd'hui"
  │   ├── TomorrowSection.tsx      # Section "Demain"
  │   ├── IntakeCard.tsx           # Card d'une prise individuelle
  │   ├── TreatmentAccordion.tsx   # Accordéon par traitement
  │   └── TakeIntakeDialog.tsx     # Dialog de confirmation
  └── hooks/
      ├── useDashboardData.ts      # Chargement données complètes
      ├── useTakeIntake.ts         # Action: prendre un médicament
      └── useAccordionState.ts     # Gestion accordions auto-expand
```

## 📝 Décomposition Détaillée

### 1. types.ts

```typescript
export interface UpcomingIntake {
  id: string;
  medicationId: string;
  medication: string;
  dosage: string;
  time: string;
  date: Date;
  treatment: string;
  treatmentId: string;
  pathology: string;
  currentStock: number;
  minThreshold: number;
  treatmentQspDays?: number | null;
  treatmentEndDate?: string | null;
}

export interface StockAlert {
  id: string;
  medication: string;
  remaining: number;
  daysLeft: number;
}

export interface ActiveTreatment {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  qspDays: number | null;
}
```

### 2. hooks/useDashboardData.ts

**Responsabilité** : Charger toutes les données du dashboard
**Returns** :

```typescript
{
  upcomingIntakes: UpcomingIntake[]
  stockAlerts: StockAlert[]
  activeTreatments: ActiveTreatment[]
  loading: boolean
  refresh: () => Promise<void>
}
```

**Logique extraite** :

- Lignes 103-300 actuelles (loadDashboardData)
- Requêtes Supabase (treatments, medications, intakes)
- Calcul QSP
- Transformation des données

### 3. hooks/useTakeIntake.ts

**Responsabilité** : Gérer la prise d'un médicament
**Returns** :

```typescript
{
  takeIntake: (intake: UpcomingIntake) => Promise<void>;
  isProcessing: boolean;
}
```

**Logique extraite** :

- Lignes 302-397 actuelles (handleTakeIntake)
- Update Supabase medication_intakes
- Update stock
- Toast notifications
- Refresh dashboard

### 4. hooks/useAccordionState.ts

**Responsabilité** : Auto-expand accordions "Aujourd'hui"
**Returns** :

```typescript
{
  openAccordions: string[]
  setOpenAccordions: (ids: string[]) => void
}
```

**Logique extraite** :

- Lignes 82-100 actuelles (useEffect)
- Détection intakes d'aujourd'hui
- Construction des IDs accordions

### 5. components/DashboardHeader.tsx

**Props** :

```typescript
interface DashboardHeaderProps {
  adherenceStats: AdherenceStats;
  missedCount: number;
  onMissedClick: () => void;
}
```

**Contenu** :

- Titre "MyHealth+"
- Badge prises manquées
- Cards statistiques (À l'heure, Manquées, Pourcentage)

**Lignes extraites** : 408-489

### 6. components/TreatmentFilter.tsx

**Props** :

```typescript
interface TreatmentFilterProps {
  treatments: ActiveTreatment[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
}
```

**Contenu** :

- Select pour filtrer par traitement
- Option "Tous les traitements"

**Lignes extraites** : 491-506

### 7. components/TodaySection.tsx

**Props** :

```typescript
interface TodaySectionProps {
  intakes: UpcomingIntake[];
  openAccordions: string[];
  onAccordionChange: (ids: string[]) => void;
  onTakeIntake: (intake: UpcomingIntake) => void;
  sectionRef: React.RefObject<HTMLDivElement>;
}
```

**Contenu** :

- Titre "Aujourd'hui"
- Grouping par traitement
- Accordions avec IntakeCard

**Lignes extraites** : 511-625

### 8. components/TomorrowSection.tsx

**Props** : Identiques à TodaySection

**Contenu** :

- Titre "Demain"
- Grouping par traitement
- Accordions avec IntakeCard

**Lignes extraites** : 630-744

### 9. components/IntakeCard.tsx

**Props** :

```typescript
interface IntakeCardProps {
  intake: UpcomingIntake;
  onTake: () => void;
  isOverdue: boolean;
}
```

**Contenu** :

- Card avec heure, médication, dosage
- Badge pathologie
- Badge stock
- Bouton "Prendre"
- Gestion disabled si stock=0 ou overdue

**Lignes extraites** : Pattern répété dans sections

### 10. components/TreatmentAccordion.tsx

**Props** :

```typescript
interface TreatmentAccordionProps {
  treatmentId: string;
  treatmentName: string;
  qspDays?: number | null;
  endDate?: string | null;
  intakes: UpcomingIntake[];
  onTakeIntake: (intake: UpcomingIntake) => void;
  prefix: "today" | "tomorrow";
}
```

**Contenu** :

- AccordionItem avec trigger custom
- Info QSP / Date fin
- Liste IntakeCard

### 11. components/TakeIntakeDialog.tsx

**Props** :

```typescript
interface TakeIntakeDialogProps {
  intake: UpcomingIntake | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (intake: UpcomingIntake) => Promise<void>;
  isProcessing: boolean;
}
```

**Contenu** :

- Dialog de confirmation
- Affichage info médicament
- Boutons Annuler / Confirmer

**Lignes extraites** : 747-834

### 12. Index.tsx (Orchestrateur)

**Taille cible** : ~120 lignes

**Contenu** :

```typescript
import { AppLayout } from "@/components/Layout/AppLayout"
import { useDashboardData } from "./hooks/useDashboardData"
import { useTakeIntake } from "./hooks/useTakeIntake"
import { useAccordionState } from "./hooks/useAccordionState"
import { DashboardHeader } from "./components/DashboardHeader"
import { TreatmentFilter } from "./components/TreatmentFilter"
import { TodaySection } from "./components/TodaySection"
import { TomorrowSection } from "./components/TomorrowSection"
import { TakeIntakeDialog } from "./components/TakeIntakeDialog"
import { useAdherenceStats } from "@/hooks/useAdherenceStats"
import { useMissedIntakesDetection } from "@/hooks/useMissedIntakesDetection"
import type { UpcomingIntake } from "./types"

const Index = () => {
  // Hooks
  const { upcomingIntakes, stockAlerts, activeTreatments, loading, refresh } = useDashboardData()
  const { takeIntake, isProcessing } = useTakeIntake(refresh)
  const { openAccordions, setOpenAccordions } = useAccordionState(upcomingIntakes, loading)
  const { stats: adherenceStats } = useAdherenceStats()
  const { missedIntakes, totalMissed } = useMissedIntakesDetection()

  // Local state
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedIntake, setSelectedIntake] = useState<UpcomingIntake | null>(null)

  // Handlers
  const handleTakeClick = (intake: UpcomingIntake) => {
    setSelectedIntake(intake)
    setShowDialog(true)
  }

  const handleConfirm = async (intake: UpcomingIntake) => {
    await takeIntake(intake)
    setShowDialog(false)
  }

  // Filtrage
  const filteredIntakes = selectedTreatmentId
    ? upcomingIntakes.filter(i => i.treatmentId === selectedTreatmentId)
    : upcomingIntakes

  if (loading) return <AppLayout><Loader /></AppLayout>

  return (
    <AppLayout>
      <DashboardHeader
        adherenceStats={adherenceStats}
        missedCount={totalMissed}
        onMissedClick={() => navigate('/history')}
      />

      <TreatmentFilter
        treatments={activeTreatments}
        selectedId={selectedTreatmentId}
        onChange={setSelectedTreatmentId}
      />

      <TodaySection
        intakes={filteredIntakes}
        openAccordions={openAccordions}
        onAccordionChange={setOpenAccordions}
        onTakeIntake={handleTakeClick}
      />

      <TomorrowSection
        intakes={filteredIntakes}
        openAccordions={openAccordions}
        onAccordionChange={setOpenAccordions}
        onTakeIntake={handleTakeClick}
      />

      <TakeIntakeDialog
        intake={selectedIntake}
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={handleConfirm}
        isProcessing={isProcessing}
      />
    </AppLayout>
  )
}
```

## 🔄 Plan d'Exécution

1. ✅ Créer `src/pages/index/` directory
2. ✅ Créer `types.ts`
3. ✅ Créer `hooks/useDashboardData.ts`
4. ✅ Créer `hooks/useTakeIntake.ts`
5. ✅ Créer `hooks/useAccordionState.ts`
6. ✅ Créer tous les composants
7. ✅ Refactorer Index.tsx
8. ✅ Supprimer ancien `src/pages/Index.tsx`
9. ✅ Mettre à jour `src/App.tsx` : `import Index from "./pages/index/Index"`
10. ✅ Vérifier avec `get_errors`
11. ✅ Tester manuellement

## ⚠️ Points d'Attention

- **useIntakeOverdue** : Reste un hook partagé (`@/hooks/useIntakeOverdue`)
- **sortIntakesByTimeAndName** : Util Phase 1 (`@/lib/sortingUtils`)
- **formatToFrenchTime** : Util Phase 1 (`@/lib/dateUtils`)
- **Ne pas dupliquer** la logique déjà mutualisée

## ✅ Critères de Validation

- [ ] Index.tsx < 150 lignes
- [ ] Tous les composants < 100 lignes
- [ ] Hooks bien isolés
- [ ] 0 erreur TypeScript
- [ ] Fonctionnalités intactes
- [ ] Imports organisés
