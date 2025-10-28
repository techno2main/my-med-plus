# SPÉCIFICATION - filterUtils.ts

**Ordre d'exécution** : 3/5  
**Fichier à créer** : `src/lib/filterUtils.ts`  
**Date** : 27 octobre 2025  
**Status** : ⏳ EN ATTENTE DE VALIDATION

---

## 🎯 OBJECTIF

Centraliser les constantes et fonctions de filtrage liées au statut `is_active` des traitements pour garantir la cohérence des filtres à travers toute l'application.

---

## 📊 PROBLÈME IDENTIFIÉ

### Pattern récurrent non centralisé

Le filtre `is_active` est utilisé **104 fois** dans l'application avec plusieurs variations :

**Requêtes Supabase** (pattern répété 8+ fois) :
```typescript
.select(`
  ...,
  medications!inner(
    ...,
    treatments!inner(is_active)
  )
`)
.eq("medications.treatments.is_active", true)
```

**Comptage de traitements actifs** :
```typescript
treatments.filter(t => t.is_active).length
```

**Vérifications conditionnelles** :
```typescript
if (treatment.is_active) {
  // ...
}
```

### Impact
- **Pattern répété** : Même code copié-collé dans 8+ fichiers
- **Risque d'oubli** : Facile d'oublier le filtre dans une nouvelle query
- **Maintenance difficile** : Changement de logique = toucher partout
- **Incohérence** : Certaines pages utilisent `!inner`, d'autres non

---

## 🔧 SOLUTION PROPOSÉE

Créer des **constantes de configuration** et **fonctions helpers** pour standardiser tous les filtres `is_active`.

---

## 📝 SPÉCIFICATIONS DES HELPERS

### Constante 1 : `ACTIVE_TREATMENT_FILTER`

**Description** :  
Configuration réutilisable pour les requêtes Supabase avec filtre `is_active`.

**Type TypeScript** :
```typescript
export const ACTIVE_TREATMENT_FILTER = {
  /**
   * Fragment de select pour les medications avec treatments actifs
   * À utiliser dans les queries Supabase
   */
  MEDICATIONS_WITH_TREATMENTS: `
    medications!inner(
      id,
      name,
      treatment_id,
      treatments!inner(
        id,
        name,
        is_active,
        start_date,
        end_date
      )
    )
  `,
  
  /**
   * Condition .eq() pour filtrer les treatments actifs
   */
  EQ_CONDITION: "medications.treatments.is_active",
  
  /**
   * Valeur attendue (true = actif)
   */
  ACTIVE_VALUE: true
} as const;
```

**Utilisation** :
```typescript
import { ACTIVE_TREATMENT_FILTER } from '@/lib/filterUtils';

// AVANT
.select(`
  id,
  medication_id,
  scheduled_time,
  medications!inner(
    name,
    treatments!inner(is_active)
  )
`)
.eq("medications.treatments.is_active", true)

// APRÈS (plus lisible, centralisé)
.select(`
  id,
  medication_id,
  scheduled_time,
  ${ACTIVE_TREATMENT_FILTER.MEDICATIONS_WITH_TREATMENTS}
`)
.eq(ACTIVE_TREATMENT_FILTER.EQ_CONDITION, ACTIVE_TREATMENT_FILTER.ACTIVE_VALUE)
```

---

### Fonction 1 : `countActiveTreatments()`

**Description** :  
Compte le nombre de traitements actifs dans un tableau.

**Signature TypeScript** :
```typescript
export function countActiveTreatments<T extends TreatmentWithActiveStatus>(
  treatments: T[]
): number;
```

**Interface requise** :
```typescript
export interface TreatmentWithActiveStatus {
  is_active: boolean;
}
```

**Comportement** :
- Filtrer les traitements où `is_active === true`
- Retourner le nombre de résultats
- Gestion robuste : tableau null/undefined → 0

**Exemple d'utilisation** :
```typescript
// AVANT (Treatments.tsx ligne 238)
subtitle={`${treatments.filter(t => t.is_active).length} traitement(s) actif(s)`}

// APRÈS
import { countActiveTreatments } from '@/lib/filterUtils';

subtitle={`${countActiveTreatments(treatments)} traitement(s) actif(s)`}
```

**Tests attendus** :
```typescript
// Test 1 : Comptage basique
countActiveTreatments([
  { is_active: true, name: "T1" },
  { is_active: false, name: "T2" },
  { is_active: true, name: "T3" }
]);
// Résultat : 2

// Test 2 : Tous actifs
countActiveTreatments([
  { is_active: true },
  { is_active: true }
]);
// Résultat : 2

// Test 3 : Aucun actif
countActiveTreatments([
  { is_active: false },
  { is_active: false }
]);
// Résultat : 0

// Test 4 : Tableau vide
countActiveTreatments([]);
// Résultat : 0

// Test 5 : Null/undefined
countActiveTreatments(null);
// Résultat : 0
```

---

### Fonction 2 : `filterActiveTreatments()`

**Description** :  
Filtre un tableau pour ne garder que les traitements actifs.

**Signature TypeScript** :
```typescript
export function filterActiveTreatments<T extends TreatmentWithActiveStatus>(
  treatments: T[]
): T[];
```

**Comportement** :
- Retourner un nouveau tableau (non mutatif)
- Garder uniquement les éléments où `is_active === true`
- Gestion robuste : tableau null/undefined → []

**Exemple d'utilisation** :
```typescript
// Utilisation générique
import { filterActiveTreatments } from '@/lib/filterUtils';

const activeTreatments = filterActiveTreatments(allTreatments);
```

**Tests attendus** :
```typescript
// Test 1 : Filtrage basique
filterActiveTreatments([
  { is_active: true, name: "T1" },
  { is_active: false, name: "T2" },
  { is_active: true, name: "T3" }
]);
// Résultat : [{ is_active: true, name: "T1" }, { is_active: true, name: "T3" }]

// Test 2 : Aucun actif
filterActiveTreatments([
  { is_active: false }
]);
// Résultat : []

// Test 3 : Tous actifs
filterActiveTreatments([
  { is_active: true },
  { is_active: true }
]);
// Résultat : [{ is_active: true }, { is_active: true }]
```

---

### Fonction 3 : `isTreatmentActive()`

**Description** :  
Vérifie si un traitement est actif (helper de condition).

**Signature TypeScript** :
```typescript
export function isTreatmentActive<T extends TreatmentWithActiveStatus>(
  treatment: T | null | undefined
): boolean;
```

**Comportement** :
- Retourner `true` si `treatment.is_active === true`
- Retourner `false` sinon (y compris si treatment null/undefined)
- Type guard pour TypeScript

**Exemple d'utilisation** :
```typescript
// AVANT
if (treatment && treatment.is_active) {
  // ...
}

// APRÈS
import { isTreatmentActive } from '@/lib/filterUtils';

if (isTreatmentActive(treatment)) {
  // ...
}
```

**Tests attendus** :
```typescript
// Test 1 : Traitement actif
isTreatmentActive({ is_active: true });
// Résultat : true

// Test 2 : Traitement inactif
isTreatmentActive({ is_active: false });
// Résultat : false

// Test 3 : Null
isTreatmentActive(null);
// Résultat : false

// Test 4 : Undefined
isTreatmentActive(undefined);
// Résultat : false
```

---

### Fonction 4 : `getActiveTreatmentBadgeText()`

**Description** :  
Génère le texte du badge affichant le nombre de traitements actifs.

**Signature TypeScript** :
```typescript
export function getActiveTreatmentBadgeText(count: number): string;
```

**Comportement** :
- Singulier/pluriel automatique
- Format : "X traitement(s) actif(s)"

**Exemple d'utilisation** :
```typescript
// AVANT
subtitle={`${count} traitement(s) actif(s)`}

// APRÈS
import { getActiveTreatmentBadgeText } from '@/lib/filterUtils';

subtitle={getActiveTreatmentBadgeText(count)}
```

**Tests attendus** :
```typescript
// Test 1 : Singulier
getActiveTreatmentBadgeText(1);
// Résultat : "1 traitement actif"

// Test 2 : Pluriel
getActiveTreatmentBadgeText(3);
// Résultat : "3 traitements actifs"

// Test 3 : Zéro
getActiveTreatmentBadgeText(0);
// Résultat : "Aucun traitement actif"
```

---

## 📄 CODE COMPLET DU FICHIER

```typescript
/**
 * filterUtils.ts
 * 
 * Utilitaires de filtrage pour l'application MyHealthPlus
 * Centralise la logique de filtrage par statut is_active
 */

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Interface pour les objets ayant un statut actif/inactif
 */
export interface TreatmentWithActiveStatus {
  is_active: boolean;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Configuration pour les requêtes Supabase avec filtre is_active
 * 
 * Utilisation dans les queries :
 * ```typescript
 * .select(`
 *   id,
 *   ${ACTIVE_TREATMENT_FILTER.MEDICATIONS_WITH_TREATMENTS}
 * `)
 * .eq(ACTIVE_TREATMENT_FILTER.EQ_CONDITION, ACTIVE_TREATMENT_FILTER.ACTIVE_VALUE)
 * ```
 */
export const ACTIVE_TREATMENT_FILTER = {
  /**
   * Fragment de select pour les medications avec treatments actifs
   * Utilise INNER JOIN pour exclure automatiquement les traitements archivés
   */
  MEDICATIONS_WITH_TREATMENTS: `
    medications!inner(
      id,
      name,
      treatment_id,
      treatments!inner(
        id,
        name,
        is_active,
        start_date,
        end_date
      )
    )
  `.trim(),
  
  /**
   * Condition .eq() pour filtrer les treatments actifs
   * À utiliser après .select()
   */
  EQ_CONDITION: "medications.treatments.is_active" as const,
  
  /**
   * Valeur attendue pour les traitements actifs
   */
  ACTIVE_VALUE: true as const
} as const;

// ============================================================================
// FONCTIONS PUBLIQUES
// ============================================================================

/**
 * Compte le nombre de traitements actifs dans un tableau
 * 
 * @param treatments - Tableau de traitements (peut être null/undefined)
 * @returns Nombre de traitements où is_active === true
 * 
 * @example
 * const count = countActiveTreatments(allTreatments);
 * // count = 5
 */
export function countActiveTreatments<T extends TreatmentWithActiveStatus>(
  treatments: T[] | null | undefined
): number {
  if (!treatments || treatments.length === 0) return 0;
  
  return treatments.filter(t => t.is_active).length;
}

/**
 * Filtre un tableau pour ne garder que les traitements actifs
 * 
 * @param treatments - Tableau de traitements (peut être null/undefined)
 * @returns Nouveau tableau contenant uniquement les traitements actifs
 * 
 * @example
 * const active = filterActiveTreatments(allTreatments);
 * // active = [{ is_active: true, ... }, ...]
 */
export function filterActiveTreatments<T extends TreatmentWithActiveStatus>(
  treatments: T[] | null | undefined
): T[] {
  if (!treatments || treatments.length === 0) return [];
  
  return treatments.filter(t => t.is_active);
}

/**
 * Vérifie si un traitement est actif
 * 
 * Fonction helper pour les conditions. Gère les cas null/undefined.
 * 
 * @param treatment - Traitement à vérifier (peut être null/undefined)
 * @returns true si le traitement est actif, false sinon
 * 
 * @example
 * if (isTreatmentActive(treatment)) {
 *   // Traitement actif
 * }
 */
export function isTreatmentActive<T extends TreatmentWithActiveStatus>(
  treatment: T | null | undefined
): treatment is T {
  return treatment?.is_active === true;
}

/**
 * Génère le texte du badge affichant le nombre de traitements actifs
 * 
 * Gère automatiquement le singulier/pluriel et le cas zéro.
 * 
 * @param count - Nombre de traitements actifs
 * @returns Texte formaté pour affichage
 * 
 * @example
 * getActiveTreatmentBadgeText(0);  // "Aucun traitement actif"
 * getActiveTreatmentBadgeText(1);  // "1 traitement actif"
 * getActiveTreatmentBadgeText(5);  // "5 traitements actifs"
 */
export function getActiveTreatmentBadgeText(count: number): string {
  if (count === 0) return "Aucun traitement actif";
  if (count === 1) return "1 traitement actif";
  return `${count} traitements actifs`;
}
```

---

## 🔄 FICHIERS À MODIFIER APRÈS CRÉATION

### 1. Treatments.tsx

**Import à ajouter** :
```typescript
import { countActiveTreatments, getActiveTreatmentBadgeText } from '@/lib/filterUtils';
```

**Ligne 238 : Subtitle du nombre de traitements actifs**
```typescript
// AVANT
subtitle={`${treatments.filter(t => t.is_active).length} traitement(s) actif(s)`}

// APRÈS (option 1 : helper complet)
subtitle={getActiveTreatmentBadgeText(countActiveTreatments(treatments))}

// OU (option 2 : count seulement)
subtitle={`${countActiveTreatments(treatments)} traitement(s) actif(s)`}
```

---

### 2. Pages avec requêtes Supabase (optionnel)

Cette constante est **optionnelle** pour le refactoring. Elle peut être utilisée pour améliorer la lisibilité, mais n'est pas obligatoire.

**Exemple d'utilisation dans Index.tsx** :
```typescript
import { ACTIVE_TREATMENT_FILTER } from '@/lib/filterUtils';

// AVANT
.select(`
  id,
  medication_id,
  scheduled_time,
  medications!inner(
    name,
    treatments!inner(is_active)
  )
`)
.eq("medications.treatments.is_active", true)

// APRÈS (optionnel - plus lisible)
.select(`
  id,
  medication_id,
  scheduled_time,
  ${ACTIVE_TREATMENT_FILTER.MEDICATIONS_WITH_TREATMENTS}
`)
.eq(ACTIVE_TREATMENT_FILTER.EQ_CONDITION, ACTIVE_TREATMENT_FILTER.ACTIVE_VALUE)
```

⚠️ **NOTE** : L'utilisation de `ACTIVE_TREATMENT_FILTER` dans les queries n'est PAS obligatoire pour cette phase. On se concentre sur les helpers de filtrage côté client.

---

## ✅ CRITÈRES DE VALIDATION

### Avant création du fichier
- [ ] Signatures TypeScript validées
- [ ] Interfaces claires et documentées
- [ ] Gestion robuste null/undefined
- [ ] JSDoc complet pour chaque fonction
- [ ] Constantes avec `as const` pour type safety

### Après création du fichier
- [ ] Fichier compile sans erreurs TypeScript
- [ ] Aucune dépendance externe
- [ ] Code compatible avec ES2020+
- [ ] Exports nommés (pas de default export)

### Après refactoring des pages
- [ ] Comptages identiques à l'ancien code
- [ ] Aucune régression visuelle
- [ ] Build réussit (`npm run build`)
- [ ] Lint passe (`npm run lint`)

---

## 📊 IMPACT ATTENDU

### Avant
- Pattern `treatments.filter(t => t.is_active).length` répété
- Vérifications `if (treatment && treatment.is_active)` partout
- Textes de badge inconsistants

### Après
- **4 helpers centralisés**
- Code plus lisible et maintenable
- Gestion robuste des cas limites

### Bénéfices
- ✅ Cohérence des filtres is_active
- ✅ Moins de code répétitif
- ✅ Gestion d'erreurs centralisée
- ✅ Facilite les tests unitaires
- ✅ Meilleure lisibilité

---

## 🎯 UTILISATION RECOMMANDÉE

### Cas d'usage prioritaires (Phase 1)
1. ✅ `countActiveTreatments()` → Treatments.tsx ligne 238
2. ✅ `getActiveTreatmentBadgeText()` → Treatments.tsx ligne 238
3. ✅ `isTreatmentActive()` → Conditions dans toute l'app

### Cas d'usage optionnels (Phase ultérieure)
4. 🔄 `ACTIVE_TREATMENT_FILTER` → Refactoring queries Supabase (optionnel)
5. 🔄 `filterActiveTreatments()` → Si besoin de filtrer côté client

---

**Prêt pour validation** : ⏳ EN ATTENTE  
**Prêt pour création** : ❌ NON (en attente validation utilisateur)
