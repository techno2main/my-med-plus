# CORRECTION CRITIQUE - useAdherenceStats.tsx

**Ordre d'exécution** : 5/5 (URGENT - Avant les refactorings)  
**Fichier à corriger** : `src/hooks/useAdherenceStats.tsx`  
**Date** : 27 octobre 2025  
**Priorité** : 🚨 **CRITIQUE**  
**Status** : ⏳ EN ATTENTE DE VALIDATION

---

## 🚨 ALERTE CRITIQUE

### Bug identifié

Le hook `useAdherenceStats` **NE FILTRE PAS** les traitements par `is_active`.

**Impact** : Les statistiques d'observance affichées à l'utilisateur **incluent les prises des traitements archivés**, ce qui fausse complètement les métriques !

---

## 📊 ANALYSE DU PROBLÈME

### Code actuel (BUGUÉ)

**Fichier** : `src/hooks/useAdherenceStats.tsx`  
**Lignes** : 37-48

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

### Conséquences

1. **Stats globales faussées** :
   - "Prises à l'heure" inclut les traitements archivés
   - "Prises en retard" inclut les traitements archivés
   - "Prises manquées" inclut les traitements archivés

2. **Observance % faussée** :
   - Le calcul sur 7 jours inclut des prises de traitements terminés
   - Le calcul sur 30 jours inclut des prises de traitements terminés

3. **Affichage utilisateur trompeur** :
   - L'utilisateur voit des statistiques qui ne reflètent pas sa situation actuelle
   - Les graphiques et badges sont incorrects

---

## 🔧 CORRECTION REQUISE

### Code corrigé

**Changements à effectuer** :

```typescript
// AVANT (ligne 37-48)
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

// APRÈS
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

### Détail des changements

1. **Ligne 43** : `medications (` → `medications!inner(`
   - Utilisation de `!inner` pour INNER JOIN
   - Exclut automatiquement les prises sans médicament

2. **Ligne 45** : `treatments(user_id)` → `treatments!inner(user_id, is_active)`
   - Ajout de `!inner` pour INNER JOIN
   - Ajout du champ `is_active` dans le select

3. **Nouvelle ligne 48** : Ajout de `.eq("medications.treatments.is_active", true)`
   - Filtre explicite sur les traitements actifs
   - Garantit que seules les prises de traitements actifs sont comptées

---

## 📄 DIFF COMPLET

```diff
   const loadStats = async () => {
     try {
       setLoading(true);

       // Charger tous les intakes (tout l'historique)
       const { data: intakesData, error } = await supabase
         .from("medication_intakes")
         .select(`
           id,
           medication_id,
           scheduled_time,
           taken_at,
           status,
-          medications (
+          medications!inner(
             treatment_id,
-            treatments(user_id)
+            treatments!inner(user_id, is_active)
           )
         `)
+        .eq("medications.treatments.is_active", true)
         .order("scheduled_time", { ascending: false });

       if (error) throw error;
```

---

## 🔍 VÉRIFICATION APRÈS CORRECTION

### Tests manuels à effectuer

1. **Vérifier le compteur "À l'heure"** :
   - Archiver un traitement qui avait des prises à l'heure
   - Actualiser la page des statistiques
   - ✅ Le compteur doit **diminuer**

2. **Vérifier le compteur "Manquées"** :
   - Archiver un traitement qui avait des prises manquées
   - Actualiser la page des statistiques
   - ✅ Le compteur doit **diminuer**

3. **Vérifier l'observance %** :
   - Noter l'observance avant archivage d'un traitement
   - Archiver un traitement récent
   - Actualiser la page des statistiques
   - ✅ L'observance % doit **changer** (augmenter ou diminuer selon le traitement)

4. **Vérifier avec traitement entièrement terminé** :
   - Archiver un traitement dont toutes les prises sont dans le passé
   - ✅ Toutes les statistiques de ce traitement doivent **disparaître** des compteurs

---

## 🎯 IMPACT ATTENDU

### Avant correction

```
Situation fictive :
- Traitement A (ACTIF) : 10 prises prises, 9 à l'heure
- Traitement B (ARCHIVÉ) : 20 prises, 15 à l'heure

Compteur affiché : "24 prises à l'heure" ❌ FAUX
Observance : 80% ❌ FAUX (calcul basé sur 30 prises)
```

### Après correction

```
Même situation :
- Traitement A (ACTIF) : 10 prises, 9 à l'heure
- Traitement B (ARCHIVÉ) : ignoré ✅

Compteur affiché : "9 prises à l'heure" ✅ CORRECT
Observance : 90% ✅ CORRECT (calcul basé sur 10 prises)
```

---

## 🔄 ORDRE D'EXÉCUTION DANS LA PHASE 1

**⚠️ IMPORTANT** : Cette correction doit être faite **AVANT** ou **EN PARALLÈLE** des autres refactorings.

### Option 1 : Correction immédiate (RECOMMANDÉ)

1. ✅ Corriger useAdherenceStats **maintenant**
2. ✅ Tester manuellement
3. ✅ Commit : `fix(critical): filtre is_active dans useAdherenceStats`
4. Puis procéder aux autres refactorings (sortingUtils, etc.)

### Option 2 : Correction incluse dans le refactoring

1. Créer tous les utils (sortingUtils, groupingUtils, etc.)
2. Corriger useAdherenceStats en même temps
3. Commit global de la Phase 1

**Recommandation** : **Option 1** car c'est un bug critique qui fausse les données utilisateur.

---

## ✅ CRITÈRES DE VALIDATION

### Avant correction

- [ ] Comprendre l'impact du bug
- [ ] Valider la correction proposée
- [ ] Décider de l'ordre d'exécution (immédiat ou avec refactoring)

### Après correction

- [ ] Fichier compile sans erreurs TypeScript
- [ ] Query Supabase ne génère pas d'erreur
- [ ] Données retournées sont cohérentes

### Tests manuels

- [ ] Compteur "À l'heure" correct après archivage traitement
- [ ] Compteur "Manquées" correct après archivage traitement
- [ ] Observance % change après archivage traitement
- [ ] Aucune statistique de traitement archivé dans les compteurs

### Validation finale

- [ ] Build réussit (`npm run build`)
- [ ] Lint passe (`npm run lint`)
- [ ] Commit avec message explicite
- [ ] Push vers branche phase1

---

## 📋 CHECKLIST DE COMMIT

Si correction immédiate (Option 1) :

```bash
# 1. Effectuer la correction dans useAdherenceStats.tsx

# 2. Tester manuellement (archiver un traitement, vérifier stats)

# 3. Commit
git add src/hooks/useAdherenceStats.tsx
git commit -m "fix(critical): filtre is_active dans useAdherenceStats

Bug critique: Les statistiques d'observance incluaient les traitements archivés
Correction: Ajout du filtre treatments.is_active = true dans la requête

Impact:
- Compteurs 'À l'heure', 'En retard', 'Manquées' maintenant corrects
- Observance % calculée uniquement sur traitements actifs
- Statistiques reflètent la situation actuelle de l'utilisateur

Changements:
- medications() → medications!inner() (INNER JOIN)
- treatments() → treatments!inner(is_active) (INNER JOIN + champ)
- Ajout .eq('medications.treatments.is_active', true)"

# 4. Push
git push origin phase1/mutualisation-fonctions
```

---

## 📊 COMPARAISON AVEC LES AUTRES HOOKS

### Hooks déjà corrigés ✅

1. **useMissedIntakesDetection.tsx** (ligne 73-77)
   - ✅ Filtre is_active présent
   - ✅ Commit déjà effectué (phase1)

2. **useAutoRegenerateIntakes.tsx** (ligne 32-35)
   - ✅ Filtre is_active présent
   - ✅ OK depuis le début

### Hook à corriger 🚨

3. **useAdherenceStats.tsx** (ligne 37-48)
   - ❌ Filtre is_active MANQUANT
   - 🚨 BUG CRITIQUE - À corriger en urgence

---

## 🎯 PROCHAINES ÉTAPES

### Si validation OK

1. **Correction immédiate** :
   - Appliquer le changement dans `useAdherenceStats.tsx`
   - Tester manuellement avec archivage d'un traitement
   - Commit + Push

2. **Puis continuer Phase 1** :
   - Créer `sortingUtils.ts`
   - Créer `groupingUtils.ts`
   - Créer `filterUtils.ts`
   - Compléter `dateUtils.ts`
   - Refactoriser les 6 pages

### Si validation NON

- Attendre retour utilisateur
- Éventuellement revoir l'approche de correction
- Documenter les raisons du refus

---

**Prêt pour validation** : ⏳ EN ATTENTE  
**Prêt pour correction** : ❌ NON (en attente validation utilisateur)  
**Priorité** : 🚨 CRITIQUE - À traiter en premier
