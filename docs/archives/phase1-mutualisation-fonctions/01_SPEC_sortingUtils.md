# SPÉCIFICATION - sortingUtils.ts

**Ordre d'exécution** : 1/5  
**Fichier à créer** : `src/lib/sortingUtils.ts`  
**Date** : 27 octobre 2025  
**Status** : ⏳ EN ATTENTE DE VALIDATION

---

## 🎯 OBJECTIF

Centraliser toutes les fonctions de tri utilisées dans l'application pour éliminer la duplication de code et garantir une cohérence dans l'ordre d'affichage des données.

---

## 📊 PROBLÈME IDENTIFIÉ

### Code dupliqué dans 6 fichiers

Le même code de tri est répété **8 fois** à travers l'application :

1. **Index.tsx** (2 occurrences) - lignes 548-553, 674-679
2. **Calendar.tsx** (1 occurrence) - ligne 278-283
3. **History.tsx** (1 occurrence) - ligne 259-264
4. **Treatments.tsx** (2 occurrences) - lignes 151, 170-187
5. **TreatmentEdit.tsx** (1 occurrence) - ligne 162-173
6. **MedicationCatalog.tsx** (1 occurrence) - ligne 79

### Impact

- **Maintenance difficile** : Modification d'un tri = toucher 8 endroits
- **Risque d'incohérence** : Chaque développeur peut implémenter différemment
- **Bugs potentiels** : Oubli de locale française, gestion des undefined, etc.

---

## 🔧 SOLUTION PROPOSÉE

Créer **4 fonctions de tri** génériques et réutilisables avec TypeScript generics pour la flexibilité.

---

## 📝 SPÉCIFICATIONS DES FONCTIONS

### Fonction 1 : `sortIntakesByTimeAndName()`

**Description** :  
Trie un tableau de prises de médicaments par :

1. Horaire prévu (ordre croissant)
2. Nom du médicament (ordre alphabétique français) si même horaire

**Signature TypeScript** :

```typescript
export function sortIntakesByTimeAndName<T extends IntakeWithTime>(
  intakes: T[],
): T[];
```

**Interface requise** :

```typescript
interface IntakeWithTime {
  time: string; // Format "HH:MM" (ex: "08:00", "14:30")
  medication: string; // Nom du médicament
}
```

**Comportement** :

- Créer une **copie** du tableau (non mutatif)
- Tri primaire : `time.localeCompare(b.time)`
- Tri secondaire : `medication.localeCompare(b.medication, 'fr', { sensitivity: 'base' })`
- Gestion de la casse insensible
- Support des caractères accentués français

**Exemple d'utilisation** :

```typescript
// AVANT (Index.tsx ligne 548-553)
group.intakes.sort((a, b) => {
  const timeCompare = a.time.localeCompare(b.time);
  if (timeCompare !== 0) return timeCompare;
  return a.medication.localeCompare(b.medication);
});

// APRÈS
group.intakes = sortIntakesByTimeAndName(group.intakes);
```

**Cas d'usage** :

- ✅ Index.tsx - Section "Aujourd'hui" (ligne 548-553)
- ✅ Index.tsx - Section "Demain" (ligne 674-679)
- ✅ Calendar.tsx - Détails du jour sélectionné (ligne 278-283)
- ✅ History.tsx - Prises groupées par jour (ligne 259-264)

**Tests attendus** :

```typescript
// Test 1 : Tri par horaire
[
  { time: "14:00", medication: "Doliprane" },
  { time: "08:00", medication: "Ibuprofène" },
][
  // Résultat attendu : [Ibuprofène 08:00, Doliprane 14:00]

  // Test 2 : Tri par nom si même horaire
  ({ time: "08:00", medication: "Paracétamol" },
  { time: "08:00", medication: "Aspirine" })
][
  // Résultat attendu : [Aspirine 08:00, Paracétamol 08:00]

  // Test 3 : Gestion accents
  ({ time: "08:00", medication: "Édéxime" },
  { time: "08:00", medication: "Ecran" })
];
// Résultat attendu : ordre alphabétique français correct
```

---

### Fonction 2 : `sortMedicationsByEarliestTime()`

**Description** :  
Trie un tableau de médicaments par leur **horaire de prise le plus tôt dans la journée**, puis par nom alphabétique.

**Signature TypeScript** :

```typescript
export function sortMedicationsByEarliestTime<T extends MedicationWithTimes>(
  medications: T[],
): T[];
```

**Interface requise** :

```typescript
interface MedicationWithTimes {
  name: string; // Nom du médicament
  times: string[]; // Tableau d'horaires ["08:00", "12:00", "20:00"]
}
```

**Comportement** :

- Créer une **copie** du tableau (non mutatif)
- Calculer l'horaire le plus tôt pour chaque médicament (helper privée)
- Tri primaire : par minutes depuis minuit de l'horaire le plus tôt
- Tri secondaire : par nom alphabétique français
- Gestion des tableaux vides : placer en fin de liste (`Infinity`)

**Helper privée** (interne au fichier) :

```typescript
function getEarliestMinutes(times: string[]): number {
  if (!times || times.length === 0) return Infinity;

  const minutes = times.map((time) => {
    const [hours, mins] = time.split(":").map(Number);
    return hours * 60 + mins;
  });

  return Math.min(...minutes);
}
```

**Exemple d'utilisation** :

```typescript
// AVANT (Treatments.tsx ligne 170-187)
medsWithPathology.sort((a, b) => {
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

// APRÈS
medsWithPathology = sortMedicationsByEarliestTime(medsWithPathology);
```

**Cas d'usage** :

- ✅ Treatments.tsx - Liste des médicaments d'un traitement (ligne 170-187)
- ✅ TreatmentEdit.tsx - Édition des médicaments (ligne 162-173)

**Tests attendus** :

```typescript
// Test 1 : Tri par horaire le plus tôt
[
  { name: "Doliprane", times: ["12:00", "20:00"] },
  { name: "Ibuprofène", times: ["08:00", "14:00"] },
][
  // Résultat : [Ibuprofène (08:00), Doliprane (12:00)]

  // Test 2 : Médicaments avec même premier horaire
  ({ name: "Paracétamol", times: ["08:00"] },
  { name: "Aspirine", times: ["08:00", "16:00"] })
][
  // Résultat : [Aspirine, Paracétamol] (ordre alpha)

  // Test 3 : Médicaments sans horaires (times = [])
  ({ name: "MedA", times: ["10:00"] }, { name: "MedB", times: [] })
];
// Résultat : [MedA, MedB] (vides en fin)
```

---

### Fonction 3 : `sortTreatmentsByStartDate()`

**Description** :  
Trie un tableau de traitements par date de début (ordre chronologique).

**Signature TypeScript** :

```typescript
export function sortTreatmentsByStartDate<T extends TreatmentWithDate>(
  treatments: T[],
  ascending: boolean = true,
): T[];
```

**Interface requise** :

```typescript
interface TreatmentWithDate {
  start_date: string; // Format ISO "YYYY-MM-DD" ou ISO timestamp
}
```

**Comportement** :

- Créer une **copie** du tableau (non mutatif)
- Convertir `start_date` en timestamp pour comparaison
- Paramètre `ascending` :
  - `true` (défaut) : Plus ancien en premier
  - `false` : Plus récent en premier
- Gestion robuste des dates invalides

**Exemple d'utilisation** :

```typescript
// AVANT (Index.tsx ligne 142-147)
treatmentsWithQsp.sort((a, b) => {
  const dateA = new Date(a.start_date).getTime();
  const dateB = new Date(b.start_date).getTime();
  return dateA - dateB;
});

// APRÈS
treatmentsWithQsp = sortTreatmentsByStartDate(treatmentsWithQsp);
// OU pour ordre inverse :
treatmentsWithQsp = sortTreatmentsByStartDate(treatmentsWithQsp, false);
```

**Cas d'usage** :

- ✅ Index.tsx - Liste des traitements avec QSP (ligne 142-147)
- ✅ Potentiellement d'autres pages affichant des traitements

**Tests attendus** :

```typescript
// Test 1 : Tri croissant (défaut)
[{ start_date: "2025-10-20" }, { start_date: "2025-10-15" }];
// Résultat : [2025-10-15, 2025-10-20]

// Test 2 : Tri décroissant
sortTreatmentsByStartDate(treatments, false)[
  // Résultat : [2025-10-20, 2025-10-15]

  // Test 3 : Dates avec timestamps
  ({ start_date: "2025-10-20T10:00:00Z" },
  { start_date: "2025-10-20T08:00:00Z" })
];
// Résultat : [08:00, 10:00]
```

---

### Fonction 4 : `sortTimeStrings()`

**Description** :  
Trie un tableau de strings d'horaires au format "HH:MM".

**Signature TypeScript** :

```typescript
export function sortTimeStrings(times: string[]): string[];
```

**Comportement** :

- Créer une **copie** du tableau (non mutatif)
- Tri simple par `localeCompare()` (suffisant pour format "HH:MM")
- Ordre croissant (matin → soir)

**Exemple d'utilisation** :

```typescript
// AVANT (Treatments.tsx ligne 151)
const sortedTimes = [...(med.times || [])].sort((a, b) => {
  return a.localeCompare(b);
});

// APRÈS
const sortedTimes = sortTimeStrings(med.times || []);
```

**Cas d'usage** :

- ✅ Treatments.tsx - Affichage des horaires d'un médicament (ligne 151)
- ✅ MedicationCatalog.tsx - Horaires par défaut (ligne 79)

**Tests attendus** :

```typescript
// Test 1 : Tri horaires mélangés
["14:00", "08:00", "20:00", "12:00"]
// Résultat : ["08:00", "12:00", "14:00", "20:00"]

// Test 2 : Tableau vide
[]
// Résultat : []

// Test 3 : Un seul élément
["10:00"]
// Résultat : ["10:00"]
```

---

## 📄 CODE COMPLET DU FICHIER

```typescript
/**
 * sortingUtils.ts
 *
 * Utilitaires de tri centralisés pour l'application MyHealthPlus
 * Élimine la duplication de code et garantit la cohérence des tris
 */

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Interface pour les objets ayant un horaire et un nom de médicament
 * Utilisé pour trier les prises de médicaments
 */
export interface IntakeWithTime {
  time: string; // Format "HH:MM"
  medication: string; // Nom du médicament
}

/**
 * Interface pour les médicaments avec horaires multiples
 * Utilisé pour trier les médicaments par leur horaire le plus tôt
 */
export interface MedicationWithTimes {
  name: string; // Nom du médicament
  times: string[]; // Tableau d'horaires ["08:00", "12:00"]
}

/**
 * Interface pour les traitements avec date de début
 * Utilisé pour trier chronologiquement les traitements
 */
export interface TreatmentWithDate {
  start_date: string; // Format ISO "YYYY-MM-DD" ou timestamp
}

// ============================================================================
// HELPERS PRIVÉS
// ============================================================================

/**
 * Convertit un horaire "HH:MM" en nombre de minutes depuis minuit
 * @param times - Tableau d'horaires au format "HH:MM"
 * @returns Nombre de minutes du premier horaire, ou Infinity si tableau vide
 * @private
 */
function getEarliestMinutes(times: string[]): number {
  if (!times || times.length === 0) return Infinity;

  const minutes = times.map((time) => {
    const [hours, mins] = time.split(":").map(Number);
    return hours * 60 + mins;
  });

  return Math.min(...minutes);
}

// ============================================================================
// FONCTIONS PUBLIQUES
// ============================================================================

/**
 * Trie un tableau de prises de médicaments par horaire puis nom
 *
 * Ordre de tri :
 * 1. Par horaire prévu (croissant)
 * 2. Par nom de médicament (alphabétique français)
 *
 * @param intakes - Tableau de prises à trier
 * @returns Nouveau tableau trié (non mutatif)
 *
 * @example
 * const sorted = sortIntakesByTimeAndName([
 *   { time: "14:00", medication: "Doliprane", ... },
 *   { time: "08:00", medication: "Ibuprofène", ... }
 * ]);
 * // Résultat : [Ibuprofène 08:00, Doliprane 14:00]
 */
export function sortIntakesByTimeAndName<T extends IntakeWithTime>(
  intakes: T[],
): T[] {
  return [...intakes].sort((a, b) => {
    // Tri primaire : par horaire
    const timeCompare = a.time.localeCompare(b.time);
    if (timeCompare !== 0) return timeCompare;

    // Tri secondaire : par nom de médicament (locale française)
    return a.medication.localeCompare(b.medication, "fr", {
      sensitivity: "base",
    });
  });
}

/**
 * Trie un tableau de médicaments par leur horaire de prise le plus tôt
 *
 * Ordre de tri :
 * 1. Par horaire le plus tôt dans la journée (croissant)
 * 2. Par nom de médicament (alphabétique français)
 *
 * Les médicaments sans horaires (times = []) sont placés en fin de liste.
 *
 * @param medications - Tableau de médicaments à trier
 * @returns Nouveau tableau trié (non mutatif)
 *
 * @example
 * const sorted = sortMedicationsByEarliestTime([
 *   { name: "Doliprane", times: ["12:00", "20:00"], ... },
 *   { name: "Ibuprofène", times: ["08:00", "14:00"], ... }
 * ]);
 * // Résultat : [Ibuprofène (08:00 le plus tôt), Doliprane (12:00 le plus tôt)]
 */
export function sortMedicationsByEarliestTime<T extends MedicationWithTimes>(
  medications: T[],
): T[] {
  return [...medications].sort((a, b) => {
    const timeA = getEarliestMinutes(a.times);
    const timeB = getEarliestMinutes(b.times);

    // Tri primaire : par horaire le plus tôt
    if (timeA !== timeB) return timeA - timeB;

    // Tri secondaire : par nom de médicament (locale française)
    return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
  });
}

/**
 * Trie un tableau de traitements par date de début
 *
 * @param treatments - Tableau de traitements à trier
 * @param ascending - true = plus ancien d'abord (défaut), false = plus récent d'abord
 * @returns Nouveau tableau trié (non mutatif)
 *
 * @example
 * // Tri croissant (plus ancien en premier)
 * const sorted = sortTreatmentsByStartDate(treatments);
 *
 * // Tri décroissant (plus récent en premier)
 * const sorted = sortTreatmentsByStartDate(treatments, false);
 */
export function sortTreatmentsByStartDate<T extends TreatmentWithDate>(
  treatments: T[],
  ascending: boolean = true,
): T[] {
  return [...treatments].sort((a, b) => {
    const dateA = new Date(a.start_date).getTime();
    const dateB = new Date(b.start_date).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Trie un tableau de strings d'horaires au format "HH:MM"
 *
 * @param times - Tableau d'horaires à trier
 * @returns Nouveau tableau trié (non mutatif)
 *
 * @example
 * const sorted = sortTimeStrings(["14:00", "08:00", "20:00"]);
 * // Résultat : ["08:00", "14:00", "20:00"]
 */
export function sortTimeStrings(times: string[]): string[] {
  return [...times].sort((a, b) => a.localeCompare(b));
}
```

---

## 🔄 FICHIERS À MODIFIER APRÈS CRÉATION

Une fois `sortingUtils.ts` créé, ces fichiers devront être refactorisés :

### 1. Index.tsx

```typescript
// Ajouter import
import {
  sortIntakesByTimeAndName,
  sortTreatmentsByStartDate,
} from "@/lib/sortingUtils";

// Ligne 142-147 : Remplacer par
treatmentsWithQsp = sortTreatmentsByStartDate(treatmentsWithQsp);

// Ligne 548-553 : Remplacer par
group.intakes = sortIntakesByTimeAndName(group.intakes);

// Ligne 674-679 : Remplacer par
group.intakes = sortIntakesByTimeAndName(group.intakes);
```

### 2. Calendar.tsx

```typescript
// Ajouter import
import { sortIntakesByTimeAndName } from "@/lib/sortingUtils";

// Ligne 278-283 : Remplacer par
details = sortIntakesByTimeAndName(details);
```

### 3. History.tsx

```typescript
// Ajouter import
import { sortIntakesByTimeAndName } from "@/lib/sortingUtils";

// Ligne 259-264 : Remplacer par
day.intakes = sortIntakesByTimeAndName(day.intakes);
```

### 4. Treatments.tsx

```typescript
// Ajouter import
import {
  sortTimeStrings,
  sortMedicationsByEarliestTime,
} from "@/lib/sortingUtils";

// Ligne 151 : Remplacer par
const sortedTimes = sortTimeStrings(med.times || []);

// Ligne 170-187 : Remplacer par
medsWithPathology = sortMedicationsByEarliestTime(medsWithPathology);
```

### 5. TreatmentEdit.tsx

```typescript
// Ajouter import
import { sortMedicationsByEarliestTime } from "@/lib/sortingUtils";

// Ligne 162-173 : Remplacer par
const sortedMedications = sortMedicationsByEarliestTime(medsWithPathology);
```

### 6. MedicationCatalog.tsx

```typescript
// Ajouter import
import { sortTimeStrings } from "@/lib/sortingUtils";

// Ligne 79 : Remplacer par
const sortedTimes = sortTimeStrings(times);
```

---

## ✅ CRITÈRES DE VALIDATION

### Avant création du fichier

- [ ] Signatures TypeScript validées
- [ ] Interfaces claires et documentées
- [ ] Comportement non-mutatif (copie du tableau)
- [ ] Gestion locale française ('fr')
- [ ] JSDoc complet pour chaque fonction

### Après création du fichier

- [ ] Fichier compile sans erreurs TypeScript
- [ ] Aucune dépendance externe (sauf types TS standards)
- [ ] Code compatible avec ES2020+
- [ ] Exports nommés (pas de default export)

### Après refactoring des pages

- [ ] Aucune régression visuelle
- [ ] Tri identique à l'ancien code
- [ ] Build réussit (`npm run build`)
- [ ] Lint passe (`npm run lint`)

---

## 📊 IMPACT ATTENDU

### Avant

- **8 instances** de code dupliqué
- **~150 lignes** de code redondant
- Maintenance difficile (8 endroits à modifier)

### Après

- **1 fichier centralisé** (~180 lignes avec docs)
- **4 fonctions réutilisables**
- Modification : 1 seul endroit
- Tests unitaires possibles

### Bénéfices

- ✅ Cohérence garantie dans toute l'app
- ✅ Maintenance simplifiée
- ✅ Moins de bugs potentiels
- ✅ Code plus lisible et maintenable
- ✅ Facilite les tests unitaires

---

**Prêt pour validation** : ⏳ EN ATTENTE  
**Prêt pour création** : ❌ NON (en attente validation utilisateur)
