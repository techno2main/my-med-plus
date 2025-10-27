# Logique Métier - MyHealth+

## 📋 Vue d'ensemble

Ce document décrit l'architecture complète de la logique métier de l'application, les fonctions récurrentes, leur utilisation et les problèmes identifiés.

---

## 🎯 Concepts Clés

### 1. Traitement (Treatment)
- **Statut** : `is_active` (boolean)
  - `true` : Traitement actif
  - `false` : Traitement archivé
- **Propriétés** : name, start_date, end_date, prescription_id, pharmacy_id
- **Relation** : 1 traitement → N médicaments → N prises

### 2. Médicament (Medication)
- **Propriétés** : name, posology, times (TEXT[]), current_stock, min_threshold
- **Relation** : 1 médicament → 1 traitement → N prises

### 3. Prise (Medication Intake)
- **Statuts** : 
  - `pending` : À prendre
  - `taken` : Prise effectuée
  - `skipped` : Manquée/Oubliée
- **Propriétés** : scheduled_time (UTC), taken_at, status, notes
- **Stockage** : UTC dans la base, conversion Europe/Paris pour l'affichage

### 4. Visite Pharmacie (Pharmacy Visit)
- **Propriétés** : visit_date, visit_number, is_completed
- **Logique** : Calculé selon QSP (Quantité Suffisante Pour)
- **Relation** : N visites → 1 traitement

---

## 🔄 Fonctions Récurrentes

### A. Filtrage par Traitement Actif (`is_active = true`)

#### **Problème Identifié** ⚠️
Actuellement, les prises des traitements archivés sont **cachées** dans l'interface mais **conservées** en base sans indication d'archivage.

#### **Utilisation Actuelle**

| Fichier | Ligne(s) | Requête | But |
|---------|----------|---------|-----|
| `src/pages/Index.tsx` | 172-189 | `medication_intakes` avec `medications.treatments.is_active = true` | Afficher prises Aujourd'hui/Demain |
| `src/pages/Calendar.tsx` | 97-108 | `medication_intakes` avec `medications.treatments.is_active = true` | Données calendrier mensuel |
| `src/pages/Calendar.tsx` | 212-230 | `medication_intakes` avec `medications.treatments.is_active = true` | Détails d'un jour |
| `src/pages/Calendar.tsx` | 162-175 | `pharmacy_visits` avec `treatments.is_active = true` | Prochaine visite pharmacie |
| `src/pages/History.tsx` | 166-182 | `medication_intakes` avec `medications.treatments.is_active = true` | Historique des prises |
| `src/hooks/useAutoRegenerateIntakes.tsx` | 27-35 | `medications` avec `treatments.is_active = true` | Régénération automatique |

#### **Solution Recommandée** ✅
1. Ajouter un champ `archived_at` (timestamp) sur `treatments`
2. Ajouter une section "Historique des traitements archivés" accessible depuis la page Traitements
3. Afficher les prises archivées avec un badge "Archivé" et en grisé
4. Permettre la consultation mais pas la modification

---

### B. Tri des Prises par Horaire + Alphabétique

#### **Problème Identifié** ⚠️
Logique dupliquée sur 3 pages différentes, risque d'incohérence.

#### **Utilisation Actuelle**

| Fichier | Ligne(s) | Contexte | Logique |
|---------|----------|----------|---------|
| `src/pages/Index.tsx` | 546-561 | Section Aujourd'hui/Demain | 1. Trier par time (HH:mm), 2. Trier par medication name |
| `src/pages/Treatments.tsx` | 166-190 | Liste des médicaments d'un traitement | 1. Trier times array, 2. Trier medications par earliest time puis name |
| `src/pages/Calendar.tsx` | Non implémenté | Détails d'un jour | ⚠️ Pas de tri actuellement |

#### **Code Actuel (dupliqué)**
```typescript
// Dans Index.tsx
Object.values(groupedByTreatment).forEach(group => {
  group.intakes.sort((a, b) => {
    // 1. Trier par heure
    const timeCompare = a.time.localeCompare(b.time);
    if (timeCompare !== 0) return timeCompare;
    // 2. Trier par nom de médicament
    return a.medication.localeCompare(b.medication, 'fr');
  });
});

// Dans Treatments.tsx
medsWithPathology.sort((a, b) => {
  const getEarliestTime = (times: string[]) => {
    if (!times || times.length === 0) return 24 * 60;
    const [hours, minutes] = times[0].split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const timeA = getEarliestTime(a.times);
  const timeB = getEarliestTime(b.times);
  
  if (timeA !== timeB) return timeA - timeB;
  return a.name.localeCompare(b.name, 'fr');
});
```

#### **Solution Recommandée** ✅
Créer une fonction utilitaire centralisée :

```typescript
// src/lib/sortingUtils.ts

export function sortIntakesByTimeAndName(intakes: Intake[]) {
  return intakes.sort((a, b) => {
    const timeCompare = a.time.localeCompare(b.time);
    if (timeCompare !== 0) return timeCompare;
    return a.medication.localeCompare(b.medication, 'fr');
  });
}

export function sortMedicationsByEarliestTime(medications: Medication[]) {
  return medications.sort((a, b) => {
    const timeA = getEarliestMinutes(a.times);
    const timeB = getEarliestMinutes(b.times);
    if (timeA !== timeB) return timeA - timeB;
    return a.name.localeCompare(b.name, 'fr');
  });
}

function getEarliestMinutes(times: string[]): number {
  if (!times || times.length === 0) return 24 * 60;
  const [hours, minutes] = times[0].split(':').map(Number);
  return hours * 60 + minutes;
}
```

---

### C. Tri des Traitements par Date de Début

#### **Utilisation Actuelle**

| Fichier | Ligne(s) | Contexte | Logique |
|---------|----------|----------|---------|
| `src/pages/Index.tsx` | 129-137 | Liste des traitements actifs | Trier par start_date (plus ancien en premier) |
| `src/pages/Calendar.tsx` | 80 | Récupération du traitement le plus ancien | `order("start_date", { ascending: true }).limit(1)` |
| `src/pages/Treatments.tsx` | 52-53 | Liste tous les traitements | Trier par is_active DESC puis created_at DESC |

#### **Incohérence** ⚠️
- Index : Tri par start_date
- Calendar : Prend le plus ancien
- Treatments : Tri par created_at (pas start_date !)

#### **Solution Recommandée** ✅
Uniformiser avec `start_date` partout et créer une fonction :

```typescript
// src/lib/sortingUtils.ts
export function sortTreatmentsByStartDate(treatments: Treatment[], ascending = true) {
  return treatments.sort((a, b) => {
    const dateA = new Date(a.startDate).getTime();
    const dateB = new Date(b.startDate).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}
```

---

### D. Conversion Timezone (UTC ↔ Europe/Paris)

#### **Problème Identifié** ⚠️
Logique dupliquée sur toutes les pages, risque d'erreur saisonnière (hiver UTC+1, été UTC+2).

#### **Utilisation Actuelle**

| Fichier | Fonction | But |
|---------|----------|-----|
| `src/lib/dateUtils.ts` | `formatToFrenchTime()` | UTC → HH:mm France |
| `src/lib/dateUtils.ts` | `convertFrenchToUTC()` | Date locale → UTC |
| **Toutes les pages** | `parseISO()` + `AT TIME ZONE 'Europe/Paris'` | Conversion dans les requêtes |

#### **Code Actuel (bon)**
```typescript
// Dans dateUtils.ts (centralisé)
export const formatToFrenchTime = (utcTime: string): string => {
  const date = parseISO(utcTime);
  return format(date, "HH:mm", { timeZone: 'Europe/Paris' });
};

export const convertFrenchToUTC = (localDate: Date): Date => {
  const formatted = format(localDate, "yyyy-MM-dd'T'HH:mm:ss", { timeZone: 'Europe/Paris' });
  return parseISO(formatted + 'Z');
};
```

#### **Bonne Pratique** ✅
Cette partie est déjà bien centralisée, continuer à utiliser ces fonctions.

---

### E. Groupement des Prises par Traitement

#### **Problème Identifié** ⚠️
Logique dupliquée sur Index.tsx (Aujourd'hui + Demain).

#### **Utilisation Actuelle**

| Fichier | Ligne(s) | Contexte |
|---------|----------|----------|
| `src/pages/Index.tsx` | 525-535 | Section "Aujourd'hui" |
| `src/pages/Index.tsx` | 645-655 | Section "Demain" |

#### **Code Actuel (dupliqué)**
```typescript
const groupedByTreatment = todayIntakes.reduce((acc, intake) => {
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
}, {} as Record<string, { treatment: string; qspDays?: number | null; endDate?: string | null; intakes: UpcomingIntake[] }>);
```

#### **Solution Recommandée** ✅
Créer une fonction utilitaire :

```typescript
// src/lib/groupingUtils.ts
export function groupIntakesByTreatment<T extends { treatmentId: string; treatment: string; treatmentQspDays?: number | null; treatmentEndDate?: string | null }>(
  intakes: T[]
) {
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
  }, {} as Record<string, { treatment: string; qspDays?: number | null; endDate?: string | null; intakes: T[] }>);
}
```

---

## 🤖 Hooks et Automatisations

### Hook: `useAutoRegenerateIntakes`

**Fichier** : `src/hooks/useAutoRegenerateIntakes.tsx`

**Déclencheurs** :
1. Lancement de l'app (Android/iOS uniquement)
2. Retour au premier plan de l'app
3. Si > 6 heures depuis dernière exécution

**Workflow** :
```
1. Vérifie localStorage['last_intakes_regeneration']
2. Si > 6h OU première fois :
   a. SELECT medications WHERE is_active = true (✅ corrigé)
   b. Pour chaque médicament :
      - Appelle regenerate_future_intakes(med_id)
   c. Sauvegarde timestamp dans localStorage
```

**Fonction PostgreSQL** : `regenerate_future_intakes(med_id UUID)`

**Version Actuelle** (après optimisation) :
```sql
-- NE supprime RIEN (✅ optimisé)
-- Régénère 7 jours à partir d'AUJOURD'HUI
FOR i IN 0..6 LOOP
  intake_date := CURRENT_DATE + (i || ' days')::INTERVAL;
  
  FOR time_value IN SELECT unnest(times) FROM medications WHERE id = med_id LOOP
    IF NOT EXISTS (
      SELECT 1 FROM medication_intakes
      WHERE medication_id = med_id
        AND DATE(scheduled_time AT TIME ZONE 'Europe/Paris') = intake_date
        AND scheduled_time AT TIME ZONE 'Europe/Paris' = (intake_date + time_value::time)
    ) THEN
      INSERT INTO medication_intakes (medication_id, scheduled_time, status)
      VALUES (med_id, timezone('UTC', intake_date + time_value), 'pending');
    END IF;
  END LOOP;
END LOOP;
```

**Avantages** :
- ✅ Ne supprime jamais de données
- ✅ Crée uniquement ce qui manque
- ✅ Conserve les notes et modifications utilisateur
- ✅ Protège contre la perte de données

**Limitations** :
- ⚠️ Ne gère pas les modifications d'horaires (si un médicament passe de 3→2 prises/jour)
- ⚠️ Génère uniquement 7 jours (au-delà, rien)

---

### Hook: `useMissedIntakesDetection`

**Fichier** : `src/hooks/useMissedIntakesDetection.tsx`

**But** : Détecter les prises en retard selon les règles de tolérance

**Utilisation** :
- `src/pages/Index.tsx` : Badge "X prises manquées"

**Règles de Tolérance** :
```
Matin (06:00-11:59)   : +2h tolérance → Retard si > 14:00
Midi (12:00-13:59)    : +2h tolérance → Retard si > 16:00  
Après-midi (14:00-17:59) : +2h tolérance → Retard si > 20:00
Soir (18:00-22:59)    : +2h tolérance → Retard si > 01:00 (lendemain)
Nuit (23:00-05:59)    : +6h tolérance → Retard si > 11:00
```

**Problème** ⚠️ : Ne filtre PAS par `is_active` actuellement !

---

### Hook: `useAdherenceStats`

**Fichier** : `src/hooks/useAdherenceStats.tsx`

**But** : Calculer le taux d'observance global

**Utilisation** :
- `src/pages/Index.tsx` : Affichage du taux
- `src/pages/History.tsx` : Statistiques

**Problème** ⚠️ : Inclut probablement les traitements archivés dans le calcul !

---

## 📄 Pages et Utilisation

### Page: Accueil (`src/pages/Index.tsx`)

**Fonctions Utilisées** :
- ✅ Filtre `is_active = true` sur prises
- ✅ Tri des traitements par start_date
- ✅ Groupement par traitement (dupliqué 2x)
- ✅ Tri des prises par horaire + nom (dupliqué 2x)
- ✅ Conversion timezone avec `formatToFrenchTime()`
- ⚠️ `useMissedIntakesDetection` sans filtre is_active
- ⚠️ `useAdherenceStats` inclut probablement archivés

**Requêtes SQL** :
1. Treatments actifs avec QSP (lignes 102-141)
2. Medications actifs (lignes 143-159)
3. Medication_intakes (aujourd'hui + demain) avec filtre is_active (lignes 167-189)

---

### Page: Calendrier (`src/pages/Calendar.tsx`)

**Fonctions Utilisées** :
- ✅ Filtre `is_active = true` sur prises (3 requêtes)
- ✅ Filtre `is_active = true` sur visites pharmacie
- ✅ Conversion timezone
- ⚠️ Pas de tri des prises dans les détails du jour

**Requêtes SQL** :
1. Treatments actifs (ligne 80)
2. Medication_intakes du mois étendu (lignes 97-108)
3. Medication_intakes d'un jour (lignes 212-230)
4. Pharmacy_visits futures (lignes 162-175)

---

### Page: Historique (`src/pages/History.tsx`)

**Fonctions Utilisées** :
- ✅ Filtre `is_active = true` sur prises
- ✅ Conversion timezone
- ✅ Calcul QSP par traitement
- ⚠️ Pas de tri standardisé

**Requêtes SQL** :
1. Medication_intakes ALL avec filtre is_active (lignes 166-182)
2. Prescriptions pour QSP (lignes 198-206)

---

### Page: Traitements (`src/pages/Treatments.tsx`)

**Fonctions Utilisées** :
- ✅ Tri des medications par earliest time + nom
- ✅ Tri des times en ordre croissant
- ✅ Calcul QSP
- ❌ Affiche TOUS les traitements (actifs + archivés) - c'est normal ici

**Requêtes SQL** :
1. Treatments ALL (lignes 52-53)
2. Prescriptions + Doctors (lignes 72-89)
3. Pharmacy_visits futures (lignes 111-118)
4. Medications par treatment (lignes 120-132)

---

## ⚠️ Problèmes Majeurs Identifiés

### 1. **Traitement Archivé : Données Orphelines**

**Situation** :
- Traitement démarre le 23/10
- Prises prises du 23 au 26/10 (status: taken)
- Traitement archivé le 27/10
- Prises futures du 27/10 au 30/10 (status: pending)

**Comportement Actuel** ⚠️ :
- ❌ Toutes les prises (passées ET futures) sont cachées dans l'interface
- ❌ Pas de badge "Archivé" 
- ❌ Impossible de consulter l'historique de ce traitement
- ❌ Les stats d'observance peuvent être faussées
- ❌ Les visites pharmacie planifiées restent en base mais invisibles

**Solution Recommandée** :
```sql
-- Ajouter un champ archived_at
ALTER TABLE treatments ADD COLUMN archived_at TIMESTAMP;

-- Trigger sur UPDATE is_active
CREATE OR REPLACE FUNCTION handle_treatment_archive()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = false AND OLD.is_active = true THEN
    -- Marquer la date d'archivage
    NEW.archived_at = NOW();
    
    -- Annuler les visites pharmacie futures
    UPDATE pharmacy_visits
    SET is_completed = true, notes = 'Annulée - Traitement archivé'
    WHERE treatment_id = NEW.id
      AND visit_date >= CURRENT_DATE
      AND is_completed = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Interface** :
- Ajouter une section "Traitements archivés" dans la page Traitements
- Badge "Archivé" sur toutes les prises archivées (grises + lock icon)
- Permettre la consultation en lecture seule de l'historique

---

### 2. **Code Dupliqué**

**Impact** :
- Incohérences entre pages
- Maintenance difficile
- Risque de bugs lors des modifications

**Fichiers à Créer** :
```
src/lib/
  ├── sortingUtils.ts      (tri prises, medications, treatments)
  ├── groupingUtils.ts     (groupement par traitement)
  ├── dateUtils.ts         (✅ existe déjà, bien fait)
  └── filterUtils.ts       (filtres is_active, date ranges)
```

---

### 3. **Hooks Sans Filtre `is_active`**

**Hooks Concernés** :
- ⚠️ `useMissedIntakesDetection`
- ⚠️ `useAdherenceStats`

**Impact** :
- Détection de prises manquées sur traitements archivés
- Stats d'observance faussées

---

### 4. **Modification des Horaires Non Gérée**

**Situation** :
- Médicament avec times = ["09:00", "13:00", "20:00"]
- Utilisateur modifie → times = ["09:00", "20:00"] (supprime midi)
- Hook régénère uniquement ce qui manque
- Résultat : La prise de 13:00 reste à jamais en base (orpheline)

**Solution Recommandée** :
Créer un trigger `ON UPDATE medications.times` qui :
1. Supprime les prises futures dont l'horaire n'existe plus
2. Appelle `regenerate_future_intakes()`

---

## 📊 Matrice de Dépendances

| Fonction/Hook | Index.tsx | Calendar.tsx | History.tsx | Treatments.tsx | useAutoRegenerate |
|---------------|-----------|--------------|-------------|----------------|-------------------|
| Filtre is_active | ✅ | ✅ | ✅ | ❌ (normal) | ✅ |
| Tri par horaire | ✅ (×2) | ❌ | ❌ | ✅ | - |
| Tri par start_date | ✅ | ✅ | - | ❌ | - |
| Groupement traitement | ✅ (×2) | - | - | - | - |
| Conversion timezone | ✅ | ✅ | ✅ | ✅ | - |
| Calcul QSP | ✅ | - | ✅ | ✅ | - |

---

## 🎯 Plan d'Action Recommandé

### Phase 1 : Centralisation (Urgent)
1. Créer `src/lib/sortingUtils.ts`
2. Créer `src/lib/groupingUtils.ts`
3. Créer `src/lib/filterUtils.ts`
4. Refactoriser toutes les pages pour utiliser ces utils

### Phase 2 : Traitements Archivés (Critique)
1. Ajouter `archived_at` sur `treatments`
2. Créer trigger d'archivage
3. Annuler visites pharmacie futures
4. Ajouter section "Traitements archivés" dans l'interface
5. Badge "Archivé" sur les prises

### Phase 3 : Hooks (Important)
1. Corriger `useMissedIntakesDetection` avec filtre is_active
2. Corriger `useAdherenceStats` avec filtre is_active
3. Créer trigger `ON UPDATE medications.times`

### Phase 4 : Tests (Essentiel)
1. Tester archivage d'un traitement en cours
2. Tester modification des horaires d'un médicament
3. Tester régénération automatique
4. Tester stats d'observance avec/sans archivés

---

## 📝 Conclusion

L'application fonctionne mais souffre de :
- ❌ Code dupliqué (risque d'incohérence)
- ❌ Gestion incomplète des traitements archivés
- ❌ Hooks qui incluent les traitements archivés dans les calculs
- ❌ Pas de gestion des modifications d'horaires

**Priorité 1** : Gérer correctement les traitements archivés
**Priorité 2** : Centraliser le code dupliqué
**Priorité 3** : Corriger les hooks de statistiques
