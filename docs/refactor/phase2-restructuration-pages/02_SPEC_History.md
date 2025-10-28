# SPEC 02 : Restructuration History.tsx

## 📊 État Actuel

**Fichier** : `src/pages/History.tsx`
**Taille** : ~663 lignes
**Complexité** : Haute

### Responsabilités actuelles (TROP !)
1. Chargement historique complet (medication_intakes + treatments)
2. Gestion tabs (Historique / Statistiques)
3. Filtrage par statut (tous/manquées/à l'heure/en retard)
4. Grouping par jour + par traitement
5. Expand/Collapse des jours
6. Auto-scroll vers aujourd'hui
7. Calculs de retard/avance
8. Rendu UI (cards, accordions, badges, stats)

### Interfaces actuelles
```typescript
interface MedicationIntake {
  id: string
  medication_id: string
  scheduled_time: string
  taken_at: string | null
  status: 'pending' | 'taken' | 'skipped'
  medications: {
    name: string
    catalog_id?: string
    medication_catalog?: {
      strength?: string
      default_posology?: string
    }
  }
}

interface GroupedIntakes {
  date: Date
  intakes: {
    id: string
    time: string
    medication: string
    dosage: string
    status: string
    takenAt?: string
    scheduledTimestamp?: string
    takenAtTimestamp?: string
    treatment: string
    treatmentId: string
    treatmentQspDays?: number | null
    treatmentEndDate?: string | null
  }[]
}
```

## 🎯 Structure Cible

```
src/pages/history/
  ├── History.tsx                     # ~100 lignes - Orchestrateur
  ├── types.ts                        # Toutes les interfaces
  ├── components/
  │   ├── HistoryTabs.tsx             # Tabs Historique/Statistiques
  │   ├── FilterButtons.tsx           # Filtres (tous/manquées/à l'heure/en retard)
  │   ├── DaySection.tsx              # Section par jour avec accordions
  │   ├── TreatmentGroup.tsx          # Groupe par traitement
  │   ├── IntakeHistoryCard.tsx       # Card d'une prise historique
  │   ├── StatsCards.tsx              # Cards statistiques (onglet Stats)
  │   └── EmptyState.tsx              # État vide (aucune prise)
  └── hooks/
      ├── useHistoryData.ts           # Chargement historique complet
      ├── useFilteredHistory.ts       # Filtrage + grouping
      └── useExpandedDays.ts          # Gestion expand/collapse + auto-scroll
```

## 📝 Décomposition Détaillée

### 1. types.ts
```typescript
export interface MedicationIntake {
  id: string
  medication_id: string
  scheduled_time: string
  taken_at: string | null
  status: 'pending' | 'taken' | 'skipped'
  medications: {
    name: string
    catalog_id?: string
    medication_catalog?: {
      strength?: string
      default_posology?: string
    }
  }
}

export interface IntakeHistoryItem {
  id: string
  time: string
  medication: string
  dosage: string
  status: string
  takenAt?: string
  scheduledTimestamp?: string
  takenAtTimestamp?: string
  treatment: string
  treatmentId: string
  treatmentQspDays?: number | null
  treatmentEndDate?: string | null
}

export interface GroupedIntakes {
  date: Date
  intakes: IntakeHistoryItem[]
}

export type FilterStatus = 'all' | 'missed' | 'ontime' | 'late'
export type ActiveTab = 'history' | 'stats'
```

### 2. hooks/useHistoryData.ts

**Responsabilité** : Charger l'historique complet depuis Supabase
**Returns** :
```typescript
{
  historyData: GroupedIntakes[]
  loading: boolean
  refresh: () => Promise<void>
}
```

**Logique extraite** :
- Lignes 174-265 actuelles (loadHistory)
- Query Supabase medication_intakes + treatments
- Calcul QSP par traitement
- Grouping par jour avec date-fns
- Tri des intakes par time

### 3. hooks/useFilteredHistory.ts

**Responsabilité** : Filtrer l'historique selon critères
**Params** : 
```typescript
{
  historyData: GroupedIntakes[]
  filterStatus: FilterStatus
}
```

**Returns** :
```typescript
{
  filteredData: GroupedIntakes[]
  hasMatches: boolean
}
```

**Logique extraite** :
- Lignes 95-127 actuelles (logique de filtrage)
- Calcul différence minutes (retard/avance)
- Filtrage selon status (missed/ontime/late)

### 4. hooks/useExpandedDays.ts

**Responsabilité** : Auto-expand aujourd'hui + gestion collapse
**Params** :
```typescript
{
  historyData: GroupedIntakes[]
  filterStatus: FilterStatus
  todayRef: React.RefObject<HTMLDivElement>
}
```

**Returns** :
```typescript
{
  expandedDays: Set<string>
  toggleDay: (dateKey: string) => void
}
```

**Logique extraite** :
- Lignes 76-93 (auto-expand today)
- Lignes 95-146 (auto-expand first match on filter)
- Gestion Set<string> pour expanded days

### 5. components/HistoryTabs.tsx

**Props** :
```typescript
interface HistoryTabsProps {
  activeTab: ActiveTab
  onChange: (tab: ActiveTab) => void
}
```

**Contenu** :
- Tabs Historique / Statistiques
- Navigation entre vues

**Lignes extraites** : 280-289

### 6. components/FilterButtons.tsx

**Props** :
```typescript
interface FilterButtonsProps {
  filterStatus: FilterStatus
  onChange: (status: FilterStatus) => void
}
```

**Contenu** :
- 4 boutons : Tous / Manquées / À l'heure / En retard
- Active state styling

**Lignes extraites** : 290-328

### 7. components/DaySection.tsx

**Props** :
```typescript
interface DaySectionProps {
  day: GroupedIntakes
  isExpanded: boolean
  onToggle: () => void
  filterStatus: FilterStatus
  dayRef?: React.RefObject<HTMLDivElement>
}
```

**Contenu** :
- Card avec header date + stats jour
- Bouton expand/collapse
- Liste TreatmentGroup

**Lignes extraites** : 395-480

### 8. components/TreatmentGroup.tsx

**Props** :
```typescript
interface TreatmentGroupProps {
  treatmentName: string
  qspDays?: number | null
  endDate?: string | null
  intakes: IntakeHistoryItem[]
}
```

**Contenu** :
- Header traitement avec QSP/Date fin
- Liste IntakeHistoryCard

**Lignes extraites** : Pattern dans DaySection

### 9. components/IntakeHistoryCard.tsx

**Props** :
```typescript
interface IntakeHistoryCardProps {
  intake: IntakeHistoryItem
  filterStatus: FilterStatus
}
```

**Contenu** :
- Card avec heure, médication, dosage
- Badge status (pris/manqué)
- Badge retard/avance si applicable
- Info heure de prise si taken

**Lignes extraites** : Pattern répété dans sections

### 10. components/StatsCards.tsx

**Props** :
```typescript
interface StatsCardsProps {
  stats: {
    total: number
    taken: number
    missed: number
    onTime: number
    late: number
    adherenceRate: number
    last7Days: any
    last30Days: any
  }
  loading: boolean
}
```

**Contenu** :
- Grid de cards statistiques
- Badges avec icônes
- Pourcentages

**Lignes extraites** : 577-663

### 11. components/EmptyState.tsx

**Props** :
```typescript
interface EmptyStateProps {
  message: string
}
```

**Contenu** :
- Card vide centrée
- Message personnalisé
- Icône

**Lignes extraites** : Pattern dans conditions

### 12. History.tsx (Orchestrateur)

**Taille cible** : ~100 lignes

**Contenu** :
```typescript
import { useState, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AppLayout } from "@/components/Layout/AppLayout"
import { PageHeader } from "@/components/Layout/PageHeader"
import { useHistoryData } from "./hooks/useHistoryData"
import { useFilteredHistory } from "./hooks/useFilteredHistory"
import { useExpandedDays } from "./hooks/useExpandedDays"
import { HistoryTabs } from "./components/HistoryTabs"
import { FilterButtons } from "./components/FilterButtons"
import { DaySection } from "./components/DaySection"
import { StatsCards } from "./components/StatsCards"
import { EmptyState } from "./components/EmptyState"
import { useAdherenceStats } from "@/hooks/useAdherenceStats"
import type { FilterStatus, ActiveTab } from "./types"

const History = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const todayRef = useRef<HTMLDivElement>(null)
  
  // State
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    (searchParams.get("tab") as ActiveTab) || "history"
  )
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  
  // Hooks
  const { historyData, loading } = useHistoryData()
  const { filteredData } = useFilteredHistory({ historyData, filterStatus })
  const { expandedDays, toggleDay } = useExpandedDays({ 
    historyData, 
    filterStatus,
    todayRef 
  })
  const { stats, loading: statsLoading } = useAdherenceStats()
  
  // Handlers
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab)
    setSearchParams(tab === "history" ? {} : { tab })
  }
  
  if (loading) return <AppLayout><Loader /></AppLayout>
  
  return (
    <AppLayout>
      <PageHeader 
        title="Historique" 
        onBack={() => navigate("/")}
      />
      
      <HistoryTabs 
        activeTab={activeTab}
        onChange={handleTabChange}
      />
      
      {activeTab === "history" ? (
        <>
          <FilterButtons 
            filterStatus={filterStatus}
            onChange={setFilterStatus}
          />
          
          {filteredData.length === 0 ? (
            <EmptyState message="Aucune prise trouvée" />
          ) : (
            filteredData.map(day => (
              <DaySection
                key={day.date.toISOString()}
                day={day}
                isExpanded={expandedDays.has(day.date.toISOString())}
                onToggle={() => toggleDay(day.date.toISOString())}
                filterStatus={filterStatus}
                dayRef={isToday(day.date) ? todayRef : undefined}
              />
            ))
          )}
        </>
      ) : (
        <StatsCards stats={stats} loading={statsLoading} />
      )}
    </AppLayout>
  )
}
```

## 🔄 Plan d'Exécution

1. ✅ Créer `src/pages/history/` directory
2. ✅ Créer `types.ts`
3. ✅ Créer `hooks/useHistoryData.ts`
4. ✅ Créer `hooks/useFilteredHistory.ts`
5. ✅ Créer `hooks/useExpandedDays.ts`
6. ✅ Créer tous les composants
7. ✅ Refactorer History.tsx
8. ✅ Supprimer ancien `src/pages/History.tsx`
9. ✅ Mettre à jour `src/App.tsx` : `import History from "./pages/history/History"`
10. ✅ Vérifier avec `get_errors`
11. ✅ Tester manuellement

## ⚠️ Points d'Attention

- **useAdherenceStats** : Reste un hook partagé (`@/hooks/useAdherenceStats`)
- **calculateDaysBetween** : Util Phase 1 (`@/lib/dateUtils`)
- **sortIntakesByTimeAndName** : Util Phase 1 (`@/lib/sortingUtils`)
- **date-fns** : isToday, startOfDay, format déjà utilisés
- **Auto-scroll** : Gérer avec useRef + useEffect

## ✅ Critères de Validation

- [ ] History.tsx < 120 lignes
- [ ] Tous les composants < 100 lignes
- [ ] Hooks bien isolés
- [ ] 0 erreur TypeScript
- [ ] Fonctionnalités intactes (filtres, expand, stats)
- [ ] Auto-scroll vers aujourd'hui fonctionne
- [ ] Imports organisés
