# INVENTAIRE COMPLET - Phase 1 : Mutualisation des Fonctions

**Date**: 27 octobre 2025  
**Branche**: `phase1/mutualisation-fonctions`  
**Objectif**: Identifier TOUS les patterns de code dupliqué à mutualiser

---

## 📊 RÉSUMÉ EXÉCUTIF

### Statistiques Globales

- **226 fichiers .tsx** dans le projet
- **25 matches** de patterns de tri (`.sort`, `localeCompare`, `getEarliestTime`)
- **104 matches** de patterns de filtrage (`is_active`, `.filter`)
- **100+ matches** de manipulation de dates
- **12 matches** de patterns de grouping (`.reduce`, regroupement par traitement/jour)

### Problèmes Critiques Identifiés

1. ✅ **FIXÉ** : `useMissedIntakesDetection` - manquait filtre `is_active` (commit phase1)
2. 🚨 **CRITIQUE** : `useAdherenceStats` - **NE FILTRE PAS** `is_active` → compte les stats des traitements archivés !
3. 📋 **Code dupliqué** : 8+ instances de tri identique à travers 6 fichiers
4. 📋 **Grouping dupliqué** : 2 patterns de grouping par traitement répétés
5. 📋 **Date utils** : Conversions timezone parfois manuelles au lieu d'utiliser `dateUtils.ts`

---

## 🎯 PATTERNS À MUTUALISER

### 1. SORTING (Tri)

#### Pattern 1.1 : Tri des prises par horaire puis nom de médicament

**Code dupliqué identique dans 5 fichiers :**

```typescript
intakes.sort((a, b) => {
  const timeCompare = a.time.localeCompare(b.time);
  if (timeCompare !== 0) return timeCompare;
  return a.medication.localeCompare(b.medication);
});
```

**Localisations :**

1. `src/pages/Index.tsx` - ligne 548-553 (section Aujourd'hui)
2. `src/pages/Index.tsx` - ligne 674-679 (section Demain)
3. `src/pages/Calendar.tsx` - ligne 278-283 (détails du jour)
4. `src/pages/History.tsx` - ligne 259-264 (prises groupées par jour)
5. _(Potentiellement d'autres instances)_

**Solution** : `sortIntakesByTimeAndName<T>(intakes: T[]): T[]`

---

#### Pattern 1.2 : Tri des médicaments par horaire le plus tôt

**Code dupliqué dans 2 fichiers :**

```typescript
medications.sort((a, b) => {
  const getEarliestTime = (times: string[]) => {
    if (!times || times.length === 0) return Infinity;
    const minutes = times.map((t) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    });
    return Math.min(...minutes);
  };

  const timeA = getEarliestTime(a.times);
  const timeB = getEarliestTime(b.times);
  if (timeA !== timeB) return timeA - timeB;
  return a.name.localeCompare(b.name, "fr");
});
```

**Localisations :**

1. `src/pages/Treatments.tsx` - ligne 170-187
2. `src/pages/TreatmentEdit.tsx` - ligne 162-173 (version simplifiée)

**Solution** : `sortMedicationsByEarliestTime<T>(medications: T[]): T[]`

---

#### Pattern 1.3 : Tri des traitements par date de début

**Localisation :**

- `src/pages/Index.tsx` - ligne 142-147

```typescript
treatmentsWithQsp.sort((a, b) => {
  const dateA = new Date(a.start_date).getTime();
  const dateB = new Date(b.start_date).getTime();
  return dateA - dateB; // Plus ancien en premier
});
```

**Solution** : `sortTreatmentsByStartDate<T>(treatments: T[], ascending = true): T[]`

---

#### Pattern 1.4 : Tri simple de tableaux de strings (horaires)

**Localisations :**

1. `src/pages/Treatments.tsx` - ligne 151
2. `src/pages/MedicationCatalog.tsx` - ligne 79

```typescript
const sortedTimes = [...times].sort((a, b) => a.localeCompare(b));
```

**Solution** : `sortTimeStrings(times: string[]): string[]`

---

### 2. GROUPING (Regroupement)

#### Pattern 2.1 : Grouping des prises par traitement

**Code dupliqué dans 3 fichiers :**

```typescript
const groupedByTreatment = intakes.reduce(
  (acc, intake) => {
    const treatmentId = intake.treatment_id;
    if (!acc[treatmentId]) {
      acc[treatmentId] = {
        treatment: intake.treatment,
        treatmentId: treatmentId,
        intakes: [],
      };
    }
    acc[treatmentId].intakes.push(intake);
    return acc;
  },
  {} as Record<string, IntakeGroup>,
);
```

**Localisations :**

1. `src/pages/Index.tsx` - ligne 533-546 (section Aujourd'hui)
2. `src/pages/Index.tsx` - ligne 659-672 (section Demain)
3. `src/pages/History.tsx` - ligne 421-435 (par jour)

**Solution** : `groupIntakesByTreatment<T>(intakes: T[]): Record<string, IntakeGroup<T>>`

---

#### Pattern 2.2 : Grouping des prises par jour

**Localisation :**

- `src/pages/History.tsx` - ligne 221-255

```typescript
const grouped = intakes.reduce(
  (acc: Record<string, GroupedIntakes>, intake: any) => {
    const date = startOfDay(parseISO(intake.scheduled_time));
    const dateKey = date.toISOString();

    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: date,
        intakes: [],
      };
    }

    acc[dateKey].intakes.push({
      // ... mapping intake data
    });

    return acc;
  },
  {},
);
```

**Solution** : `groupIntakesByDay<T>(intakes: T[]): Record<string, DayGroup<T>>`

---

### 3. FILTERING (Filtrage)

#### Pattern 3.1 : Filtre is_active dans les requêtes Supabase

**Pattern récurrent dans TOUTES les pages :**

```typescript
// Pattern INNER JOIN avec filtre
.select(`
  ...,
  medications!inner(
    ...,
    treatments!inner(is_active)
  )
`)
.eq("medications.treatments.is_active", true)
```

**Localisations avec filtre is_active PRÉSENT ✅ :**

1. `src/pages/Index.tsx` - ligne 161-163, 188-195
2. `src/pages/Calendar.tsx` - ligne 74, 101-106, 167-171, 227-233
3. `src/pages/History.tsx` - ligne 178-181
4. `src/pages/Stock.tsx` - ligne 20-25
5. `src/components/TreatmentWizard/Step3Stocks.tsx` - ligne 36-39
6. `src/hooks/useMissedIntakesDetection.tsx` - ligne 73-77 (✅ FIXÉ)
7. `src/hooks/useAutoRegenerateIntakes.tsx` - ligne 32-35 (✅ OK)
8. `src/components/Layout/BottomNavigation.tsx` - ligne 73

**Localisations SANS filtre is_active 🚨 :**

1. 🚨 **CRITIQUE** : `src/hooks/useAdherenceStats.tsx` - ligne 37-48 **MANQUE le filtre !**

**Solution** :

- Constante `ACTIVE_TREATMENT_FILTER` à réutiliser
- Helper `buildActiveTreatmentQuery()` pour construire les requêtes

---

#### Pattern 3.2 : Comptage de traitements actifs

**Localisation :**

- `src/pages/Treatments.tsx` - ligne 238

```typescript
treatments.filter((t) => t.is_active).length;
```

**Solution** : `countActiveTreatments(treatments: Treatment[]): number`

---

### 4. DATE UTILS (Utilitaires de dates)

#### Pattern 4.1 : Conversion timezone (DÉJÀ CENTRALISÉ ✅)

**Fichier** : `src/lib/dateUtils.ts`

**Fonctions existantes :**

- ✅ `formatToFrenchTime(utcDateString: string): string` - Convertit UTC → Europe/Paris
- ✅ `convertFrenchToUTC(frenchDate: Date): Date` - Convertit Europe/Paris → UTC

**Utilisations correctes identifiées :**

1. `src/pages/History.tsx` - ligne 12, 241, 245
2. `src/pages/Rattrapage.tsx` - ligne 16, 144

**⚠️ Patterns manuels à remplacer :**
Rechercher tous les `new Date().toISOString()` et `parseISO()` qui pourraient bénéficier de ces utils.

---

#### Pattern 4.2 : Calcul de durée en jours

**Code répété dans 3 fichiers :**

```typescript
const startDate = new Date(treatment.start_date);
const endDate = new Date(treatment.end_date);
const durationDays = Math.ceil(
  (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
);
```

**Localisations :**

1. `src/pages/Treatments.tsx` - ligne 106-108
2. `src/pages/TreatmentEdit.tsx` - ligne 104-106
3. `src/pages/History.tsx` - ligne 208-210

**Solution** : `calculateDaysBetween(startDate: string, endDate: string): number`

---

#### Pattern 4.3 : Calcul de date de fin à partir d'une durée

**Localisation :**

- `src/pages/TreatmentEdit.tsx` - ligne 111-114, 192-195, 223-226

```typescript
const startDate = new Date(treatmentData.start_date);
const endDate = new Date(startDate);
endDate.setDate(startDate.getDate() + durationDays);
const calculatedEndDate = endDate.toISOString().split("T")[0];
```

**Solution** : `calculateEndDate(startDate: string, durationDays: number): string`

---

#### Pattern 4.4 : Formatage de dates françaises

**Pattern répété 15+ fois :**

```typescript
new Date(dateString).toLocaleDateString("fr-FR");
```

**Localisations :**

1. `src/pages/Treatments.tsx` - ligne 313, 318
2. `src/pages/TreatmentEdit.tsx` - ligne 352
3. `src/pages/Stock.tsx` - ligne 160
4. `src/pages/StockDetails.tsx` - ligne 154
5. `src/pages/Prescriptions.tsx` - ligne 309, 317, 381, 386, 390, 396
6. _(Potentiellement 5+ autres)_

**Solution** : `formatToFrenchDate(dateString: string): string`

---

## 📂 INVENTAIRE PAR FICHIER

### PAGES (src/pages/)

#### ✅ Index.tsx

**Patterns identifiés :**

- Ligne 142-147 : Tri des traitements par start_date → `sortTreatmentsByStartDate()`
- Ligne 161-163 : Filtre is_active ✅ (OK)
- Ligne 188-195 : Filtre is_active ✅ (OK)
- Ligne 533-546 : Grouping par traitement → `groupIntakesByTreatment()`
- Ligne 548-553 : Tri des prises → `sortIntakesByTimeAndName()`
- Ligne 659-672 : Grouping par traitement → `groupIntakesByTreatment()`
- Ligne 674-679 : Tri des prises → `sortIntakesByTimeAndName()`

**Actions requises :**

1. Remplacer 2 tris manuels par `sortIntakesByTimeAndName()`
2. Remplacer 2 groupings par `groupIntakesByTreatment()`
3. Remplacer tri traitements par `sortTreatmentsByStartDate()`

---

#### ✅ Calendar.tsx

**Patterns identifiés :**

- Ligne 74 : Filtre is_active ✅ (OK)
- Ligne 101-106 : Filtre is_active ✅ (OK)
- Ligne 167-171 : Filtre is_active ✅ (OK)
- Ligne 227-233 : Filtre is_active ✅ (OK)
- Ligne 278-283 : Tri des détails du jour → `sortIntakesByTimeAndName()`

**Actions requises :**

1. Remplacer tri manuel par `sortIntakesByTimeAndName()`

---

#### ✅ History.tsx

**Patterns identifiés :**

- Ligne 12 : Import `formatToFrenchTime` ✅ (OK)
- Ligne 178-181 : Filtre is_active ✅ (OK)
- Ligne 208-210 : Calcul durée → `calculateDaysBetween()`
- Ligne 221-255 : Grouping par jour → `groupIntakesByDay()`
- Ligne 241 : Utilise `formatToFrenchTime` ✅ (OK)
- Ligne 245 : Utilise `formatToFrenchTime` ✅ (OK)
- Ligne 259-264 : Tri des prises → `sortIntakesByTimeAndName()`
- Ligne 421-435 : Grouping par traitement → `groupIntakesByTreatment()`

**Actions requises :**

1. Remplacer tri manuel par `sortIntakesByTimeAndName()`
2. Remplacer grouping par jour par `groupIntakesByDay()`
3. Remplacer grouping par traitement par `groupIntakesByTreatment()`
4. Remplacer calcul durée par `calculateDaysBetween()`

---

#### ✅ Treatments.tsx

**Patterns identifiés :**

- Ligne 55 : Order by is_active ✅ (OK)
- Ligne 106-108 : Calcul durée → `calculateDaysBetween()`
- Ligne 151 : Tri des horaires → `sortTimeStrings()`
- Ligne 170-187 : Tri médicaments par horaire → `sortMedicationsByEarliestTime()`
- Ligne 238 : Comptage traitements actifs → `countActiveTreatments()`
- Ligne 313, 318 : Format date française → `formatToFrenchDate()`

**Actions requises :**

1. Remplacer tri horaires par `sortTimeStrings()`
2. Remplacer tri médicaments par `sortMedicationsByEarliestTime()`
3. Remplacer calcul durée par `calculateDaysBetween()`
4. Remplacer formatages dates par `formatToFrenchDate()`

---

#### ✅ TreatmentEdit.tsx

**Patterns identifiés :**

- Ligne 104-106 : Calcul durée → `calculateDaysBetween()`
- Ligne 111-114 : Calcul date de fin → `calculateEndDate()`
- Ligne 162-173 : Tri médicaments par horaire → `sortMedicationsByEarliestTime()`
- Ligne 192-195 : Calcul date de fin → `calculateEndDate()`
- Ligne 223-226 : Calcul date de fin → `calculateEndDate()`
- Ligne 352 : Format date française → `formatToFrenchDate()`

**Actions requises :**

1. Remplacer tri médicaments par `sortMedicationsByEarliestTime()`
2. Remplacer 3 calculs de date de fin par `calculateEndDate()`
3. Remplacer calcul durée par `calculateDaysBetween()`
4. Remplacer formatage date par `formatToFrenchDate()`

---

#### ✅ MedicationCatalog.tsx

**Patterns identifiés :**

- Ligne 79 : Tri des horaires → `sortTimeStrings()`

**Actions requises :**

1. Remplacer tri horaires par `sortTimeStrings()`

---

#### ✅ Stock.tsx

**Patterns identifiés :**

- Ligne 20-25 : Filtre is_active ✅ (OK)
- Ligne 160 : Format date française → `formatToFrenchDate()`

**Actions requises :**

1. Remplacer formatage date par `formatToFrenchDate()`

---

#### ✅ StockDetails.tsx

**Patterns identifiés :**

- Ligne 154 : Format date française → `formatToFrenchDate()`

**Actions requises :**

1. Remplacer formatage date par `formatToFrenchDate()`

---

#### ✅ Prescriptions.tsx

**Patterns identifiés :**

- Ligne 74-80 : Calcul jours avant expiration (manuel)
- Ligne 309, 317, 381, 386, 390, 396 : Format date française → `formatToFrenchDate()`

**Actions requises :**

1. Remplacer 6 formatages dates par `formatToFrenchDate()`

---

#### ✅ Rattrapage.tsx

**Patterns identifiés :**

- Ligne 16 : Import `convertFrenchToUTC` ✅ (OK)
- Ligne 144 : Utilise `convertFrenchToUTC` ✅ (OK)

**Actions requises :**

- Aucune (déjà conforme)

---

### HOOKS (src/hooks/)

#### 🚨 useAdherenceStats.tsx - CRITIQUE

**Patterns identifiés :**

- Ligne 37-48 : Query **SANS filtre is_active** 🚨

```typescript
const { data: intakesData, error } = await supabase
  .from("medication_intakes")
  .select(
    `
    id,
    medication_id,
    scheduled_time,
    taken_at,
    status,
    medications (
      treatment_id,
      treatments(user_id)  // ⚠️ MANQUE is_active ici !
    )
  `,
  )
  .order("scheduled_time", { ascending: false });
```

**🚨 IMPACT CRITIQUE :**
Les statistiques d'observance incluent les prises des traitements archivés ! Cela fausse complètement les métriques affichées à l'utilisateur.

**Solution requise :**

```typescript
.select(`
  id,
  medication_id,
  scheduled_time,
  taken_at,
  status,
  medications!inner(
    treatment_id,
    treatments!inner(user_id, is_active)
  )
`)
.eq("medications.treatments.is_active", true)
```

**Actions requises :**

1. 🚨 **URGENT** : Ajouter filtre is_active dans la query
2. Tester impact sur stats d'observance
3. Vérifier que les % affichés sont corrects après fix

---

#### ✅ useMissedIntakesDetection.tsx - FIXÉ

**Status :** ✅ Filtre is_active ajouté (commit phase1)

- Ligne 73-77 : Filtre is_active ✅ (OK)

**Actions requises :**

- Aucune (déjà fixé)

---

#### ✅ useAutoRegenerateIntakes.tsx - OK

**Patterns identifiés :**

- Ligne 32-35 : Filtre is_active ✅ (OK)

**Actions requises :**

- Aucune (déjà conforme)

---

### COMPOSANTS (src/components/)

#### ✅ TreatmentWizard/Step3Stocks.tsx

**Patterns identifiés :**

- Ligne 36-39 : Filtre is_active ✅ (OK)

**Actions requises :**

- Aucune (déjà conforme)

---

#### ✅ Layout/BottomNavigation.tsx

**Patterns identifiés :**

- Ligne 73 : Filtre is_active ✅ (OK)

**Actions requises :**

- Aucune (déjà conforme)

---

## 📋 PLAN D'ACTION DÉTAILLÉ

### Étape 1 : Créer les utilitaires (4 fichiers)

#### 1.1 - sortingUtils.ts

**Fichier** : `src/lib/sortingUtils.ts`

**Fonctions à créer :**

1. `sortIntakesByTimeAndName<T>(intakes: T[]): T[]`
2. `sortMedicationsByEarliestTime<T>(medications: T[]): T[]`
3. `sortTreatmentsByStartDate<T>(treatments: T[], ascending?: boolean): T[]`
4. `sortTimeStrings(times: string[]): string[]`

**Interfaces requises :**

```typescript
interface IntakeWithTime {
  time: string;
  medication: string;
}

interface MedicationWithTimes {
  name: string;
  times: string[];
}

interface TreatmentWithDate {
  start_date: string;
}
```

---

#### 1.2 - groupingUtils.ts

**Fichier** : `src/lib/groupingUtils.ts`

**Fonctions à créer :**

1. `groupIntakesByTreatment<T>(intakes: T[]): Record<string, IntakeGroup<T>>`
2. `groupIntakesByDay<T>(intakes: T[]): Record<string, DayGroup<T>>`

**Interfaces requises :**

```typescript
interface IntakeWithTreatment {
  treatment_id: string;
  treatment: string;
}

interface IntakeWithScheduledTime {
  scheduled_time: string;
}

interface IntakeGroup<T> {
  treatment: string;
  treatmentId: string;
  intakes: T[];
}

interface DayGroup<T> {
  date: Date;
  intakes: T[];
}
```

---

#### 1.3 - filterUtils.ts

**Fichier** : `src/lib/filterUtils.ts`

**Constantes et helpers à créer :**

1. `ACTIVE_TREATMENT_FILTER` - Template de requête Supabase
2. `countActiveTreatments(treatments: Treatment[]): number`
3. `filterActiveTreatments<T>(treatments: T[]): T[]`

**Type guards :**

```typescript
interface TreatmentWithActiveStatus {
  is_active: boolean;
}
```

---

#### 1.4 - dateUtils.ts (compléter existant)

**Fichier** : `src/lib/dateUtils.ts` (EXISTE DÉJÀ)

**Fonctions existantes ✅ :**

- `formatToFrenchTime(utcDateString: string): string`
- `convertFrenchToUTC(frenchDate: Date): Date`

**Nouvelles fonctions à ajouter :**

1. `calculateDaysBetween(startDate: string, endDate: string): number`
2. `calculateEndDate(startDate: string, durationDays: number): string`
3. `formatToFrenchDate(dateString: string): string`

---

### Étape 2 : Fixer le bug critique useAdherenceStats

**Fichier** : `src/hooks/useAdherenceStats.tsx`

**Changement requis :**

```typescript
// AVANT (ligne 37-48) :
const { data: intakesData, error } = await supabase
  .from("medication_intakes")
  .select(
    `
    id,
    medication_id,
    scheduled_time,
    taken_at,
    status,
    medications (
      treatment_id,
      treatments(user_id)
    )
  `,
  )
  .order("scheduled_time", { ascending: false });

// APRÈS :
const { data: intakesData, error } = await supabase
  .from("medication_intakes")
  .select(
    `
    id,
    medication_id,
    scheduled_time,
    taken_at,
    status,
    medications!inner(
      treatment_id,
      treatments!inner(user_id, is_active)
    )
  `,
  )
  .eq("medications.treatments.is_active", true)
  .order("scheduled_time", { ascending: false });
```

---

### Étape 3 : Refactoriser les pages (6 fichiers)

#### 3.1 - Index.tsx

**Imports à ajouter :**

```typescript
import {
  sortIntakesByTimeAndName,
  sortTreatmentsByStartDate,
} from "@/lib/sortingUtils";
import { groupIntakesByTreatment } from "@/lib/groupingUtils";
```

**Remplacements :**

1. Ligne 142-147 → `treatmentsWithQsp = sortTreatmentsByStartDate(treatmentsWithQsp);`
2. Ligne 533-546 → `const groupedByTreatment = groupIntakesByTreatment(todayIntakes);`
3. Ligne 548-553 → `group.intakes = sortIntakesByTimeAndName(group.intakes);`
4. Ligne 659-672 → `const groupedByTreatment = groupIntakesByTreatment(tomorrowIntakes);`
5. Ligne 674-679 → `group.intakes = sortIntakesByTimeAndName(group.intakes);`

---

#### 3.2 - Calendar.tsx

**Imports à ajouter :**

```typescript
import { sortIntakesByTimeAndName } from "@/lib/sortingUtils";
```

**Remplacements :**

1. Ligne 278-283 → `details = sortIntakesByTimeAndName(details);`

---

#### 3.3 - History.tsx

**Imports à ajouter :**

```typescript
import { sortIntakesByTimeAndName } from "@/lib/sortingUtils";
import {
  groupIntakesByTreatment,
  groupIntakesByDay,
} from "@/lib/groupingUtils";
import { calculateDaysBetween } from "@/lib/dateUtils";
```

**Remplacements :**

1. Ligne 208-210 → `qspDays = calculateDaysBetween(treatment.start_date, treatment.end_date);`
2. Ligne 221-255 → `const grouped = groupIntakesByDay(intakesData);`
3. Ligne 259-264 → `day.intakes = sortIntakesByTimeAndName(day.intakes);`
4. Ligne 421-435 → `const groupedByTreatment = groupIntakesByTreatment(day.intakes);`

---

#### 3.4 - Treatments.tsx

**Imports à ajouter :**

```typescript
import {
  sortTimeStrings,
  sortMedicationsByEarliestTime,
} from "@/lib/sortingUtils";
import { calculateDaysBetween, formatToFrenchDate } from "@/lib/dateUtils";
import { countActiveTreatments } from "@/lib/filterUtils";
```

**Remplacements :**

1. Ligne 106-108 → `qspDays = calculateDaysBetween(treatment.start_date, treatment.end_date);`
2. Ligne 151 → `const sortedTimes = sortTimeStrings(med.times || []);`
3. Ligne 170-187 → `medsWithPathology = sortMedicationsByEarliestTime(medsWithPathology);`
4. Ligne 238 → `subtitle={${countActiveTreatments(treatments)} traitement(s) actif(s)}`
5. Ligne 313 → `Début : ${formatToFrenchDate(treatment.start_date)}`
6. Ligne 318 → `• Fin : ${formatToFrenchDate(treatment.end_date)}`

---

#### 3.5 - TreatmentEdit.tsx

**Imports à ajouter :**

```typescript
import { sortMedicationsByEarliestTime } from "@/lib/sortingUtils";
import {
  calculateDaysBetween,
  calculateEndDate,
  formatToFrenchDate,
} from "@/lib/dateUtils";
```

**Remplacements :**

1. Ligne 104-106 → `durationDays = calculateDaysBetween(treatmentData.start_date, treatmentData.end_date);`
2. Ligne 111-114 → `calculatedEndDate = calculateEndDate(treatmentData.start_date, durationDays);`
3. Ligne 162-173 → `const sortedMedications = sortMedicationsByEarliestTime(medsWithPathology);`
4. Ligne 192-195 → `updated.endDate = calculateEndDate(newStartDate, formData.durationDays);`
5. Ligne 223-226 → `calculatedEndDate = calculateEndDate(formData.startDate, formData.durationDays);`
6. Ligne 352 → `{formatToFrenchDate(formData.endDate)}`

---

#### 3.6 - MedicationCatalog.tsx

**Imports à ajouter :**

```typescript
import { sortTimeStrings } from "@/lib/sortingUtils";
```

**Remplacements :**

1. Ligne 79 → `const sortedTimes = sortTimeStrings(times);`

---

### Étape 4 : Tests et validation

**Commandes à exécuter :**

```bash
npm run build
npm run lint
npx cap sync android  # Si modifications impactent mobile
```

**Tests manuels à effectuer :**

1. ✅ Page Index : Vérifier tri Today/Tomorrow
2. ✅ Page Calendar : Vérifier tri détails du jour
3. ✅ Page History : Vérifier tri et grouping
4. ✅ Page Treatments : Vérifier tri médicaments
5. ✅ Page TreatmentEdit : Vérifier calculs de dates
6. ✅ Statistiques d'observance : Vérifier qu'elles n'incluent plus les traitements archivés

---

## 📊 MÉTRIQUES DE RÉDUCTION

### Code dupliqué éliminé

- **Sorting** : 8 instances → 4 fonctions centralisées
- **Grouping** : 4 instances → 2 fonctions centralisées
- **Date utils** : 15+ instances → 3 nouvelles fonctions
- **Total** : ~200 lignes de code dupliqué éliminées

### Maintenance améliorée

- Modification d'un tri : 1 fichier au lieu de 5
- Bug dans un grouping : 1 fichier au lieu de 3
- Changement format date : 1 fichier au lieu de 15+

### Bugs critiques évités

- ✅ Traitements archivés exclus de tous les calculs
- ✅ Cohérence timezone garantie partout
- ✅ Logique de tri identique sur toutes les pages

---

## 🎯 CHECKLIST DE VALIDATION

### Avant de commencer

- [x] Inventaire complet créé
- [ ] Documents de spécification créés (sortingUtils, groupingUtils, filterUtils, dateUtils)
- [ ] Validation utilisateur obtenue

### Création des utilitaires

- [ ] sortingUtils.ts créé et testé
- [ ] groupingUtils.ts créé et testé
- [ ] filterUtils.ts créé et testé
- [ ] dateUtils.ts complété et testé
- [ ] Tests unitaires écrits pour chaque fonction

### Corrections de bugs

- [ ] useAdherenceStats.tsx fixé (is_active)
- [ ] Tests manuels des statistiques effectués
- [ ] Validation que les % sont corrects

### Refactoring des pages

- [ ] Index.tsx refactorisé
- [ ] Calendar.tsx refactorisé
- [ ] History.tsx refactorisé
- [ ] Treatments.tsx refactorisé
- [ ] TreatmentEdit.tsx refactorisé
- [ ] MedicationCatalog.tsx refactorisé
- [ ] Stock.tsx refactorisé (dates)
- [ ] StockDetails.tsx refactorisé (dates)
- [ ] Prescriptions.tsx refactorisé (dates)

### Tests et validation

- [ ] npm run build sans erreurs
- [ ] npm run lint sans warnings
- [ ] Tests manuels de toutes les pages
- [ ] Validation tri/grouping/filtres fonctionnent
- [ ] Validation traitements archivés invisibles partout
- [ ] Validation stats d'observance correctes

### Finalisation

- [ ] Documentation mise à jour
- [ ] Commit avec message détaillé
- [ ] Push vers phase1/mutualisation-fonctions
- [ ] Demande validation utilisateur avant merge dev

---

## 📝 NOTES IMPORTANTES

### Timezone Management

Le fichier `src/lib/dateUtils.ts` contient déjà les fonctions de conversion timezone :

- `formatToFrenchTime()` : Convertit UTC → Europe/Paris (gère heure d'hiver/été)
- `convertFrenchToUTC()` : Convertit Europe/Paris → UTC

⚠️ **TOUJOURS** utiliser ces fonctions au lieu de manipuler les dates manuellement !

### PostgreSQL Functions

Certaines fonctions côté serveur manipulent aussi les dates :

- `regenerate_future_intakes()` : Génère 7 jours de prises
- Utilise `AT TIME ZONE 'Europe/Paris'` dans SQL

⚠️ Cohérence timezone garantie entre frontend et backend.

### Tests de non-régression critiques

1. **Tri des prises** : Doit être identique avant/après refactor
2. **Grouping par traitement** : Structure doit rester la même
3. **Filtres is_active** : Aucun traitement archivé ne doit apparaître
4. **Stats d'observance** : % doivent exclure traitements archivés

---

## 🔍 FICHIERS NON CONCERNÉS

Les fichiers suivants ont été analysés mais ne nécessitent PAS de modifications :

### Pages

- Auth.tsx
- Admin.tsx
- About.tsx
- HealthProfessionals.tsx
- Pathologies.tsx
- Allergies.tsx
- NotificationSettings.tsx
- NotificationDebug.tsx
- NotFound.tsx
- Settings.tsx
- Referentials.tsx
- Profile.tsx
- Privacy.tsx
- NavigationManager.tsx
- TreatmentForm.tsx (wizard déjà géré)
- StockForm.tsx

### Hooks

- useAuth.tsx
- useUserRole.tsx
- usePullToRefresh.tsx
- useNotificationSystem.tsx
- useNotifications.tsx
- useNativeNotifications.tsx
- useIntakeOverdue.tsx
- useMedicationNotificationScheduler.tsx
- use-toast.ts
- use-mobile.tsx

### Composants

- TreatmentWizard/\* (sauf Step3Stocks déjà conforme)
- ui/chart.tsx
- Layout/BottomNavigation.tsx (déjà conforme)
- Autres composants UI

---

**Document créé le** : 27 octobre 2025  
**Dernière mise à jour** : 27 octobre 2025  
**Auteur** : Phase 1 - Refactoring Team  
**Status** : ✅ INVENTAIRE COMPLET - PRÊT POUR VALIDATION
