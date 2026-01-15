# SPÉCIFICATION - dateUtils.ts (Compléter existant)

**Ordre d'exécution** : 4/5  
**Fichier à modifier** : `src/lib/dateUtils.ts` _(EXISTE DÉJÀ)_  
**Date** : 27 octobre 2025  
**Status** : ⏳ EN ATTENTE DE VALIDATION

---

## 🎯 OBJECTIF

Compléter le fichier `dateUtils.ts` existant avec **3 nouvelles fonctions** pour éliminer les manipulations de dates dupliquées dans l'application.

---

## 📊 ÉTAT ACTUEL DU FICHIER

### Fonctions existantes ✅

Le fichier `src/lib/dateUtils.ts` contient déjà :

1. **`formatToFrenchTime(utcDateString: string): string`**
   - Convertit un timestamp UTC en horaire français "HH:MM"
   - Gère le changement d'heure hiver/été (Europe/Paris)
   - Utilisé dans : History.tsx, Rattrapage.tsx

2. **`convertFrenchToUTC(frenchDate: Date): Date`**
   - Convertit une date locale française en UTC
   - Utilisé dans : Rattrapage.tsx

⚠️ **CES FONCTIONS SONT DÉJÀ CORRECTES ET NE DOIVENT PAS ÊTRE MODIFIÉES**

---

## 📊 PROBLÈME IDENTIFIÉ

### Code dupliqué dans 5 fichiers

**Pattern 1 : Calcul de durée entre deux dates** (3 occurrences)

```typescript
const startDate = new Date(treatment.start_date);
const endDate = new Date(treatment.end_date);
const durationDays = Math.ceil(
  (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
);
```

- Treatments.tsx - ligne 106-108
- TreatmentEdit.tsx - ligne 104-106
- History.tsx - ligne 208-210

**Pattern 2 : Calcul de date de fin à partir d'une durée** (3 occurrences)

```typescript
const startDate = new Date(treatmentData.start_date);
const endDate = new Date(startDate);
endDate.setDate(startDate.getDate() + durationDays);
const calculatedEndDate = endDate.toISOString().split("T")[0];
```

- TreatmentEdit.tsx - ligne 111-114, 192-195, 223-226

**Pattern 3 : Formatage de dates françaises** (15+ occurrences)

```typescript
new Date(dateString).toLocaleDateString("fr-FR");
```

- Treatments.tsx - ligne 313, 318
- TreatmentEdit.tsx - ligne 352
- Stock.tsx - ligne 160
- StockDetails.tsx - ligne 154
- Prescriptions.tsx - ligne 309, 317, 381, 386, 390, 396
- _(et potentiellement d'autres)_

### Impact

- **Logique métier dupliquée** : Calculs de dates répétés
- **Risque d'erreurs** : Oubli de `Math.ceil`, mauvais diviseur, etc.
- **Code illisible** : `(1000 * 60 * 60 * 24)` répété partout
- **Maintenance difficile** : Changement de format = toucher 15+ endroits

---

## 🔧 SOLUTION PROPOSÉE

Ajouter **3 nouvelles fonctions** au fichier `dateUtils.ts` existant.

---

## 📝 SPÉCIFICATIONS DES NOUVELLES FONCTIONS

### Fonction 1 : `calculateDaysBetween()`

**Description** :  
Calcule le nombre de jours entre deux dates (arrondis au supérieur).

**Signature TypeScript** :

```typescript
export function calculateDaysBetween(
  startDate: string,
  endDate: string,
): number;
```

**Comportement** :

- Accepte des dates au format ISO string ("YYYY-MM-DD" ou timestamp complet)
- Convertit en objets Date
- Calcule la différence en millisecondes
- Convertit en jours avec `Math.ceil()` (arrondi supérieur)
- Gestion des dates invalides → retourner 0 avec warning console

**Constante interne** :

```typescript
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
```

**Exemple d'utilisation** :

```typescript
// AVANT (Treatments.tsx ligne 106-108)
const startDate = new Date(treatment.start_date);
const endDate = new Date(treatment.end_date);
const qspDays = Math.ceil(
  (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
);

// APRÈS
import { calculateDaysBetween } from "@/lib/dateUtils";

const qspDays = calculateDaysBetween(treatment.start_date, treatment.end_date);
```

**Cas d'usage** :

- ✅ Treatments.tsx - Calcul QSP (ligne 106-108)
- ✅ TreatmentEdit.tsx - Calcul durée traitement (ligne 104-106)
- ✅ History.tsx - Calcul QSP historique (ligne 208-210)

**Tests attendus** :

```typescript
// Test 1 : Dates simples
calculateDaysBetween("2025-10-20", "2025-10-27");
// Résultat : 7

// Test 2 : Même jour
calculateDaysBetween("2025-10-20", "2025-10-20");
// Résultat : 0

// Test 3 : Avec timestamps
calculateDaysBetween("2025-10-20T08:00:00Z", "2025-10-20T20:00:00Z");
// Résultat : 1 (arrondi supérieur)

// Test 4 : Date inversée (endDate < startDate)
calculateDaysBetween("2025-10-27", "2025-10-20");
// Résultat : -7 (négatif OK pour indiquer inversion)

// Test 5 : Date invalide
calculateDaysBetween("invalid", "2025-10-20");
// Résultat : 0 (avec warning console)
```

---

### Fonction 2 : `calculateEndDate()`

**Description** :  
Calcule la date de fin d'un traitement à partir d'une date de début et d'une durée en jours.

**Signature TypeScript** :

```typescript
export function calculateEndDate(
  startDate: string,
  durationDays: number,
): string;
```

**Comportement** :

- Accepte une date de début au format ISO string
- Ajoute `durationDays` jours à cette date
- Retourne la date de fin au format "YYYY-MM-DD"
- Gestion des dates invalides → retourner "" avec warning console
- Gestion durée négative → warning console mais calculer quand même

**Exemple d'utilisation** :

```typescript
// AVANT (TreatmentEdit.tsx ligne 111-114)
const startDate = new Date(treatmentData.start_date);
const endDate = new Date(startDate);
endDate.setDate(startDate.getDate() + durationDays);
const calculatedEndDate = endDate.toISOString().split("T")[0];

// APRÈS
import { calculateEndDate } from "@/lib/dateUtils";

const calculatedEndDate = calculateEndDate(
  treatmentData.start_date,
  durationDays,
);
```

**Cas d'usage** :

- ✅ TreatmentEdit.tsx - Calcul automatique date fin (ligne 111-114)
- ✅ TreatmentEdit.tsx - Recalcul lors changement start_date (ligne 192-195)
- ✅ TreatmentEdit.tsx - Recalcul lors changement durée (ligne 223-226)

**Tests attendus** :

```typescript
// Test 1 : Ajout jours simples
calculateEndDate("2025-10-20", 7);
// Résultat : "2025-10-27"

// Test 2 : Durée zéro
calculateEndDate("2025-10-20", 0);
// Résultat : "2025-10-20"

// Test 3 : Ajout jours avec changement de mois
calculateEndDate("2025-10-28", 5);
// Résultat : "2025-11-02"

// Test 4 : Ajout jours avec changement d'année
calculateEndDate("2025-12-30", 5);
// Résultat : "2026-01-04"

// Test 5 : Durée négative (warning mais calcule)
calculateEndDate("2025-10-20", -5);
// Résultat : "2025-10-15" (avec warning console)

// Test 6 : Date invalide
calculateEndDate("invalid", 7);
// Résultat : "" (avec warning console)
```

---

### Fonction 3 : `formatToFrenchDate()`

**Description** :  
Formate une date au format français "jj/mm/aaaa".

**Signature TypeScript** :

```typescript
export function formatToFrenchDate(dateString: string): string;
```

**Comportement** :

- Accepte une date au format ISO string
- Convertit en objet Date
- Formate avec `toLocaleDateString('fr-FR')`
- Retourne au format "31/12/2025"
- Gestion des dates invalides → retourner "-" avec warning console

**Exemple d'utilisation** :

```typescript
// AVANT (Treatments.tsx ligne 313)
Début: {
  new Date(treatment.start_date).toLocaleDateString("fr-FR");
}

// APRÈS
import { formatToFrenchDate } from "@/lib/dateUtils";

Début: {
  formatToFrenchDate(treatment.start_date);
}
```

**Cas d'usage** :

- ✅ Treatments.tsx - Affichage dates traitement (ligne 313, 318)
- ✅ TreatmentEdit.tsx - Affichage date calculée (ligne 352)
- ✅ Stock.tsx - Date d'expiration (ligne 160)
- ✅ StockDetails.tsx - Date d'expiration (ligne 154)
- ✅ Prescriptions.tsx - Dates ordonnances et visites (ligne 309, 317, 381, 386, 390, 396)

**Tests attendus** :

```typescript
// Test 1 : Format ISO simple
formatToFrenchDate("2025-10-27");
// Résultat : "27/10/2025"

// Test 2 : Format ISO avec timestamp
formatToFrenchDate("2025-10-27T14:30:00Z");
// Résultat : "27/10/2025"

// Test 3 : Premier jour du mois
formatToFrenchDate("2025-01-01");
// Résultat : "01/01/2025"

// Test 4 : Dernier jour du mois
formatToFrenchDate("2025-12-31");
// Résultat : "31/12/2025"

// Test 5 : Date invalide
formatToFrenchDate("invalid");
// Résultat : "-" (avec warning console)
```

---

## 📄 CODE À AJOUTER AU FICHIER EXISTANT

**⚠️ NE PAS MODIFIER LES FONCTIONS EXISTANTES**

Ajouter ce code **à la fin** du fichier `src/lib/dateUtils.ts` :

```typescript
// ============================================================================
// CALCULS DE DATES
// ============================================================================

/**
 * Nombre de millisecondes dans une journée
 * Constante pour éviter le "magic number" répété
 */
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Calcule le nombre de jours entre deux dates
 *
 * Arrondit au supérieur (Math.ceil) pour inclure les jours partiels.
 * Retourne un nombre négatif si endDate < startDate.
 *
 * @param startDate - Date de début (format ISO string)
 * @param endDate - Date de fin (format ISO string)
 * @returns Nombre de jours entre les deux dates (arrondi supérieur)
 *
 * @example
 * calculateDaysBetween("2025-10-20", "2025-10-27");
 * // Résultat : 7
 *
 * calculateDaysBetween("2025-10-20T08:00", "2025-10-20T20:00");
 * // Résultat : 1 (jour partiel arrondi)
 */
export function calculateDaysBetween(
  startDate: string,
  endDate: string,
): number {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Vérifier que les dates sont valides
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn("[calculateDaysBetween] Date invalide:", {
        startDate,
        endDate,
      });
      return 0;
    }

    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / MILLISECONDS_PER_DAY;

    return Math.ceil(diffDays);
  } catch (error) {
    console.error("[calculateDaysBetween] Erreur de calcul:", error);
    return 0;
  }
}

/**
 * Calcule la date de fin à partir d'une date de début et d'une durée
 *
 * Ajoute le nombre de jours spécifié à la date de début.
 * Retourne la date au format ISO "YYYY-MM-DD".
 *
 * @param startDate - Date de début (format ISO string)
 * @param durationDays - Nombre de jours à ajouter
 * @returns Date de fin au format "YYYY-MM-DD"
 *
 * @example
 * calculateEndDate("2025-10-20", 7);
 * // Résultat : "2025-10-27"
 *
 * calculateEndDate("2025-10-28", 5);
 * // Résultat : "2025-11-02" (changement de mois automatique)
 */
export function calculateEndDate(
  startDate: string,
  durationDays: number,
): string {
  try {
    const start = new Date(startDate);

    // Vérifier que la date est valide
    if (isNaN(start.getTime())) {
      console.warn("[calculateEndDate] Date de début invalide:", startDate);
      return "";
    }

    // Vérifier que la durée est positive
    if (durationDays < 0) {
      console.warn("[calculateEndDate] Durée négative détectée:", durationDays);
    }

    // Créer une nouvelle date et ajouter les jours
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays);

    // Retourner au format YYYY-MM-DD
    return end.toISOString().split("T")[0];
  } catch (error) {
    console.error("[calculateEndDate] Erreur de calcul:", error);
    return "";
  }
}

// ============================================================================
// FORMATAGE DE DATES
// ============================================================================

/**
 * Formate une date au format français "jj/mm/aaaa"
 *
 * Utilise toLocaleDateString avec la locale 'fr-FR'.
 *
 * @param dateString - Date au format ISO string
 * @returns Date formatée "31/12/2025" ou "-" si invalide
 *
 * @example
 * formatToFrenchDate("2025-10-27");
 * // Résultat : "27/10/2025"
 *
 * formatToFrenchDate("2025-10-27T14:30:00Z");
 * // Résultat : "27/10/2025"
 */
export function formatToFrenchDate(dateString: string): string {
  try {
    const date = new Date(dateString);

    // Vérifier que la date est valide
    if (isNaN(date.getTime())) {
      console.warn("[formatToFrenchDate] Date invalide:", dateString);
      return "-";
    }

    return date.toLocaleDateString("fr-FR");
  } catch (error) {
    console.error("[formatToFrenchDate] Erreur de formatage:", error);
    return "-";
  }
}
```

---

## 🔄 FICHIERS À MODIFIER APRÈS AJOUT

### 1. Treatments.tsx

**Import à modifier** :

```typescript
// AVANT (si import existant)
// Aucun import dateUtils

// APRÈS
import { calculateDaysBetween, formatToFrenchDate } from "@/lib/dateUtils";
```

**Ligne 106-108 : Calcul QSP**

```typescript
// AVANT
const startDate = new Date(treatment.start_date);
const endDate = new Date(treatment.end_date);
qspDays = Math.ceil(
  (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
);

// APRÈS
qspDays = calculateDaysBetween(treatment.start_date, treatment.end_date);
```

**Ligne 313, 318 : Formatage dates**

```typescript
// AVANT
Début : {new Date(treatment.start_date).toLocaleDateString("fr-FR")}
• Fin : {new Date(treatment.end_date).toLocaleDateString("fr-FR")}

// APRÈS
Début : {formatToFrenchDate(treatment.start_date)}
• Fin : {formatToFrenchDate(treatment.end_date)}
```

---

### 2. TreatmentEdit.tsx

**Import à ajouter** :

```typescript
import {
  calculateDaysBetween,
  calculateEndDate,
  formatToFrenchDate,
} from "@/lib/dateUtils";
```

**Ligne 104-106 : Calcul durée initiale**

```typescript
// AVANT
const startDate = new Date(treatmentData.start_date);
const endDate = new Date(treatmentData.end_date);
durationDays = Math.ceil(
  (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
);

// APRÈS
durationDays = calculateDaysBetween(
  treatmentData.start_date,
  treatmentData.end_date,
);
```

**Ligne 111-114 : Calcul date de fin**

```typescript
// AVANT
const startDate = new Date(treatmentData.start_date);
const endDate = new Date(startDate);
endDate.setDate(startDate.getDate() + durationDays);
calculatedEndDate = endDate.toISOString().split("T")[0];

// APRÈS
calculatedEndDate = calculateEndDate(treatmentData.start_date, durationDays);
```

**Ligne 192-195 : Recalcul lors changement start_date**

```typescript
// AVANT
const startDate = new Date(newStartDate);
const endDate = new Date(startDate);
endDate.setDate(startDate.getDate() + formData.durationDays);
updated.endDate = endDate.toISOString().split("T")[0];

// APRÈS
updated.endDate = calculateEndDate(newStartDate, formData.durationDays);
```

**Ligne 223-226 : Recalcul lors changement durée**

```typescript
// AVANT
const start = new Date(formData.startDate);
const end = new Date(start);
end.setDate(start.getDate() + newDuration);
calculatedEndDate = end.toISOString().split("T")[0];

// APRÈS
calculatedEndDate = calculateEndDate(formData.startDate, newDuration);
```

**Ligne 352 : Formatage date**

```typescript
// AVANT
{
  formData.endDate
    ? new Date(formData.endDate).toLocaleDateString("fr-FR")
    : "Non définie";
}

// APRÈS
{
  formData.endDate ? formatToFrenchDate(formData.endDate) : "Non définie";
}
```

---

### 3. History.tsx

**Import à modifier** :

```typescript
// AVANT
import { formatToFrenchTime } from "../lib/dateUtils";

// APRÈS
import { formatToFrenchTime, calculateDaysBetween } from "../lib/dateUtils";
```

**Ligne 208-210 : Calcul QSP**

```typescript
// AVANT
const startDate = new Date(treatment.start_date);
const endDate = new Date(treatment.end_date);
qspDays = Math.ceil(
  (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
);

// APRÈS
qspDays = calculateDaysBetween(treatment.start_date, treatment.end_date);
```

---

### 4. Stock.tsx

**Import à ajouter** :

```typescript
import { formatToFrenchDate } from "@/lib/dateUtils";
```

**Ligne 160 : Formatage date d'expiration**

```typescript
// AVANT
<p className="font-medium">{new Date(item.expiry_date).toLocaleDateString('fr-FR')}</p>

// APRÈS
<p className="font-medium">{formatToFrenchDate(item.expiry_date)}</p>
```

---

### 5. StockDetails.tsx

**Import à ajouter** :

```typescript
import { formatToFrenchDate } from "@/lib/dateUtils";
```

**Ligne 154 : Formatage date d'expiration**

```typescript
// AVANT
{
  new Date(medication.expiry_date).toLocaleDateString("fr-FR");
}

// APRÈS
{
  formatToFrenchDate(medication.expiry_date);
}
```

---

### 6. Prescriptions.tsx

**Import à ajouter** :

```typescript
import { formatToFrenchDate } from "@/lib/dateUtils";
```

**Lignes 309, 317, 381, 386, 390, 396 : Formatage dates**

```typescript
// AVANT (exemple ligne 309)
{
  new Date(prescription.prescription_date).toLocaleDateString("fr-FR");
}

// APRÈS
{
  formatToFrenchDate(prescription.prescription_date);
}
```

---

## ✅ CRITÈRES DE VALIDATION

### Avant modification du fichier

- [ ] Fonctions existantes **NON MODIFIÉES**
- [ ] Nouvelles signatures TypeScript validées
- [ ] Gestion robuste des erreurs (try/catch)
- [ ] Warning console pour données invalides
- [ ] JSDoc complet pour chaque nouvelle fonction

### Après modification du fichier

- [ ] Fichier compile sans erreurs TypeScript
- [ ] Import date-fns non cassé
- [ ] Fonctions existantes toujours opérationnelles
- [ ] Aucune régression sur formatToFrenchTime/convertFrenchToUTC

### Après refactoring des pages

- [ ] Calculs de dates identiques à l'ancien code
- [ ] Formatages identiques (vérifier avec screenshots si besoin)
- [ ] Aucune régression visuelle
- [ ] Build réussit (`npm run build`)
- [ ] Lint passe (`npm run lint`)

---

## 📊 IMPACT ATTENDU

### Avant

- **~25 instances** de manipulation de dates dupliquées
- Code illisible : `(1000 * 60 * 60 * 24)` répété
- `toLocaleDateString('fr-FR')` répété 15+ fois

### Après

- **3 nouvelles fonctions centralisées**
- Constante `MILLISECONDS_PER_DAY` pour lisibilité
- Code maintenable et testable

### Bénéfices

- ✅ Calculs de dates cohérents
- ✅ Moins d'erreurs de calcul
- ✅ Code plus lisible
- ✅ Facilite les tests unitaires
- ✅ Format français garanti partout

---

**Prêt pour validation** : ⏳ EN ATTENTE  
**Prêt pour modification** : ❌ NON (en attente validation utilisateur)
