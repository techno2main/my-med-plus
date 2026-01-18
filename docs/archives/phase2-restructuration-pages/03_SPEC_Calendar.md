# SPEC 03 : Restructuration Calendar.tsx

## 📊 État Actuel

**Fichier** : `src/pages/Calendar.tsx`
**Taille** : ~608 lignes
**Complexité** : Haute

### Responsabilités actuelles (TROP !)

1. Affichage calendrier mensuel (date-fns calendar)
2. Chargement données mois (intakes par jour)
3. Chargement détails jour sélectionné
4. Calcul taux d'observance global
5. Gestion visites pharmacie/médecin
6. Styling dots calendrier (pris/manqué/à venir)
7. Affichage détails jour (cards intakes)
8. Navigation mois précédent/suivant

### Interfaces actuelles

```typescript
interface DayIntake {
  date: Date;
  total: number;
  taken: number;
  missed: number;
  upcoming: number;
}

interface IntakeDetail {
  id: string;
  medication: string;
  dosage: string;
  time: string;
  takenAt?: string;
  status: "taken" | "missed" | "upcoming";
  treatment: string;
  scheduledTimestamp?: string;
  takenAtTimestamp?: string;
}
```

## 🎯 Structure Cible

```
src/pages/calendar/
  ├── Calendar.tsx                    # ~120 lignes - Orchestrateur
  ├── types.ts                        # Toutes les interfaces
  ├── utils.ts                        # Helper fonctions (dots styling)
  ├── components/
  │   ├── CalendarView.tsx            # Calendrier shadcn avec custom styling
  │   ├── CalendarHeader.tsx          # Stats globales + visites
  │   ├── DayDetailsPanel.tsx         # Panneau détails jour sélectionné
  │   ├── IntakeDetailCard.tsx        # Card d'une prise détaillée
  │   └── VisitInfoCards.tsx          # Cards prochaines visites
  └── hooks/
      ├── useMonthIntakes.ts          # Chargement données mois
      ├── useDayDetails.ts            # Chargement détails jour
      └── useVisitDates.ts            # Chargement dates visites
```

## 📝 Décomposition Détaillée

### 1. types.ts

```typescript
export interface DayIntake {
  date: Date;
  total: number;
  taken: number;
  missed: number;
  upcoming: number;
}

export interface IntakeDetail {
  id: string;
  medication: string;
  dosage: string;
  time: string;
  takenAt?: string;
  status: "taken" | "missed" | "upcoming";
  treatment: string;
  scheduledTimestamp?: string;
  takenAtTimestamp?: string;
}

export interface VisitDates {
  nextPharmacyVisit: Date | null;
  nextDoctorVisit: Date | null;
  treatmentStartDate: Date | null;
}
```

### 2. utils.ts

**Helper functions** pour styling dots calendrier

```typescript
export const getDayModifiers = (date: Date, monthIntakes: DayIntake[]) => {
  const dayData = monthIntakes.find((d) => isSameDay(d.date, date));
  if (!dayData || dayData.total === 0) return null;

  if (dayData.taken > 0 && dayData.missed === 0) return "taken";
  if (dayData.missed > 0 && dayData.taken === 0) return "missed";
  if (dayData.taken > 0 && dayData.missed > 0) return "partial";
  if (dayData.upcoming > 0) return "upcoming";
  return null;
};

export const getDayClassName = (modifier: string | null) => {
  // Retourne className pour styling dots
};
```

**Lignes extraites** : 485-520 (logique modifiers/classNames)

### 3. hooks/useMonthIntakes.ts

**Responsabilité** : Charger les intakes du mois + observance
**Params** :

```typescript
{
  currentMonth: Date;
}
```

**Returns** :

```typescript
{
  monthIntakes: DayIntake[]
  observanceRate: number
  loading: boolean
}
```

**Logique extraite** :

- Lignes 57-182 actuelles (loadMonthData)
- Query Supabase medication_intakes pour le mois étendu (±7 jours)
- Grouping par jour avec calculs (taken/missed/upcoming)
- Calcul observance globale

### 4. hooks/useDayDetails.ts

**Responsabilité** : Charger détails jour sélectionné
**Params** :

```typescript
{
  selectedDate: Date;
}
```

**Returns** :

```typescript
{
  dayDetails: IntakeDetail[]
  loading: boolean
}
```

**Logique extraite** :

- Lignes 184-290 actuelles (loadDayDetails)
- Query intakes du jour sélectionné
- Tri avec sortIntakesByTimeAndName
- Calcul status (taken/missed/upcoming)

### 5. hooks/useVisitDates.ts

**Responsabilité** : Charger dates visites pharmacie/médecin
**Returns** :

```typescript
{
  nextPharmacyVisit: Date | null;
  nextDoctorVisit: Date | null;
  treatmentStartDate: Date | null;
}
```

**Logique extraite** :

- Lignes 73-97 actuelles (dans loadMonthData)
- Query treatments actifs (start_date, end_date)
- Query pharmacy_visits (is_completed = false)

### 6. components/CalendarView.tsx

**Props** :

```typescript
interface CalendarViewProps {
  currentMonth: Date;
  selectedDate: Date;
  onMonthChange: (date: Date) => void;
  onDateSelect: (date: Date) => void;
  monthIntakes: DayIntake[];
  treatmentStartDate: Date | null;
}
```

**Contenu** :

- CalendarComponent de shadcn
- Custom modifiers pour dots
- Custom className pour styling
- Disabled dates avant treatmentStartDate
- Navigation mois

**Lignes extraites** : 485-565

### 7. components/CalendarHeader.tsx

**Props** :

```typescript
interface CalendarHeaderProps {
  observanceRate: number;
  visitDates: VisitDates;
}
```

**Contenu** :

- Card taux d'observance global
- VisitInfoCards (prochaines visites)

**Lignes extraites** : 333-394

### 8. components/VisitInfoCards.tsx

**Props** :

```typescript
interface VisitInfoCardsProps {
  nextPharmacyVisit: Date | null;
  nextDoctorVisit: Date | null;
}
```

**Contenu** :

- Card "Prochaine visite pharmacie"
- Card "Date fin traitement"
- Icônes + dates formatées

**Lignes extraites** : 355-394

### 9. components/DayDetailsPanel.tsx

**Props** :

```typescript
interface DayDetailsPanelProps {
  selectedDate: Date;
  dayDetails: IntakeDetail[];
  loading: boolean;
}
```

**Contenu** :

- Header avec date sélectionnée
- Stats du jour (total/pris/manqués)
- Liste IntakeDetailCard
- EmptyState si aucune prise

**Lignes extraites** : 396-484

### 10. components/IntakeDetailCard.tsx

**Props** :

```typescript
interface IntakeDetailCardProps {
  intake: IntakeDetail;
  isOverdue: boolean;
}
```

**Contenu** :

- Card avec heure, médication, dosage
- Badge status avec icône
- Badge traitement
- Info retard si overdue
- Info heure prise si taken

**Lignes extraites** : Pattern répété dans DayDetailsPanel

### 11. Calendar.tsx (Orchestrateur)

**Taille cible** : ~120 lignes

**Contenu** :

```typescript
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { AppLayout } from "@/components/Layout/AppLayout"
import { PageHeader } from "@/components/Layout/PageHeader"
import { useMonthIntakes } from "./hooks/useMonthIntakes"
import { useDayDetails } from "./hooks/useDayDetails"
import { useVisitDates } from "./hooks/useVisitDates"
import { CalendarHeader } from "./components/CalendarHeader"
import { CalendarView } from "./components/CalendarView"
import { DayDetailsPanel } from "./components/DayDetailsPanel"
import { useIntakeOverdue } from "@/hooks/useIntakeOverdue"

const Calendar = () => {
  const navigate = useNavigate()
  const { isIntakeOverdue } = useIntakeOverdue()

  // State
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  // Hooks
  const { monthIntakes, observanceRate, loading: monthLoading } = useMonthIntakes({ currentMonth })
  const { dayDetails, loading: dayLoading } = useDayDetails({ selectedDate })
  const visitDates = useVisitDates()

  if (monthLoading) return <AppLayout><Loader /></AppLayout>

  return (
    <AppLayout>
      <PageHeader
        title="Calendrier"
        onBack={() => navigate("/")}
      />

      <CalendarHeader
        observanceRate={observanceRate}
        visitDates={visitDates}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalendarView
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onMonthChange={setCurrentMonth}
          onDateSelect={setSelectedDate}
          monthIntakes={monthIntakes}
          treatmentStartDate={visitDates.treatmentStartDate}
        />

        <DayDetailsPanel
          selectedDate={selectedDate}
          dayDetails={dayDetails}
          loading={dayLoading}
        />
      </div>
    </AppLayout>
  )
}
```

## 🔄 Plan d'Exécution

1. ✅ Créer `src/pages/calendar/` directory
2. ✅ Créer `types.ts`
3. ✅ Créer `utils.ts` (helpers dots styling)
4. ✅ Créer `hooks/useMonthIntakes.ts`
5. ✅ Créer `hooks/useDayDetails.ts`
6. ✅ Créer `hooks/useVisitDates.ts`
7. ✅ Créer tous les composants
8. ✅ Refactorer Calendar.tsx
9. ✅ Supprimer ancien `src/pages/Calendar.tsx`
10. ✅ Mettre à jour `src/App.tsx` : `import Calendar from "./pages/calendar/Calendar"`
11. ✅ Vérifier avec `get_errors`
12. ✅ Tester manuellement

## ⚠️ Points d'Attention

- **useIntakeOverdue** : Reste un hook partagé (`@/hooks/useIntakeOverdue`)
- **sortIntakesByTimeAndName** : Util Phase 1 (`@/lib/sortingUtils`)
- **formatToFrenchTime** : Util Phase 1 (`@/lib/dateUtils`)
- **date-fns** : startOfMonth, endOfMonth, isSameDay, format
- **CalendarComponent** : Shadcn calendar avec modifiers/classNames custom
- **Dots styling** : CSS spécifique pour les dots (taken/missed/partial/upcoming)

## ✅ Critères de Validation

- [ ] Calendar.tsx < 130 lignes
- [ ] Tous les composants < 100 lignes
- [ ] Hooks bien isolés
- [ ] 0 erreur TypeScript
- [ ] Fonctionnalités intactes (navigation, sélection, dots, détails)
- [ ] Styling dots calendrier correct
- [ ] Dates désactivées avant début traitement
- [ ] Imports organisés
