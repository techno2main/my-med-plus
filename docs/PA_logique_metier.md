# Plan d'Action - Refonte Logique Métier MyHealth+

**Date** : 27 octobre 2025  
**Objectif** : Centraliser le code, gérer correctement les traitements archivés, et couvrir tous les scénarios métier

---

## 🎯 Vue d'ensemble

### Problèmes actuels
- ❌ Code dupliqué sur toutes les pages (tri, filtrage, groupement)
- ❌ Traitements archivés invisibles (pas d'historique accessible)
- ❌ Hooks qui incluent les traitements archivés dans les calculs
- ❌ Modification des horaires crée des prises orphelines
- ❌ Pas de gestion de la réactivation d'un traitement
- ❌ Pas d'avertissement si end_date dépassée

### Approche
1. **Phase 1** : Base de données (colonnes, triggers, fonctions PostgreSQL)
2. **Phase 2** : Utilitaires centralisés (sortingUtils, filterUtils, etc.)
3. **Phase 3** : Correction des hooks et pages
4. **Phase 4** : Interface traitements archivés
5. **Phase 5** : Tests et validation

---

## 📊 Récapitulatif des Scénarios

| # | Scénario | Décision | Actions requises |
|---|----------|----------|------------------|
| 2 | Traitement neuf archivé | ✅ GARDER avec badge "Non commencé" | Affichage conditionnel |
| 3 | Traitement en cours archivé | ✅ GARDER tout + annuler visites pharma | Trigger + affichage |
| 4 | Réactivation | ⚠️ Rare - Skipped auto entre dates | Trigger + logique métier |
| 5 | Modification horaires | ✅ UPDATE futures + supprimer orphelines | Trigger complexe |
| 6 | Suppression médicament | ❌ INTERDIT si prises existent + flag "inactif" | Contrainte + colonne |
| 7 | Modification QSP | ⚠️ À revoir avec utilisateur | - |
| 8 | Hook + archivés | ✅ Déjà corrigé (filtre is_active) | - |
| 9 | Prises manquées | ✅ Filtrer is_active dans hook | Correction hook |
| 10 | Stats observance | ✅ Filtrer is_active | Correction hook |
| 12 | end_date dépassée | ℹ️ Avertir utilisateur (pas auto) | Fonction + notification |

---

## 📋 PHASE 1 : Base de Données

### 1.1 - Ajout colonne `archived_at` sur `treatments`

**Fichier** : `migration_sql/scripts_sql/20_add_archived_at.sql`

```sql
-- Ajouter la colonne archived_at
ALTER TABLE treatments 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Remplir rétroactivement pour les traitements déjà archivés
UPDATE treatments 
SET archived_at = updated_at 
WHERE is_active = false AND archived_at IS NULL;

-- Index pour les requêtes
CREATE INDEX IF NOT EXISTS idx_treatments_archived_at 
ON treatments(archived_at) 
WHERE archived_at IS NOT NULL;

COMMENT ON COLUMN treatments.archived_at IS 'Date et heure d''archivage du traitement. NULL si actif.';
```

**Impact** :
- ✅ Permet de savoir QUAND un traitement a été archivé
- ✅ Permet de distinguer "jamais commencé" vs "en cours puis archivé"

---

### 1.2 - Trigger d'archivage automatique

**Fichier** : `migration_sql/scripts_sql/21_trigger_archive_treatment.sql`

```sql
-- Fonction qui gère l'archivage d'un traitement
CREATE OR REPLACE FUNCTION handle_treatment_archive()
RETURNS TRIGGER AS $$
DECLARE
  treatment_started BOOLEAN;
BEGIN
  -- Si le traitement passe de actif à archivé
  IF NEW.is_active = false AND OLD.is_active = true THEN
    
    -- 1. Enregistrer la date d'archivage
    NEW.archived_at = NOW();
    
    -- 2. Vérifier si le traitement avait commencé
    SELECT EXISTS (
      SELECT 1 
      FROM medication_intakes mi
      JOIN medications m ON m.id = mi.medication_id
      WHERE m.treatment_id = NEW.id
        AND mi.status IN ('taken', 'skipped')
    ) INTO treatment_started;
    
    -- 3. Annuler les visites pharmacie futures
    UPDATE pharmacy_visits
    SET 
      is_completed = true,
      notes = CASE 
        WHEN notes IS NULL OR notes = '' 
        THEN 'Annulée - Traitement archivé le ' || TO_CHAR(NOW(), 'DD/MM/YYYY')
        ELSE notes || E'\n' || 'Annulée - Traitement archivé le ' || TO_CHAR(NOW(), 'DD/MM/YYYY')
      END,
      updated_at = NOW()
    WHERE treatment_id = NEW.id
      AND visit_date >= CURRENT_DATE
      AND is_completed = false;
    
    -- 4. Log pour debug
    RAISE NOTICE 'Traitement % archivé. Started: %. Visites annulées: %', 
      NEW.name, 
      treatment_started,
      (SELECT COUNT(*) FROM pharmacy_visits WHERE treatment_id = NEW.id AND visit_date >= CURRENT_DATE);
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attacher le trigger
DROP TRIGGER IF EXISTS trigger_archive_treatment ON treatments;
CREATE TRIGGER trigger_archive_treatment
  BEFORE UPDATE OF is_active ON treatments
  FOR EACH ROW
  EXECUTE FUNCTION handle_treatment_archive();
```

**Impact** :
- ✅ Annule automatiquement les visites pharmacie futures
- ✅ Détecte si le traitement avait commencé (pour badge "Non commencé")
- ✅ Garde les visites passées intactes

---

### 1.3 - Ajout colonne `is_active` sur `medications`

**Fichier** : `migration_sql/scripts_sql/22_add_medication_is_active.sql`

```sql
-- Ajouter colonne is_active sur medications (pour Scénario 6)
ALTER TABLE medications 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Index
CREATE INDEX IF NOT EXISTS idx_medications_is_active 
ON medications(is_active);

COMMENT ON COLUMN medications.is_active IS 'Indique si ce médicament est encore à prendre. false = historique seulement.';

-- Mettre à jour les médicaments dont le traitement est archivé
UPDATE medications m
SET is_active = false
FROM treatments t
WHERE m.treatment_id = t.id
  AND t.is_active = false
  AND m.is_active = true;
```

**Impact** :
- ✅ Permet de désactiver un médicament sans le supprimer (Scénario 6)
- ✅ Garde l'historique des prises passées
- ✅ Empêche la génération de futures prises pour ce médicament

---

### 1.4 - Trigger de désactivation cascade

**Fichier** : `migration_sql/scripts_sql/23_trigger_medication_cascade.sql`

```sql
-- Quand un traitement est archivé, désactiver tous ses médicaments
CREATE OR REPLACE FUNCTION cascade_treatment_archive_to_medications()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false AND OLD.is_active = true THEN
    UPDATE medications
    SET is_active = false, updated_at = NOW()
    WHERE treatment_id = NEW.id
      AND is_active = true;
    
    RAISE NOTICE 'Médicaments désactivés pour le traitement %', NEW.name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cascade_medication ON treatments;
CREATE TRIGGER trigger_cascade_medication
  AFTER UPDATE OF is_active ON treatments
  FOR EACH ROW
  EXECUTE FUNCTION cascade_treatment_archive_to_medications();
```

**Impact** :
- ✅ Cohérence : traitement archivé = tous ses médicaments inactifs
- ✅ Empêche la régénération des prises

---

### 1.5 - Trigger de nettoyage des prises orphelines

**Fichier** : `migration_sql/scripts_sql/24_trigger_cleanup_orphan_intakes.sql`

```sql
-- Nettoyer les prises orphelines quand on modifie les horaires (Scénario 5)
CREATE OR REPLACE FUNCTION cleanup_orphan_intakes()
RETURNS TRIGGER AS $$
DECLARE
  deleted_count INTEGER;
  updated_count INTEGER;
BEGIN
  -- Si les horaires ont changé
  IF OLD.times IS DISTINCT FROM NEW.times THEN
    
    -- 1. SUPPRIMER les prises futures dont l'horaire n'existe plus
    WITH deleted AS (
      DELETE FROM medication_intakes
      WHERE medication_id = NEW.id
        AND status = 'pending'
        AND DATE(scheduled_time AT TIME ZONE 'Europe/Paris') >= CURRENT_DATE
        AND TO_CHAR(scheduled_time AT TIME ZONE 'Europe/Paris', 'HH24:MI') NOT IN (
          SELECT unnest(NEW.times)
        )
      RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    -- 2. METTRE À JOUR les prises futures dont l'horaire a changé
    -- Exemple : 09:00 devient 09:30
    -- On trouve les correspondances par position dans le tableau
    -- Cette partie est complexe car il faut détecter les modifications sans suppression
    
    -- Pour simplifier, on régénère tout après suppression
    PERFORM regenerate_future_intakes(NEW.id);
    
    RAISE NOTICE 'Nettoyage prises médicament %: % supprimées, régénération lancée', 
      NEW.name, deleted_count;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cleanup_orphans ON medications;
CREATE TRIGGER trigger_cleanup_orphans
  AFTER UPDATE OF times ON medications
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphan_intakes();
```

**Impact** :
- ✅ Supprime les prises futures dont l'horaire n'existe plus
- ✅ Régénère les prises avec les nouveaux horaires
- ✅ Garde les prises passées (taken/skipped) intactes

---

### 1.6 - Trigger de réactivation

**Fichier** : `migration_sql/scripts_sql/25_trigger_reactivate_treatment.sql`

```sql
-- Gérer la réactivation d'un traitement archivé (Scénario 4)
CREATE OR REPLACE FUNCTION handle_treatment_reactivation()
RETURNS TRIGGER AS $$
DECLARE
  med_record RECORD;
  archive_date DATE;
  reactivation_date DATE;
BEGIN
  -- Si le traitement passe d'archivé à actif
  IF NEW.is_active = true AND OLD.is_active = false THEN
    
    archive_date := DATE(OLD.archived_at);
    reactivation_date := CURRENT_DATE;
    
    -- 1. Réinitialiser archived_at
    NEW.archived_at = NULL;
    
    -- 2. Réactiver les médicaments
    UPDATE medications
    SET is_active = true, updated_at = NOW()
    WHERE treatment_id = NEW.id;
    
    -- 3. Marquer comme SKIPPED les prises pending entre la date d'archivage et aujourd'hui
    UPDATE medication_intakes mi
    SET 
      status = 'skipped',
      notes = COALESCE(notes || E'\n', '') || 'Marquée skipped automatiquement (traitement archivé du ' 
        || TO_CHAR(archive_date, 'DD/MM/YYYY') || ' au ' || TO_CHAR(reactivation_date, 'DD/MM/YYYY') || ')',
      updated_at = NOW()
    FROM medications m
    WHERE mi.medication_id = m.id
      AND m.treatment_id = NEW.id
      AND mi.status = 'pending'
      AND DATE(mi.scheduled_time AT TIME ZONE 'Europe/Paris') >= archive_date
      AND DATE(mi.scheduled_time AT TIME ZONE 'Europe/Paris') < reactivation_date;
    
    -- 4. Régénérer les prises futures pour chaque médicament
    FOR med_record IN 
      SELECT id FROM medications WHERE treatment_id = NEW.id
    LOOP
      PERFORM regenerate_future_intakes(med_record.id);
    END LOOP;
    
    RAISE NOTICE 'Traitement % réactivé. Prises entre % et % marquées skipped. Régénération lancée.',
      NEW.name, archive_date, reactivation_date;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reactivate_treatment ON treatments;
CREATE TRIGGER trigger_reactivate_treatment
  BEFORE UPDATE OF is_active ON treatments
  FOR EACH ROW
  EXECUTE FUNCTION handle_treatment_reactivation();
```

**Impact** :
- ✅ Marque automatiquement les prises entre archivage et réactivation comme "skipped"
- ✅ Régénère les prises futures
- ✅ Préserve l'historique complet

---

### 1.7 - Fonction de vérification end_date

**Fichier** : `migration_sql/scripts_sql/26_function_check_expired_treatments.sql`

```sql
-- Fonction pour détecter les traitements dont la end_date est dépassée (Scénario 12)
CREATE OR REPLACE FUNCTION get_expired_treatments()
RETURNS TABLE (
  treatment_id UUID,
  treatment_name TEXT,
  end_date DATE,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.end_date,
    (CURRENT_DATE - t.end_date)::INTEGER as days_overdue
  FROM treatments t
  WHERE t.is_active = true
    AND t.end_date IS NOT NULL
    AND t.end_date < CURRENT_DATE
  ORDER BY t.end_date DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_expired_treatments() IS 'Retourne la liste des traitements actifs dont la date de fin est dépassée.';
```

**Impact** :
- ✅ Fonction appelable depuis le frontend
- ✅ Permet d'afficher une notification à l'utilisateur
- ℹ️ Pas d'archivage automatique (décision utilisateur)

---

### 1.8 - Contrainte sur suppression de médicament

**Fichier** : `migration_sql/scripts_sql/27_constraint_medication_deletion.sql`

```sql
-- Empêcher la suppression d'un médicament si des prises existent (Scénario 6)
CREATE OR REPLACE FUNCTION prevent_medication_deletion()
RETURNS TRIGGER AS $$
DECLARE
  intake_count INTEGER;
BEGIN
  -- Compter les prises existantes (taken ou skipped)
  SELECT COUNT(*) INTO intake_count
  FROM medication_intakes
  WHERE medication_id = OLD.id
    AND status IN ('taken', 'skipped');
  
  IF intake_count > 0 THEN
    RAISE EXCEPTION 
      'Impossible de supprimer le médicament %. Il existe % prise(s) dans l''historique. Utilisez is_active = false pour le désactiver.',
      OLD.name, intake_count
      USING HINT = 'Désactivez le médicament au lieu de le supprimer pour conserver l''historique.';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_medication_deletion ON medications;
CREATE TRIGGER trigger_prevent_medication_deletion
  BEFORE DELETE ON medications
  FOR EACH ROW
  EXECUTE FUNCTION prevent_medication_deletion();
```

**Impact** :
- ✅ Empêche la perte d'historique
- ✅ Force l'utilisation de `is_active = false`
- ✅ Autorise la suppression si aucune prise (traitement neuf jamais commencé)

---

## 🔧 PHASE 2 : Utilitaires Centralisés

### 2.1 - Fichier `sortingUtils.ts`

**Fichier** : `src/lib/sortingUtils.ts`

```typescript
// Fonctions de tri centralisées

export interface IntakeWithTime {
  time: string; // Format "HH:mm"
  medication: string;
}

export interface MedicationWithTimes {
  name: string;
  times: string[];
}

export interface TreatmentWithDate {
  startDate: string; // ISO string
}

/**
 * Trie les prises par horaire (HH:mm) puis par nom de médicament (alphabétique)
 */
export function sortIntakesByTimeAndName<T extends IntakeWithTime>(
  intakes: T[]
): T[] {
  return [...intakes].sort((a, b) => {
    // 1. Trier par heure
    const timeCompare = a.time.localeCompare(b.time);
    if (timeCompare !== 0) return timeCompare;
    
    // 2. Trier par nom de médicament (français)
    return a.medication.localeCompare(b.medication, 'fr', {
      sensitivity: 'base',
      ignorePunctuation: true
    });
  });
}

/**
 * Trie les médicaments par première prise du jour, puis par nom
 */
export function sortMedicationsByEarliestTime<T extends MedicationWithTimes>(
  medications: T[]
): T[] {
  return [...medications].sort((a, b) => {
    const timeA = getEarliestMinutes(a.times);
    const timeB = getEarliestMinutes(b.times);
    
    if (timeA !== timeB) return timeA - timeB;
    
    return a.name.localeCompare(b.name, 'fr', {
      sensitivity: 'base',
      ignorePunctuation: true
    });
  });
}

/**
 * Trie les traitements par date de début
 */
export function sortTreatmentsByStartDate<T extends TreatmentWithDate>(
  treatments: T[],
  ascending = true
): T[] {
  return [...treatments].sort((a, b) => {
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Convertit un tableau de times (HH:mm) en minutes depuis minuit
 */
function getEarliestMinutes(times: string[]): number {
  if (!times || times.length === 0) return 24 * 60; // Minuit = fin de journée
  
  const sortedTimes = [...times].sort();
  const [hours, minutes] = sortedTimes[0].split(':').map(Number);
  
  return hours * 60 + minutes;
}
```

---

### 2.2 - Fichier `groupingUtils.ts`

**Fichier** : `src/lib/groupingUtils.ts`

```typescript
// Fonctions de groupement centralisées

export interface IntakeBase {
  treatmentId: string;
  treatment: string;
  treatmentQspDays?: number | null;
  treatmentEndDate?: string | null;
}

export interface GroupedByTreatment<T> {
  treatment: string;
  qspDays?: number | null;
  endDate?: string | null;
  intakes: T[];
}

/**
 * Groupe les prises par traitement
 */
export function groupIntakesByTreatment<T extends IntakeBase>(
  intakes: T[]
): Record<string, GroupedByTreatment<T>> {
  return intakes.reduce((acc, intake) => {
    if (!acc[intake.treatmentId]) {
      acc[intake.treatmentId] = {
        treatment: intake.treatment,
        qspDays: intake.treatmentQspDays,
        endDate: intake.treatmentEndDate,
        intakes: []
      };
    }
    acc[intake.treatmentId].intakes.push(intake);
    return acc;
  }, {} as Record<string, GroupedByTreatment<T>>);
}
```

---

### 2.3 - Fichier `filterUtils.ts`

**Fichier** : `src/lib/filterUtils.ts`

```typescript
// Fonctions de filtrage centralisées

/**
 * Clause SQL standard pour filtrer les traitements actifs
 * À utiliser dans les requêtes Supabase
 */
export const ACTIVE_TREATMENT_FILTER = {
  join: 'treatments!inner(is_active)',
  condition: { 'treatments.is_active': true }
} as const;

/**
 * Clause SQL standard pour filtrer les médicaments actifs
 * À utiliser dans les requêtes Supabase
 */
export const ACTIVE_MEDICATION_FILTER = {
  join: 'medications!inner(is_active, treatment_id, treatments!inner(is_active))',
  conditions: { 
    'medications.is_active': true,
    'medications.treatments.is_active': true 
  }
} as const;

/**
 * Vérifie si un traitement est considéré comme "jamais commencé"
 */
export function isTreatmentNeverStarted(
  startDate: string,
  archivedAt: string | null
): boolean {
  if (!archivedAt) return false;
  
  const start = new Date(startDate);
  const archived = new Date(archivedAt);
  
  // Archivé avant la date de début = jamais commencé
  return archived < start;
}

/**
 * Génère le badge approprié pour un traitement archivé
 */
export function getArchivedBadgeText(
  startDate: string,
  archivedAt: string | null
): string {
  if (!archivedAt) return '';
  
  const archived = new Date(archivedAt);
  const dateStr = archived.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  if (isTreatmentNeverStarted(startDate, archivedAt)) {
    return `Non commencé - Archivé le ${dateStr}`;
  }
  
  return `Archivé le ${dateStr}`;
}
```

---

## 🎨 PHASE 3 : Correction des Hooks et Pages

### 3.1 - Correction `useMissedIntakesDetection`

**Fichier** : `src/hooks/useMissedIntakesDetection.tsx`

**Ligne ~25-40** : Ajouter le filtre is_active

```typescript
// AVANT
const { data: intakes } = await supabase
  .from("medication_intakes")
  .select(`
    *,
    medications (
      name,
      treatments (name)
    )
  `)
  .eq("status", "pending")
  .lt("scheduled_time", now.toISOString());

// APRÈS
const { data: intakes } = await supabase
  .from("medication_intakes")
  .select(`
    *,
    medications!inner (
      name,
      is_active,
      treatments!inner (name, is_active)
    )
  `)
  .eq("status", "pending")
  .eq("medications.is_active", true)
  .eq("medications.treatments.is_active", true)
  .lt("scheduled_time", now.toISOString());
```

---

### 3.2 - Correction `useAdherenceStats`

**Fichier** : `src/hooks/useAdherenceStats.tsx`

**Ligne ~30-50** : Ajouter le filtre is_active + option toggle

```typescript
// Ajouter un paramètre includeArchived
export const useAdherenceStats = (includeArchived = false) => {
  // ...
  
  let query = supabase
    .from("medication_intakes")
    .select(`
      *,
      medications!inner (
        name,
        is_active,
        treatments!inner (name, is_active)
      )
    `);
  
  // Filtrer par is_active si demandé
  if (!includeArchived) {
    query = query
      .eq("medications.is_active", true)
      .eq("medications.treatments.is_active", true);
  }
  
  // ... reste de la logique
}
```

---

### 3.3 - Refactorisation `Index.tsx`

**Fichier** : `src/pages/Index.tsx`

**Actions** :
1. Importer les utilitaires
2. Remplacer le tri manuel par `sortIntakesByTimeAndName()`
3. Remplacer le groupement par `groupIntakesByTreatment()`
4. Utiliser `sortTreatmentsByStartDate()` pour les traitements

```typescript
// Imports
import { sortIntakesByTimeAndName, sortTreatmentsByStartDate } from "@/lib/sortingUtils";
import { groupIntakesByTreatment } from "@/lib/groupingUtils";

// Ligne ~130-137 : Tri des traitements
const sortedTreatments = sortTreatmentsByStartDate(treatmentsWithQsp, true);

// Ligne ~546-561 : Section Aujourd'hui
const groupedToday = groupIntakesByTreatment(todayIntakes);

Object.values(groupedToday).forEach(group => {
  group.intakes = sortIntakesByTimeAndName(group.intakes);
});

// Ligne ~645-655 : Section Demain (idem)
const groupedTomorrow = groupIntakesByTreatment(tomorrowIntakes);

Object.values(groupedTomorrow).forEach(group => {
  group.intakes = sortIntakesByTimeAndName(group.intakes);
});
```

---

### 3.4 - Refactorisation `Calendar.tsx`

**Fichier** : `src/pages/Calendar.tsx`

**Actions** :
1. Ajouter le tri des prises dans les détails du jour (ligne ~250)

```typescript
import { sortIntakesByTimeAndName } from "@/lib/sortingUtils";

// Après le chargement des prises du jour sélectionné
const sortedDayIntakes = sortIntakesByTimeAndName(dayIntakes);
```

---

### 3.5 - Refactorisation `Treatments.tsx`

**Fichier** : `src/pages/Treatments.tsx`

**Actions** :
1. Remplacer le tri manuel par `sortMedicationsByEarliestTime()`
2. Utiliser `sortTreatmentsByStartDate()` si nécessaire

```typescript
import { sortMedicationsByEarliestTime, sortTreatmentsByStartDate } from "@/lib/sortingUtils";

// Ligne ~166-190
const sortedMedications = sortMedicationsByEarliestTime(medsWithPathology);
```

---

### 3.6 - Refactorisation `History.tsx`

**Fichier** : `src/pages/History.tsx`

**Actions** :
1. Ajouter le tri avec `sortIntakesByTimeAndName()` si nécessaire

---

## 🖼️ PHASE 4 : Interface Traitements Archivés

### 4.1 - Nouvelle page `ArchivedTreatments.tsx`

**Fichier** : `src/pages/ArchivedTreatments.tsx`

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Calendar, Pill } from "lucide-react";
import { getArchivedBadgeText } from "@/lib/filterUtils";
import { sortTreatmentsByStartDate } from "@/lib/sortingUtils";

export default function ArchivedTreatments() {
  const { data: archivedTreatments, isLoading } = useQuery({
    queryKey: ["archived-treatments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select(`
          *,
          prescriptions (
            doctor_id,
            health_professionals (name)
          )
        `)
        .eq("is_active", false)
        .order("archived_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div>Chargement...</div>;

  const sortedTreatments = sortTreatmentsByStartDate(
    archivedTreatments || [],
    false // Plus récent d'abord
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Lock className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-3xl font-bold">Traitements Archivés</h1>
      </div>

      {sortedTreatments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Aucun traitement archivé
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedTreatments.map((treatment) => (
            <Card key={treatment.id} className="opacity-75">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="h-5 w-5" />
                      {treatment.name}
                    </CardTitle>
                    <Badge variant="secondary" className="mt-2">
                      <Lock className="h-3 w-3 mr-1" />
                      {getArchivedBadgeText(treatment.start_date, treatment.archived_at)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Du {new Date(treatment.start_date).toLocaleDateString('fr-FR')}
                      {treatment.end_date && ` au ${new Date(treatment.end_date).toLocaleDateString('fr-FR')}`}
                    </span>
                  </div>
                  {/* Ajouter historique des prises ici */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 4.2 - Lien dans la navigation

**Fichier** : `src/pages/Treatments.tsx`

Ajouter un bouton "Voir les traitements archivés" en haut de la page.

---

### 4.3 - Composant `ArchivedIntakeHistory`

**Fichier** : `src/components/archived/ArchivedIntakeHistory.tsx`

Affiche l'historique des prises d'un traitement archivé (taken/skipped/pending).

---

## ✅ PHASE 5 : Tests et Validation

### 5.1 - Tests unitaires

**Fichier** : `src/lib/__tests__/sortingUtils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { sortIntakesByTimeAndName, sortMedicationsByEarliestTime } from '../sortingUtils';

describe('sortIntakesByTimeAndName', () => {
  it('should sort by time first', () => {
    // Test
  });
  
  it('should sort alphabetically when same time', () => {
    // Test
  });
});
```

---

### 5.2 - Checklist de validation manuelle

- [ ] Créer un nouveau traitement → Vérifier génération 7 jours
- [ ] Archiver traitement neuf (non commencé) → Badge "Non commencé"
- [ ] Archiver traitement en cours → Visites pharma annulées
- [ ] Réactiver traitement → Prises skipped automatiquement
- [ ] Modifier horaires médicament → Prises orphelines supprimées
- [ ] Désactiver un médicament → Pas de nouvelles prises générées
- [ ] Essayer de supprimer médicament avec prises → Erreur bloquante
- [ ] Vérifier stats d'observance sans archivés
- [ ] Vérifier détection prises manquées sans archivés
- [ ] Consulter page traitements archivés

---

## 📊 Ordre d'Exécution Recommandé

### Semaine 1 : Base de données
1. ✅ Créer les 8 fichiers SQL (20 à 27)
2. ⚠️ **VOUS** exécutez chaque script dans Supabase (un par un)
3. ✅ Vérifier les triggers avec des tests manuels

### Semaine 2 : Utilitaires
4. ✅ Créer `sortingUtils.ts`
5. ✅ Créer `groupingUtils.ts`
6. ✅ Créer `filterUtils.ts`
7. ✅ Écrire tests unitaires

### Semaine 3 : Hooks et Pages
8. ✅ Corriger `useMissedIntakesDetection`
9. ✅ Corriger `useAdherenceStats`
10. ✅ Refactoriser `Index.tsx`
11. ✅ Refactoriser `Calendar.tsx`
12. ✅ Refactoriser `Treatments.tsx`
13. ✅ Refactoriser `History.tsx`

### Semaine 4 : Interface Archivés
14. ✅ Créer page `ArchivedTreatments.tsx`
15. ✅ Créer composant `ArchivedIntakeHistory`
16. ✅ Ajouter lien dans navigation

### Semaine 5 : Tests
17. ✅ Tests manuels complets
18. ✅ Corrections de bugs
19. ✅ Build + Sync Android
20. ✅ Tests en conditions réelles

---

## 🔄 Scénario 7 : Gestion du Stock et Visites Pharmacie

### **⚠️ CLARIFICATION TERMINOLOGIQUE**

**Ancien (CONFUS)** :
- "QSP ordonnance" et "QSP médicament" → Confusion !

**Nouveau (CLAIR)** :
- **Validité ordonnance** (`prescriptions.validity_months`) : 1, 3, 6, 12 mois → Détermine le renouvellement 2/3
- **Stock initial** (`medications.initial_stock`) : Unités reçues à la première visite pharmacie
- **Stock actuel** (`medications.current_stock`) : Unités restantes en temps réel

---

### **🎯 Architecture Progressive en 3 Temps**

#### **TEMPS 1 : Création du Traitement (Wizard)**

**État** : L'utilisateur a une ordonnance mais n'est PAS encore allé à la pharmacie

**Étape 1 - Ordonnance** :
```
- Médecin prescripteur
- Date de début
- ✅ Validité ordonnance (3, 6, 12 mois) ← ANCIEN "QSP"
- Ordonnance de référence (optionnel)
```

**Étape 2 - Médicaments** :
```
- Choix depuis référentiel OU création manuelle
- Nom, posologie, horaires
- ❌ PAS de stock (on ne l'a pas encore !)
```

**Étape 3 - Pharmacie** :
```
- Pharmacie de référence (optionnel)
```

**Résultat** : 
- Traitement créé ✅
- Prises générées pour 7 jours ✅
- ⚠️ AUCUNE visite pharmacie planifiée (stock inconnu)

---

#### **TEMPS 2 : Première Visite Pharmacie (Nouveau workflow)**

**État** : L'utilisateur revient de la pharmacie avec ses médicaments

**Interface** : Page "Traitement" → Badge "⚠️ Stock non renseigné" → Bouton "📦 Enregistrer la visite pharmacie"

**Dialog** :
```
Pour chaque médicament :
- Date de la visite
- Nombre de boîtes reçues
- Unités par boîte (28, 30, 60...)

Calcul automatique :
- Stock total = boîtes × unités/boîte
- Durée estimée = stock ÷ prises/jour
- Prochaine visite suggérée = aujourd'hui + durée - 3 jours (marge sécurité)
```

**Action backend** :
```sql
-- 1. Enregistrer le stock initial
UPDATE medications SET
  initial_stock = (boxes * units_per_box),
  current_stock = (boxes * units_per_box),
  unit_per_box = units_per_box;

-- 2. Créer la visite initiale (historique)
INSERT INTO pharmacy_visits (treatment_id, visit_date, visit_type, is_completed)
VALUES (treatment_id, visit_date, 'initial', true);

-- 3. Calculer les prochaines visites automatiquement
SELECT calculate_pharmacy_visits_for_treatment(treatment_id);
```

**Résultat** :
- Stock initial enregistré ✅
- Prochaine visite pharmacie calculée ✅
- Renouvellement 2/3 planifié ✅

---

#### **TEMPS 3 : Mise à Jour du Stock (Récurrent)**

**Déclencheurs** :
- Nouvelle visite pharmacie (ajout de stock)
- Correction manuelle (ajustement)

**Interface** : Page "Traitement" → Section "Stock" → Icône ✏️

**Modes** :
1. **Ajouter du stock** (visite pharmacie) :
   - Date de la visite
   - Boîtes reçues + Unités/boîte
   - → Recalcul automatique des visites

2. **Ajuster manuellement** :
   - Nouveau stock
   - Raison (optionnel)
   - → Recalcul automatique des visites

**Traçabilité** : Tous les changements enregistrés dans `stock_adjustments`

---

### **📊 Décision Scénario 7**

**Question** : Faut-il recalculer automatiquement les visites pharmacie quand le stock change ?

**Réponse** : ✅ **OUI, recalcul automatique avec traçabilité**

**Raisons** :
1. Cohérence : Le stock est la source de vérité
2. Sécurité : L'utilisateur ne risque pas d'oublier de recalculer
3. Transparence : Table `stock_adjustments` garde l'historique

**Implémentation** :
```sql
-- Trigger sur medications.current_stock
CREATE TRIGGER trigger_auto_recalculate_visits
  AFTER UPDATE OF current_stock ON medications
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_pharmacy_visits();
```

---

## 📝 Résumé des Actions par Scénario

| Scénario | Actions SQL | Actions Frontend | Priorité |
|----------|-------------|------------------|----------|
| 2 (Neuf archivé) | `archived_at` + trigger | Badge conditionnel | 🔴 P1 |
| 3 (En cours archivé) | Trigger annulation visites | Badge + consultation | 🔴 P1 |
| 4 (Réactivation) | Trigger skipped auto | Régénération prises | 🟡 P2 |
| 5 (Modif horaires) | Trigger cleanup orphelines | Aucune | 🔴 P1 |
| 6 (Suppression médoc) | Contrainte + `is_active` | Message erreur | 🔴 P1 |
| 7 (Modif QSP) | ⚠️ À décider | ⚠️ À décider | ⚠️ En attente |
| 8 (Hook archivés) | ✅ Déjà fait | ✅ Déjà fait | ✅ OK |
| 9 (Prises manquées) | Aucune | Filtre hook | 🔴 P1 |
| 10 (Stats observance) | Aucune | Filtre hook | 🔴 P1 |
| 12 (end_date) | Fonction SQL | Notification | 🟡 P2 |

---

## 🎯 Prochaine Étape

**Attendons votre décision sur le Scénario 7 (QSP)**, puis je commence par :

1. Créer les 8 fichiers SQL (vous les exécuterez)
2. Créer les 3 fichiers utilitaires
3. Vous donner un ordre d'exécution précis

**Validez-vous ce plan d'action ?**
