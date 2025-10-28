# SPÉCIFICATION - groupingUtils.ts

**Ordre d'exécution** : 2/5  
**Fichier à créer** : `src/lib/groupingUtils.ts`  
**Date** : 27 octobre 2025  
**Status** : ⏳ EN ATTENTE DE VALIDATION

---

## 🎯 OBJECTIF

Centraliser les fonctions de regroupement (grouping) de données pour éliminer la duplication de logique métier complexe et garantir une structure de données cohérente.

---

## 📊 PROBLÈME IDENTIFIÉ

### Code dupliqué dans 2 fichiers

Le pattern de regroupement par traitement est répété **3 fois** dans l'application :

1. **Index.tsx** - ligne 533-546 (section Aujourd'hui)
2. **Index.tsx** - ligne 659-672 (section Demain)
3. **History.tsx** - ligne 421-435 (regroupement par traitement pour chaque jour)

Le pattern de regroupement par jour est utilisé **1 fois** mais est critique :

4. **History.tsx** - ligne 221-255 (regroupement de toutes les prises par jour)

### Impact
- **Logique métier dupliquée** : Règles de regroupement répétées
- **Structure de données incohérente** : Risque de divergence entre pages
- **Bugs difficiles à détecter** : Un grouping cassé affecte l'affichage
- **Maintenance complexe** : Modification du format = toucher 3-4 endroits

---

## 🔧 SOLUTION PROPOSÉE

Créer **2 fonctions de grouping** génériques avec gestion robuste des cas limites.

---

## 📝 SPÉCIFICATIONS DES FONCTIONS

### Fonction 1 : `groupIntakesByTreatment()`

**Description** :  
Regroupe un tableau de prises de médicaments par ID de traitement, en préservant les informations du traitement.

**Signature TypeScript** :
```typescript
export function groupIntakesByTreatment<T extends IntakeWithTreatment>(
  intakes: T[]
): Record<string, IntakeGroup<T>>;
```

**Interfaces requises** :
```typescript
/**
 * Interface minimale requise pour les prises à regrouper
 */
export interface IntakeWithTreatment {
  treatment_id: string;     // ID unique du traitement
  treatment: string;        // Nom du traitement
  // ... autres propriétés préservées dans le groupe
}

/**
 * Structure du groupe résultant
 */
export interface IntakeGroup<T> {
  treatment: string;        // Nom du traitement
  treatmentId: string;      // ID du traitement
  intakes: T[];            // Tableau des prises de ce traitement
}
```

**Comportement** :
- Parcourir le tableau de prises
- Créer un objet avec `treatment_id` comme clé
- Initialiser un groupe si pas encore existant
- Ajouter chaque prise au groupe correspondant
- Retourner un objet `Record<string, IntakeGroup<T>>`

**Gestion des cas limites** :
- Tableau vide → objet vide `{}`
- `treatment_id` null/undefined → ignorer l'intake (avec warning console)
- Prises avec même `treatment_id` mais `treatment` différent → prendre le premier rencontré

**Exemple d'utilisation** :
```typescript
// AVANT (Index.tsx ligne 533-546)
const groupedByTreatment = todayIntakes.reduce((acc, intake) => {
  const treatmentId = intake.treatment_id;
  if (!acc[treatmentId]) {
    acc[treatmentId] = {
      treatment: intake.treatment,
      treatmentId: treatmentId,
      intakes: []
    };
  }
  acc[treatmentId].intakes.push(intake);
  return acc;
}, {} as Record<string, IntakeGroup>);

// APRÈS
const groupedByTreatment = groupIntakesByTreatment(todayIntakes);
```

**Cas d'usage** :
- ✅ Index.tsx - Section "Aujourd'hui" (ligne 533-546)
- ✅ Index.tsx - Section "Demain" (ligne 659-672)
- ✅ History.tsx - Regroupement par traitement dans chaque jour (ligne 421-435)

**Tests attendus** :
```typescript
// Test 1 : Regroupement basique
const intakes = [
  { treatment_id: "t1", treatment: "Traitement A", medication: "Med1", time: "08:00" },
  { treatment_id: "t1", treatment: "Traitement A", medication: "Med2", time: "12:00" },
  { treatment_id: "t2", treatment: "Traitement B", medication: "Med3", time: "08:00" }
];
const result = groupIntakesByTreatment(intakes);
/*
{
  "t1": {
    treatment: "Traitement A",
    treatmentId: "t1",
    intakes: [
      { treatment_id: "t1", medication: "Med1", time: "08:00" },
      { treatment_id: "t1", medication: "Med2", time: "12:00" }
    ]
  },
  "t2": {
    treatment: "Traitement B",
    treatmentId: "t2",
    intakes: [
      { treatment_id: "t2", medication: "Med3", time: "08:00" }
    ]
  }
}
*/

// Test 2 : Tableau vide
groupIntakesByTreatment([]);
// Résultat : {}

// Test 3 : Treatment ID manquant (edge case)
const invalidIntakes = [
  { treatment_id: null, treatment: "Test", medication: "Med1" }
];
// Résultat : {} (intake ignoré avec warning console)
```

---

### Fonction 2 : `groupIntakesByDay()`

**Description** :  
Regroupe un tableau de prises de médicaments par jour (date sans heure), en créant une structure organisée par date.

**Signature TypeScript** :
```typescript
export function groupIntakesByDay<T extends IntakeWithScheduledTime>(
  intakes: T[]
): DayGroup<T>[];
```

**Interfaces requises** :
```typescript
/**
 * Interface minimale requise pour les prises à regrouper par jour
 */
export interface IntakeWithScheduledTime {
  scheduled_time: string;  // ISO timestamp ou date string
  // ... autres propriétés préservées
}

/**
 * Structure du groupe par jour
 */
export interface DayGroup<T> {
  date: Date;              // Date du jour (sans heure, à 00:00)
  dateKey: string;         // Clé ISO pour comparaison (toISOString)
  intakes: T[];           // Tableau des prises de ce jour
}
```

**Comportement** :
- Utiliser `date-fns` pour la manipulation de dates (`startOfDay`, `parseISO`)
- Extraire la date (sans heure) de `scheduled_time`
- Créer une clé unique par jour (ISO string)
- Regrouper toutes les prises du même jour
- Retourner un **tableau** de groupes triés par date (croissant)

**Gestion des cas limites** :
- Tableau vide → tableau vide `[]`
- `scheduled_time` invalide → ignorer l'intake (avec warning console)
- Dates à cheval sur minuit → gestion correcte avec `startOfDay`
- Timezone → utiliser la date locale (Europe/Paris déjà dans scheduled_time)

**Dépendances** :
```typescript
import { parseISO, startOfDay } from 'date-fns';
```

**Exemple d'utilisation** :
```typescript
// AVANT (History.tsx ligne 221-255)
const grouped = (intakesData || []).reduce((acc: Record<string, GroupedIntakes>, intake: any) => {
  const date = startOfDay(parseISO(intake.scheduled_time));
  const dateKey = date.toISOString();
  
  if (!acc[dateKey]) {
    acc[dateKey] = {
      date: date,
      intakes: []
    };
  }
  
  acc[dateKey].intakes.push({
    id: intake.id,
    medication: intake.medications.name,
    time: formatToFrenchTime(intake.scheduled_time),
    // ... mapping complet
  });
  
  return acc;
}, {});

const groupedArray = Object.values(grouped);

// APRÈS
const groupedArray = groupIntakesByDay(intakesData);
```

**⚠️ Note importante** :  
Cette fonction NE FAIT PAS le mapping des propriétés (ex: `formatToFrenchTime`). Elle groupe uniquement par jour. Le mapping doit être fait **avant** ou **après** selon le besoin.

**Cas d'usage** :
- ✅ History.tsx - Regroupement de l'historique par jour (ligne 221-255)

**Tests attendus** :
```typescript
// Test 1 : Regroupement par jour
const intakes = [
  { scheduled_time: "2025-10-27T08:00:00Z", medication: "Med1" },
  { scheduled_time: "2025-10-27T14:00:00Z", medication: "Med2" },
  { scheduled_time: "2025-10-28T08:00:00Z", medication: "Med3" }
];
const result = groupIntakesByDay(intakes);
/*
[
  {
    date: Date("2025-10-27T00:00:00"),
    dateKey: "2025-10-27T00:00:00.000Z",
    intakes: [
      { scheduled_time: "2025-10-27T08:00:00Z", medication: "Med1" },
      { scheduled_time: "2025-10-27T14:00:00Z", medication: "Med2" }
    ]
  },
  {
    date: Date("2025-10-28T00:00:00"),
    dateKey: "2025-10-28T00:00:00.000Z",
    intakes: [
      { scheduled_time: "2025-10-28T08:00:00Z", medication: "Med3" }
    ]
  }
]
*/

// Test 2 : Tableau vide
groupIntakesByDay([]);
// Résultat : []

// Test 3 : Date invalide (edge case)
const invalidIntakes = [
  { scheduled_time: "invalid-date", medication: "Med1" }
];
// Résultat : [] (intake ignoré avec warning console)
```

---

## 📄 CODE COMPLET DU FICHIER

```typescript
/**
 * groupingUtils.ts
 * 
 * Utilitaires de regroupement (grouping) pour l'application MyHealthPlus
 * Centralise la logique métier de regroupement de données
 */

import { parseISO, startOfDay } from 'date-fns';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Interface pour les prises de médicaments avec ID de traitement
 * Utilisé pour le regroupement par traitement
 */
export interface IntakeWithTreatment {
  treatment_id: string;     // ID unique du traitement
  treatment: string;        // Nom du traitement
  // Autres propriétés de l'intake sont préservées via generic T
}

/**
 * Structure du groupe de prises par traitement
 */
export interface IntakeGroup<T> {
  treatment: string;        // Nom du traitement
  treatmentId: string;      // ID du traitement
  intakes: T[];            // Tableau des prises de ce traitement
}

/**
 * Interface pour les prises avec horaire prévu
 * Utilisé pour le regroupement par jour
 */
export interface IntakeWithScheduledTime {
  scheduled_time: string;  // ISO timestamp ou date string
  // Autres propriétés de l'intake sont préservées via generic T
}

/**
 * Structure du groupe de prises par jour
 */
export interface DayGroup<T> {
  date: Date;              // Date du jour (sans heure, à 00:00)
  dateKey: string;         // Clé ISO pour comparaison/identification unique
  intakes: T[];           // Tableau des prises de ce jour
}

// ============================================================================
// FONCTIONS PUBLIQUES
// ============================================================================

/**
 * Regroupe un tableau de prises de médicaments par traitement
 * 
 * Chaque prise est ajoutée au groupe correspondant à son treatment_id.
 * Crée automatiquement un nouveau groupe si le traitement n'existe pas encore.
 * 
 * @param intakes - Tableau de prises à regrouper
 * @returns Objet avec treatment_id comme clé et IntakeGroup comme valeur
 * 
 * @example
 * const grouped = groupIntakesByTreatment([
 *   { treatment_id: "t1", treatment: "Traitement A", medication: "Med1" },
 *   { treatment_id: "t1", treatment: "Traitement A", medication: "Med2" },
 *   { treatment_id: "t2", treatment: "Traitement B", medication: "Med3" }
 * ]);
 * // Résultat : {
 * //   "t1": { treatment: "Traitement A", treatmentId: "t1", intakes: [Med1, Med2] },
 * //   "t2": { treatment: "Traitement B", treatmentId: "t2", intakes: [Med3] }
 * // }
 */
export function groupIntakesByTreatment<T extends IntakeWithTreatment>(
  intakes: T[]
): Record<string, IntakeGroup<T>> {
  const grouped: Record<string, IntakeGroup<T>> = {};
  
  for (const intake of intakes) {
    const treatmentId = intake.treatment_id;
    
    // Validation : ignorer les intakes sans treatment_id
    if (!treatmentId) {
      console.warn('[groupIntakesByTreatment] Intake sans treatment_id ignoré:', intake);
      continue;
    }
    
    // Créer le groupe si n'existe pas
    if (!grouped[treatmentId]) {
      grouped[treatmentId] = {
        treatment: intake.treatment,
        treatmentId: treatmentId,
        intakes: []
      };
    }
    
    // Ajouter l'intake au groupe
    grouped[treatmentId].intakes.push(intake);
  }
  
  return grouped;
}

/**
 * Regroupe un tableau de prises de médicaments par jour
 * 
 * Extrait la date (sans heure) de scheduled_time et groupe toutes les prises
 * du même jour ensemble. Retourne un tableau trié par date croissante.
 * 
 * ⚠️ Cette fonction ne modifie pas les propriétés des intakes (pas de mapping).
 * Le formatage (ex: formatToFrenchTime) doit être fait séparément.
 * 
 * @param intakes - Tableau de prises à regrouper
 * @returns Tableau de groupes par jour, trié chronologiquement
 * 
 * @example
 * const grouped = groupIntakesByDay([
 *   { scheduled_time: "2025-10-27T08:00:00Z", medication: "Med1" },
 *   { scheduled_time: "2025-10-27T14:00:00Z", medication: "Med2" },
 *   { scheduled_time: "2025-10-28T08:00:00Z", medication: "Med3" }
 * ]);
 * // Résultat : [
 * //   { date: Date(2025-10-27), dateKey: "...", intakes: [Med1, Med2] },
 * //   { date: Date(2025-10-28), dateKey: "...", intakes: [Med3] }
 * // ]
 */
export function groupIntakesByDay<T extends IntakeWithScheduledTime>(
  intakes: T[]
): DayGroup<T>[] {
  const grouped: Record<string, DayGroup<T>> = {};
  
  for (const intake of intakes) {
    try {
      // Extraire la date sans heure
      const date = startOfDay(parseISO(intake.scheduled_time));
      const dateKey = date.toISOString();
      
      // Créer le groupe si n'existe pas
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: date,
          dateKey: dateKey,
          intakes: []
        };
      }
      
      // Ajouter l'intake au groupe
      grouped[dateKey].intakes.push(intake);
      
    } catch (error) {
      console.warn('[groupIntakesByDay] Erreur parsing scheduled_time:', intake.scheduled_time, error);
      continue;
    }
  }
  
  // Convertir en tableau et trier par date
  return Object.values(grouped).sort((a, b) => 
    a.date.getTime() - b.date.getTime()
  );
}
```

---

## 🔄 FICHIERS À MODIFIER APRÈS CRÉATION

Une fois `groupingUtils.ts` créé, ces fichiers devront être refactorisés :

### 1. Index.tsx

**Import à ajouter** :
```typescript
import { groupIntakesByTreatment } from '@/lib/groupingUtils';
```

**Ligne 533-546 : Section Aujourd'hui**
```typescript
// AVANT
const groupedByTreatment = todayIntakes.reduce((acc, intake) => {
  const treatmentId = intake.treatment_id;
  if (!acc[treatmentId]) {
    acc[treatmentId] = {
      treatment: intake.treatment,
      treatmentId: treatmentId,
      intakes: []
    };
  }
  acc[treatmentId].intakes.push(intake);
  return acc;
}, {} as Record<string, IntakeGroup>);

// APRÈS
const groupedByTreatment = groupIntakesByTreatment(todayIntakes);
```

**Ligne 659-672 : Section Demain**
```typescript
// AVANT
const groupedByTreatment = tomorrowIntakes.reduce((acc, intake) => {
  const treatmentId = intake.treatment_id;
  if (!acc[treatmentId]) {
    acc[treatmentId] = {
      treatment: intake.treatment,
      treatmentId: treatmentId,
      intakes: []
    };
  }
  acc[treatmentId].intakes.push(intake);
  return acc;
}, {} as Record<string, IntakeGroup>);

// APRÈS
const groupedByTreatment = groupIntakesByTreatment(tomorrowIntakes);
```

---

### 2. History.tsx

**Imports à ajouter** :
```typescript
import { groupIntakesByTreatment, groupIntakesByDay } from '@/lib/groupingUtils';
```

**Ligne 221-255 : Regroupement par jour**
```typescript
// AVANT (version simplifiée)
const grouped = (intakesData || []).reduce((acc: Record<string, GroupedIntakes>, intake: any) => {
  const date = startOfDay(parseISO(intake.scheduled_time));
  const dateKey = date.toISOString();
  
  if (!acc[dateKey]) {
    acc[dateKey] = {
      date: date,
      intakes: []
    };
  }
  
  acc[dateKey].intakes.push({
    // mapping des propriétés...
  });
  
  return acc;
}, {});

setHistoryData(Object.values(grouped));

// APRÈS
// Étape 1 : Mapper les données avec formatToFrenchTime
const mappedIntakes = (intakesData || []).map(intake => ({
  id: intake.id,
  medication: intake.medications.name,
  time: formatToFrenchTime(intake.scheduled_time),
  scheduled_time: intake.scheduled_time,  // Garder pour grouping
  // ... autres propriétés
}));

// Étape 2 : Grouper par jour
const grouped = groupIntakesByDay(mappedIntakes);

setHistoryData(grouped);
```

**Ligne 421-435 : Regroupement par traitement dans chaque jour**
```typescript
// AVANT
const groupedByTreatment = day.intakes.reduce((acc, intake) => {
  const treatmentId = intake.treatment_id;
  if (!acc[treatmentId]) {
    acc[treatmentId] = {
      treatment: intake.treatment,
      treatmentId: treatmentId,
      intakes: []
    };
  }
  acc[treatmentId].intakes.push(intake);
  return acc;
}, {} as Record<string, IntakeGroup>);

// APRÈS
const groupedByTreatment = groupIntakesByTreatment(day.intakes);
```

---

## ✅ CRITÈRES DE VALIDATION

### Avant création du fichier
- [ ] Signatures TypeScript validées
- [ ] Interfaces claires et documentées
- [ ] Gestion des cas limites (null, undefined, tableau vide)
- [ ] Warning console pour données invalides
- [ ] JSDoc complet pour chaque fonction
- [ ] Dépendances minimales (date-fns uniquement)

### Après création du fichier
- [ ] Fichier compile sans erreurs TypeScript
- [ ] Import date-fns fonctionne
- [ ] Code compatible avec ES2020+
- [ ] Exports nommés (pas de default export)

### Après refactoring des pages
- [ ] Structure de données identique à l'ancien code
- [ ] Aucune régression visuelle
- [ ] Grouping fonctionne correctement
- [ ] Build réussit (`npm run build`)
- [ ] Lint passe (`npm run lint`)

---

## 📊 IMPACT ATTENDU

### Avant
- **4 instances** de code dupliqué
- **~80 lignes** de logique métier redondante
- Risque d'incohérence entre pages

### Après
- **1 fichier centralisé** (~150 lignes avec docs)
- **2 fonctions réutilisables**
- Logique métier garantie identique partout

### Bénéfices
- ✅ Structure de données cohérente
- ✅ Maintenance simplifiée
- ✅ Tests unitaires possibles
- ✅ Moins de bugs de regroupement
- ✅ Code plus lisible

---

**Prêt pour validation** : ⏳ EN ATTENTE  
**Prêt pour création** : ❌ NON (en attente validation utilisateur)
