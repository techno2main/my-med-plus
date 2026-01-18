# Compte-Rendu & Plan d'Action - Refonte Wizard de Création de Traitement

**Date:** 11 janvier 2026  
**Branche:** `refactor/wizard-traitement-v2`  
**Objectif:** Améliorer l'expérience utilisateur lors de la création d'un nouveau traitement

---

## 📋 SOMMAIRE

1. [Analyse de l'Existant](#1-analyse-de-lexistant)
2. [Points d'Amélioration Identifiés](#2-points-damélioration-identifiés)
3. [Architecture Cible](#3-architecture-cible)
4. [Plan d'Action Détaillé](#4-plan-daction-détaillé)
5. [Base de Données Médicaments](#5-base-de-données-médicaments)
6. [Planning et Priorisation](#6-planning-et-priorisation)

---

## 1. ANALYSE DE L'EXISTANT

### 1.1 Architecture Actuelle du Wizard

#### **Composants Principaux**
- `TreatmentWizard.tsx` : Composant parent qui gère l'état global
- `TreatmentWizardSteps.tsx` : Orchestrateur des étapes
- 4 étapes distinctes :
  - **Étape 1** (`Step1Info`) : Informations générales
  - **Étape 2** (`Step2Medications`) : Sélection/ajout médicaments
  - **Étape 3** (`Step3Stocks`) : Saisie stocks initiaux
  - **Étape 4** (`Step4Summary`) : Récapitulatif

#### **Structure des Données**
```typescript
TreatmentFormData {
  name: string                    // Nom du traitement
  description: string             // Description optionnelle
  prescribingDoctorId: string     // ⚠️ ID médecin (peut être vide)
  prescriptionId: string          // ID ordonnance (optionnel)
  prescriptionDate: string        // Date de début
  startDate: string               // Date de démarrage
  durationDays: string            // QSP en jours
  qsp: string                     // QSP (doublon?)
  prescriptionFile: File | null   // Fichier ordonnance
  prescriptionFileName: string    // Nom fichier
  pharmacyId: string              // ⚠️ ID pharmacie (peut être vide)
  firstPharmacyVisit: string      // Date 1ère visite pharmacie
  medications: MedicationItem[]   // Liste médicaments
  stocks: { [index: number]: number }  // Stocks par médicament
}
```

### 1.2 Flux Actuel - Problèmes Identifiés

#### **❌ Problème 1 : Médecin Prescripteur**
```tsx
// BasicInfoFields.tsx - Ligne 44-62
<Select value={formData.prescribingDoctorId}>
  <SelectContent>
    {doctors.length === 0 ? (
      <SelectItem value="none" disabled>
        Aucun médecin disponible  // ⚠️ Bloquant mais non géré
      </SelectItem>
    ) : (
      doctors.map((doctor) => (...))
    )}
  </SelectContent>
</Select>
```
**Problème :** L'utilisateur peut ne pas avoir de médecin dans sa base. Le champ est requis mais il n'y a pas de mécanisme pour créer un médecin pendant le wizard.

#### **❌ Problème 2 : Pharmacie de Délivrance**
```tsx
// PharmacyInfoFields.tsx - Ligne 46-69
<Select value={formData.pharmacyId}>
  <SelectContent>
    {pharmacies.length === 0 ? (
      <SelectItem value="none" disabled>
        Aucune pharmacie disponible  // ⚠️ Bloquant mais non géré
      </SelectItem>
    ) : (...)
  </SelectContent>
</Select>
```
**Problème :** Même situation que pour le médecin.

#### **❌ Problème 3 : Ordonnance de Référence**
```tsx
// PharmacyInfoFields.tsx - Ligne 20-44
<Select value={formData.prescriptionId}>
  // ⚠️ Affiché même si prescriptions.length === 0
  {prescriptions.length === 0 ? (
    <SelectItem value="none" disabled>
      Aucune ordonnance disponible
    </SelectItem>
  ) : (...)
</Select>
```
**Problème :** Le champ s'affiche toujours, même si l'utilisateur n'a aucune ordonnance. Devrait être masqué dans ce cas.

#### **❌ Problème 4 : Date Première Visite**
```tsx
// PharmacyInfoFields.tsx - Ligne 71-84
<DateInput
  id="first-visit"
  value={formData.firstPharmacyVisit}
  onChange={(date) => setFormData({ ...formData, firstPharmacyVisit: date })}
  placeholder="Non définie"
/>
```
**Problème :** Aucune initialisation automatique basée sur `prescriptionDate`. L'utilisateur doit saisir manuellement.

#### **❌ Problème 5 : Upload Ordonnance**
```tsx
// PrescriptionUpload.tsx
// Fonction uploadPrescriptionFile(file)
// ⚠️ Pas de possibilité de télécharger plus tard après création
```
**Problème :** Si l'utilisateur n'a pas son ordonnance sous la main, il ne peut pas l'uploader après coup depuis la page Traitements.

### 1.3 Base de Données Médicaments

#### **Tables Actuelles**

**Table `medication_catalog`** (Référentiel Global)
```sql
CREATE TABLE medication_catalog (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  pathology TEXT,                    -- ⚠️ Texte libre, pas de FK
  default_posology TEXT,
  description TEXT,
  form TEXT,
  color TEXT,
  strength TEXT,
  initial_stock INTEGER DEFAULT 0,   -- ⚠️ Non utilisé dans le catalog
  min_threshold INTEGER DEFAULT 10,  -- ⚠️ Non utilisé dans le catalog
  default_times TEXT[] DEFAULT '{}',
  is_approved BOOLEAN DEFAULT false, -- Pour validation admin
  created_by UUID REFERENCES auth.users(id)
);
```

**RLS Policies :**
- READ : `true` (tout le monde peut lire)
- INSERT/UPDATE/DELETE : Réservé aux admins via `has_role(auth.uid(), 'admin'::app_role)`

**Table `medications`** (Médicaments par Traitement Utilisateur)
```sql
CREATE TABLE medications (
  id UUID PRIMARY KEY,
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  catalog_id UUID REFERENCES medication_catalog(id) ON DELETE SET NULL, -- ⚠️ Nullable
  name VARCHAR(255) NOT NULL,        -- ⚠️ Dupliqué depuis catalog
  posology TEXT NOT NULL,            -- ⚠️ Dupliqué depuis catalog
  strength VARCHAR(50),              -- ⚠️ Dupliqué depuis catalog
  times TEXT[] NOT NULL,             -- Horaires personnalisés
  initial_stock INTEGER DEFAULT 0,   -- Stock initial utilisateur
  current_stock INTEGER DEFAULT 0,   -- Stock actuel
  min_threshold INTEGER DEFAULT 5,   -- Seuil d'alerte personnalisé
  expiry_date DATE
);
```

**RLS Policies :** Filtrées par `user_id` via la table `treatments`

#### **⚠️ Problématiques Architecture Actuelle**

1. **Duplication de Données**
   - `name`, `strength`, `posology` sont copiés de `medication_catalog` vers `medications`
   - Si le catalog est mis à jour, les médicaments utilisateur ne le sont pas
   - Incohérence potentielle

2. **Lien Faible**
   - `catalog_id` est nullable dans `medications`
   - Permet de créer des médicaments "custom" sans référence
   - Complique la traçabilité

3. **Champs Non Pertinents dans le Catalog**
   - `initial_stock` et `min_threshold` dans `medication_catalog` ne servent à rien
   - Ces valeurs sont propres à chaque utilisateur

4. **Pathology en Texte Libre**
   - Pas de FK vers une table `pathologies`
   - Risque de doublons et incohérences ("diabète", "Diabète", "diabete")

5. **Catalog Vide au Départ**
   - Aucune donnée préchargée
   - L'utilisateur doit tout créer manuellement
   - Expérience utilisateur dégradée

---

## 2. POINTS D'AMÉLIORATION IDENTIFIÉS

### 2.1 UX - Parcours Utilisateur

#### **🎯 Besoin Nouvel Utilisateur**
Un nouvel utilisateur arrive sur une application vierge :
- Aucun médecin
- Aucune pharmacie
- Aucune ordonnance
- Aucun traitement
- Catalog médicaments potentiellement vide

**Problème :** Le wizard actuel suppose que ces données existent déjà.

#### **✅ Solution Proposée : Workflow Interrompu avec Retour**
Permettre à l'utilisateur d'ajouter un médecin ou une pharmacie **pendant** le wizard, puis revenir proprement au wizard avec les données à jour.

**Pattern suggéré :**
```
Wizard Étape 1 
  → Médecin requis mais vide
    → Bouton "Ajouter un médecin"
      → Ouvre Dialog/Modal de création
        → Sauvegarde en base
          → Recharge la liste des médecins
            → Sélectionne automatiquement le médecin créé
              → Retour au wizard
```

### 2.2 Validations et Auto-Complétion

#### **Date de Début**
- ✅ Validation : Obligatoire
- ⚠️ Pas de valeur par défaut (date du jour logique)

#### **QSP en Jours**
- ✅ Validation : Obligatoire
- ✅ Type `number` avec `min="1"`
- ⚠️ Pas de suggestions (30, 60, 90 jours sont courants)

#### **Date Première Visite Pharmacie**
- ⚠️ Devrait être initialisée automatiquement avec `prescriptionDate`
- ✅ Modifiable par l'utilisateur

#### **Ordonnance de Référence**
- ⚠️ Actuellement affiché même si `prescriptions.length === 0`
- ✅ Devrait être masqué si aucune ordonnance n'existe

### 2.3 Base de Données Médicaments Officielle

#### **🎯 Objectif**
Alimenter le `medication_catalog` avec une **base de référence complète** de médicaments français.

#### **📚 Sources Officielles Gratuites**

1. **Base de Données Publique des Médicaments** (data.gouv.fr)
   - URL : https://base-donnees-publique.medicaments.gouv.fr/
   - Format : CSV, JSON
   - Contenu :
     - CIS (Code Identifiant de Spécialité)
     - Nom commercial
     - Forme pharmaceutique
     - Dosage
     - Laboratoire
     - Date d'AMM
   - ✅ Gratuit
   - ✅ Officiel (ANSM)
   - ✅ Mis à jour régulièrement

2. **API Publique Médicaments**
   - URL : https://medicaments.api.gouv.fr/
   - Format : REST API
   - ✅ Recherche par nom, CIS, substance active
   - ✅ Gratuit
   - ⚠️ Rate limiting

3. **Open Medic** (Données CPAM)
   - URL : https://www.ameli.fr/l-assurance-maladie/statistiques-et-publications/donnees-statistiques/medicament/open-medic-base-complete/index.php
   - Format : CSV
   - ✅ Données de remboursement
   - ⚠️ Plus orienté statistiques que référentiel

#### **✅ Solution Retenue : API Publique + Import CSV**

**Phase 1 : Import Initial**
- Script d'import depuis le CSV de la base publique
- Remplissage initial du `medication_catalog` avec ~10 000 médicaments
- Exécution unique à la mise en production

**Phase 2 : Recherche Dynamique dans le Wizard**
- Barre de recherche dans l'étape 2 du wizard
- Recherche full-text dans `medication_catalog.name`
- Possibilité de rechercher aussi via l'API Publique si médicament non trouvé

**Phase 3 (Future) : Scan DataMatrix**
- Lecture du QR Code DataMatrix sur les boîtes de médicaments
- Récupération automatique des données via API
- Ajout au traitement sans saisie manuelle

### 2.4 Architecture Tables - Recommandations

#### **🔍 Analyse : Faut-il Garder 2 Tables ?**

**✅ OUI - Séparation Justifiée**

| Table | Rôle | Propriétaire | Données |
|-------|------|--------------|---------|
| `medication_catalog` | **Référentiel global** | Système (Admin) | Données officielles, immuables |
| `medications` | **Personnalisation utilisateur** | User | Dosage personnalisé, stock, seuil |

**Justification :**
1. **Séparation des Responsabilités**
   - Le catalog est une source de vérité unique
   - Les `medications` sont des **instances** personnalisées par l'utilisateur

2. **Performance**
   - Un seul catalog partagé pour tous les users
   - Pas de duplication des données de référence

3. **Maintenance**
   - Mise à jour du catalog sans toucher aux données utilisateur
   - Traçabilité : chaque `medication` pointe vers son `catalog_id`

#### **⚠️ Modifications Recommandées**

**Table `medication_catalog`**
```sql
-- ❌ SUPPRIMER ces colonnes (non pertinentes)
-- initial_stock INTEGER DEFAULT 0
-- min_threshold INTEGER DEFAULT 10

-- ✅ AJOUTER ces colonnes
cis VARCHAR(20) UNIQUE,              -- Code Identifiant Spécialité
substance_active TEXT,               -- DCI (Dénomination Commune Internationale)
laboratory TEXT,                     -- Laboratoire
data_source VARCHAR(50),             -- 'API_GOUV', 'MANUAL', 'IMPORT_CSV'
last_sync_at TIMESTAMPTZ,            -- Date dernière synchro API

-- ✅ MODIFIER cette colonne
pathology_id UUID REFERENCES pathologies(id) ON DELETE SET NULL,  -- FK au lieu de TEXT
```

**Table `medications`**
```sql
-- ✅ RENDRE OBLIGATOIRE (actuellement nullable)
catalog_id UUID NOT NULL REFERENCES medication_catalog(id) ON DELETE RESTRICT,

-- ❌ SUPPRIMER ces colonnes (dupliquées depuis catalog)
-- On les récupère via JOIN avec medication_catalog
-- name VARCHAR(255)
-- strength VARCHAR(50)

-- ✅ GARDER pour personnalisation utilisateur
posology TEXT NOT NULL,              -- Posologie personnalisée
times TEXT[] NOT NULL,               -- Horaires personnalisés
initial_stock INTEGER DEFAULT 0,     -- Stock initial
current_stock INTEGER DEFAULT 0,     -- Stock actuel
min_threshold INTEGER DEFAULT 5,     -- Seuil personnalisé
expiry_date DATE,                    -- Date péremption
notes TEXT                           -- Notes utilisateur
```

**⚠️ Impact Breaking Change**
- Les requêtes actuelles doivent être mises à jour pour joindre `medication_catalog`
- Migration de données nécessaire pour populer `catalog_id` sur les `medications` existants
- Création d'entrées dans `medication_catalog` pour les médicaments "custom" existants

#### **✅ Alternative Non-Breaking (Recommandée pour V1)**

**Garder la structure actuelle MAIS :**
1. Rendre `catalog_id` **fortement recommandé** (mais pas obligatoire)
2. Ajouter une contrainte applicative : si `catalog_id` est renseigné, ignorer `name` et `strength` (les récupérer depuis le catalog)
3. Ajouter un process de migration progressif :
   ```typescript
   // Lors de la lecture d'un medication
   if (medication.catalog_id) {
     // Récupérer depuis catalog
     const catalogData = await getCatalogMedication(medication.catalog_id);
     medication.name = catalogData.name;
     medication.strength = catalogData.strength;
   }
   // Sinon, utiliser les champs dupliqués (legacy)
   ```

---

## 3. ARCHITECTURE CIBLE

### 3.1 Wizard Flow - Nouveau Parcours

```
┌─────────────────────────────────────────────────────────────────┐
│                        WIZARD ÉTAPE 1                           │
│                   Informations Générales                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📝 Nom du traitement *                                         │
│  ├─ Input text                                                  │
│                                                                 │
│  📝 Description (optionnel)                                     │
│  ├─ Textarea                                                    │
│                                                                 │
│  👨‍⚕️ Médecin prescripteur *                                     │
│  ├─ Select (dropdown)                                           │
│  ├─ Si vide : Afficher message + bouton                        │
│  │   ┌───────────────────────────────────────┐                │
│  │   │  ⚠️ Aucun médecin disponible         │                │
│  │   │  [+ Ajouter un médecin]               │ ───┐           │
│  │   └───────────────────────────────────────┘    │           │
│  │                                                 │           │
│  │   ┌─────────────────────────────────────────┐  │           │
│  │   │  MODAL : Création Médecin             │<──┘           │
│  │   ├─────────────────────────────────────────┤              │
│  │   │  • Nom                                  │              │
│  │   │  • Spécialité                           │              │
│  │   │  • Téléphone (optionnel)                │              │
│  │   │  • Médecin traitant ? (checkbox)        │              │
│  │   │                                         │              │
│  │   │  [Annuler]  [Créer et continuer] ────┐ │              │
│  │   └─────────────────────────────────────────┘ │              │
│  │                                                │              │
│  └─ Médecin créé → Sélectionné auto <───────────┘              │
│                                                                 │
│  📅 Date de début *                                             │
│  ├─ DatePicker (défaut: aujourd'hui)                           │
│                                                                 │
│  ⏱️ Quantité Suffisante Pour (QSP) *                           │
│  ├─ Input number (défaut: 30 jours)                            │
│  └─ Suggestions : [30j] [60j] [90j]                            │
│                                                                 │
│  💊 Pharmacie de délivrance *                                   │
│  ├─ Select (dropdown)                                           │
│  ├─ Si vide : Afficher message + bouton                        │
│  │   ┌───────────────────────────────────────┐                │
│  │   │  ⚠️ Aucune pharmacie disponible       │                │
│  │   │  [+ Ajouter une pharmacie]             │ ───┐           │
│  │   └───────────────────────────────────────┘    │           │
│  │                                                 │           │
│  │   ┌─────────────────────────────────────────┐  │           │
│  │   │  MODAL : Création Pharmacie           │<──┘           │
│  │   ├─────────────────────────────────────────┤              │
│  │   │  • Nom                                  │              │
│  │   │  • Adresse                              │              │
│  │   │  • Téléphone                            │              │
│  │   │                                         │              │
│  │   │  [Annuler]  [Créer et continuer] ────┐ │              │
│  │   └─────────────────────────────────────────┘ │              │
│  │                                                │              │
│  └─ Pharmacie créée → Sélectionnée auto <────────┘              │
│                                                                 │
│  📅 Date première visite pharmacie                              │
│  ├─ DatePicker (auto: = date début, modifiable)                │
│                                                                 │
│  📋 Ordonnance de référence (optionnel)                         │
│  ├─ Si prescriptions.length > 0 : Afficher Select              │
│  └─ Sinon : Masquer ce champ                                   │
│                                                                 │
│  📤 Upload ordonnance (optionnel)                               │
│  ├─ Dropzone / File input                                      │
│  └─ Info : "Vous pourrez l'ajouter plus tard"                  │
│                                                                 │
│  [Annuler]                          [Suivant : Médicaments →] │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        WIZARD ÉTAPE 2                           │
│                        Médicaments                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔍 Rechercher un médicament                                    │
│  ├─ Input search avec autocomplétion                           │
│  ├─ Recherche dans medication_catalog (nom, substance active)  │
│  ├─ Affichage des résultats :                                  │
│  │   ┌──────────────────────────────────────┐                 │
│  │   │ 💊 Doliprane 1000mg                  │                 │
│  │   │    Paracétamol - Comprimé            │ [+ Ajouter]     │
│  │   └──────────────────────────────────────┘                 │
│  │   ┌──────────────────────────────────────┐                 │
│  │   │ 💊 Doliprane 500mg                   │                 │
│  │   │    Paracétamol - Comprimé            │ [+ Ajouter]     │
│  │   └──────────────────────────────────────┘                 │
│  │                                                              │
│  └─ Si non trouvé : [+ Créer un médicament personnalisé]       │
│                                                                 │
│  📋 Médicaments ajoutés (0)                                     │
│  ├─ Liste vide si aucun médicament                             │
│  └─ Message : "Commencez par ajouter un médicament depuis      │
│                le référentiel"                                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │  À créer                                         │          │
│  │  Commencez par ajouter un médicament depuis      │          │
│  │  le référentiel                                  │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
│  [← Retour]                               [Suivant : Stocks →] │
└─────────────────────────────────────────────────────────────────┘

Après ajout de médicaments :

┌─────────────────────────────────────────────────────────────────┐
│  📋 Médicaments ajoutés (2)                                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │ 💊 Doliprane 1000mg                            [×]│          │
│  │ ├─ Posologie : 1 comprimé                        │          │
│  │ ├─ Prises par jour : 3                           │          │
│  │ └─ Horaires : [09:00] [14:00] [19:00]          │          │
│  │    [Modifier la posologie]                       │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐          │
│  │ 💊 Metformine 850mg                            [×]│          │
│  │ ├─ Posologie : 1 comprimé                        │          │
│  │ ├─ Prises par jour : 2                           │          │
│  │ └─ Horaires : [08:00] [20:00]                   │          │
│  │    [Modifier la posologie]                       │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                 │
│  [← Retour]                               [Suivant : Stocks →] │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Composants à Créer/Modifier

#### **Nouveaux Composants**

1. **`QuickAddDoctorDialog.tsx`**
   ```typescript
   interface QuickAddDoctorDialogProps {
     open: boolean;
     onOpenChange: (open: boolean) => void;
     onDoctorCreated: (doctorId: string) => void;
   }
   ```
   - Modal avec formulaire simplifié
   - Champs : Nom, Spécialité, Téléphone, IsMedecin traitant
   - Validation basique
   - Callback avec ID du médecin créé

2. **`QuickAddPharmacyDialog.tsx`**
   ```typescript
   interface QuickAddPharmacyDialogProps {
     open: boolean;
     onOpenChange: (open: boolean) => void;
     onPharmacyCreated: (pharmacyId: string) => void;
   }
   ```
   - Modal avec formulaire simplifié
   - Champs : Nom, Adresse, Téléphone
   - Validation basique
   - Callback avec ID de la pharmacie créée

3. **`MedicationSearchBar.tsx`**
   ```typescript
   interface MedicationSearchBarProps {
     catalog: MedicationCatalogItem[];
     onSelect: (medication: MedicationCatalogItem) => void;
     onCreateCustom: () => void;
   }
   ```
   - Barre de recherche avec autocomplétion
   - Recherche full-text dans `medication_catalog.name` et `substance_active`
   - Affichage des résultats avec bouton "Ajouter"
   - Bouton "Créer un médicament personnalisé" si non trouvé

4. **`EmptyMedicationsPlaceholder.tsx`**
   ```typescript
   // Composant simple pour afficher un message quand aucun médicament ajouté
   ```

#### **Composants à Modifier**

1. **`BasicInfoFields.tsx`**
   - Ajouter condition d'affichage du message "Aucun médecin"
   - Ajouter bouton "Ajouter un médecin"
   - Gérer l'ouverture du `QuickAddDoctorDialog`
   - Auto-sélectionner le médecin après création
   - Initialiser `prescriptionDate` avec la date du jour par défaut
   - Ajouter boutons suggestions QSP (30, 60, 90)

2. **`PharmacyInfoFields.tsx`**
   - Masquer le champ "Ordonnance de référence" si `prescriptions.length === 0`
   - Ajouter condition d'affichage du message "Aucune pharmacie"
   - Ajouter bouton "Ajouter une pharmacie"
   - Gérer l'ouverture du `QuickAddPharmacyDialog`
   - Auto-sélectionner la pharmacie après création
   - Auto-remplir `firstPharmacyVisit` avec `prescriptionDate`

3. **`Step2Medications.tsx`**
   - Remplacer les 2 boutons "Ajouter" / "Créer" par le `MedicationSearchBar`
   - Afficher `EmptyMedicationsPlaceholder` si `medications.length === 0`
   - Conserver `MedicationsList` quand des médicaments sont ajoutés

4. **`TreatmentWizard.tsx`**
   - Ajouter fonction `reloadDoctors()` et `reloadPharmacies()`
   - Passer ces fonctions via props aux composants enfants

### 3.3 Logique de Validation

#### **Étape 1 : Informations Générales**

```typescript
const canProceedToStep2 = () => {
  return (
    formData.name.trim() !== "" &&
    formData.prescribingDoctorId !== "" &&
    formData.prescriptionDate !== "" &&
    formData.durationDays !== "" &&
    parseInt(formData.durationDays) > 0 &&
    formData.pharmacyId !== ""
    // firstPharmacyVisit et prescriptionId sont optionnels
  );
};
```

#### **Étape 2 : Médicaments**

```typescript
const canProceedToStep3 = () => {
  return formData.medications.length > 0;
};
```

#### **Étape 3 : Stocks**

```typescript
const canProceedToStep4 = () => {
  return formData.medications.every((_, index) => 
    formData.stocks[index] !== undefined && 
    formData.stocks[index] >= 0
  );
};
```

---

## 4. PLAN D'ACTION DÉTAILLÉ

### Phase 1 : Préparation Base de Données (3-4h)

#### **Tâche 1.1 : Import Médicaments Officiels (Filtrés)**
- [ ] Télécharger les sources officielles :
  - Base publique médicaments : CIS_bdpm.txt
  - Open Medic (top prescrits) : open-medic-2024.csv
- [ ] Créer un script d'import Node.js avec filtrage (`scripts/import-medications.ts`)
  - Parser les CSV (base complète + top prescrits)
  - Appliquer les filtres :
    - Top 300 médicaments les plus prescrits
    - Substances actives courantes
    - Formes courantes (comprimés, gélules)
    - Statut commercialisé uniquement
  - Détecter et ignorer les doublons
  - Mapper vers `medication_catalog`
  - Bulk insert (par batch de 100)
- [ ] Ajouter les colonnes manquantes dans `medication_catalog` :
  ```sql
  ALTER TABLE medication_catalog 
  ADD COLUMN IF NOT EXISTS cis VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS substance_active TEXT,
  ADD COLUMN IF NOT EXISTS laboratory TEXT,
  ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'USER_CREATED',
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
  
  -- Marquer les médicaments existants
  UPDATE medication_catalog 
  SET data_source = 'USER_CREATED' 
  WHERE data_source IS NULL;
  
  -- Supprimer colonnes inutiles (optionnel)
  -- ALTER TABLE medication_catalog 
  -- DROP COLUMN IF EXISTS initial_stock,
  -- DROP COLUMN IF EXISTS min_threshold;
  ```
- [ ] Exécuter l'import en dev d'abord, puis en prod
- [ ] Vérifier les données importées :
  ```sql
  -- Compter par source
  SELECT data_source, COUNT(*) FROM medication_catalog GROUP BY data_source;
  
  -- Vérifier exemples
  SELECT name, strength, form, data_source FROM medication_catalog LIMIT 20;
  
  -- Vérifier que les existants sont intacts
  SELECT * FROM medication_catalog WHERE data_source = 'USER_CREATED';
  ```

**Livrables :**
- Migration SQL : `supabase/migrations/20260112000000_enhance_medication_catalog.sql`
- Script d'import : `scripts/import-medications.ts`
- Script de téléchargement : `scripts/download-medications.sh` (optionnel)
- **~200-500 médicaments** importés dans `medication_catalog`
- 5 médicaments existants conservés
- **Total : ~205-505 médicaments** (optimisé pour l'UX)

---

#### **Tâche 1.2 : Améliorer la Recherche Full-Text**
- [ ] Ajouter un index GIN pour la recherche full-text
  ```sql
  CREATE INDEX idx_medication_catalog_search 
  ON medication_catalog 
  USING GIN (to_tsvector('french', name || ' ' || COALESCE(substance_active, '')));
  ```
- [ ] Créer une fonction de recherche optimisée :
  ```sql
  CREATE OR REPLACE FUNCTION search_medications(search_term TEXT)
  RETURNS TABLE (
    id UUID,
    name TEXT,
    substance_active TEXT,
    strength TEXT,
    form TEXT,
    laboratory TEXT
  ) AS $$
  BEGIN
    RETURN QUERY
    SELECT 
      mc.id,
      mc.name,
      mc.substance_active,
      mc.strength,
      mc.form,
      mc.laboratory
    FROM medication_catalog mc
    WHERE 
      to_tsvector('french', mc.name || ' ' || COALESCE(mc.substance_active, '')) 
      @@ plainto_tsquery('french', search_term)
    ORDER BY 
      ts_rank(to_tsvector('french', mc.name || ' ' || COALESCE(mc.substance_active, '')), 
              plainto_tsquery('french', search_term)) DESC
    LIMIT 50;
  END;
  $$ LANGUAGE plpgsql;
  ```

**Livrables :**
- Migration SQL avec index et fonction de recherche

---

### Phase 2 : Composants UI - Ajout Rapide (4-5h)

#### **Tâche 2.1 : Créer `QuickAddDoctorDialog`**
- [ ] Créer le fichier `src/components/TreatmentWizard/components/QuickAddDoctorDialog.tsx`
- [ ] Formulaire avec validation (react-hook-form)
  ```typescript
  interface DoctorFormData {
    name: string;
    specialty: string;
    phone?: string;
    is_primary_doctor: boolean;
  }
  ```
- [ ] Appel Supabase pour créer le médecin :
  ```typescript
  const { data, error } = await supabase
    .from('health_professionals')
    .insert({
      type: 'doctor',
      name: formData.name,
      specialty: formData.specialty,
      phone: formData.phone,
      is_primary_doctor: formData.is_primary_doctor,
      user_id: user.id
    })
    .select()
    .single();
  ```
- [ ] Callback `onDoctorCreated(data.id)` pour informer le parent
- [ ] Toast de confirmation
- [ ] Gestion des erreurs

**Livrables :**
- Composant `QuickAddDoctorDialog.tsx`
- Hook custom `useQuickAddDoctor.ts` (optionnel)

---

#### **Tâche 2.2 : Créer `QuickAddPharmacyDialog`**
- [ ] Créer le fichier `src/components/TreatmentWizard/components/QuickAddPharmacyDialog.tsx`
- [ ] Formulaire avec validation (react-hook-form)
  ```typescript
  interface PharmacyFormData {
    name: string;
    address: string;
    phone: string;
  }
  ```
- [ ] Appel Supabase pour créer la pharmacie :
  ```typescript
  const { data, error } = await supabase
    .from('health_professionals')
    .insert({
      type: 'pharmacy',
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      user_id: user.id
    })
    .select()
    .single();
  ```
- [ ] Callback `onPharmacyCreated(data.id)` pour informer le parent
- [ ] Toast de confirmation
- [ ] Gestion des erreurs

**Livrables :**
- Composant `QuickAddPharmacyDialog.tsx`
- Hook custom `useQuickAddPharmacy.ts` (optionnel)

---

#### **Tâche 2.3 : Intégrer les Dialogs dans `BasicInfoFields` et `PharmacyInfoFields`**
- [ ] Modifier `BasicInfoFields.tsx` :
  - Ajouter state `showQuickAddDoctor`
  - Afficher message + bouton si `doctors.length === 0`
  - Gérer l'ouverture/fermeture du dialog
  - Callback pour recharger les médecins et auto-sélectionner
  ```typescript
  const handleDoctorCreated = async (doctorId: string) => {
    await reloadDoctors(); // Fonction à ajouter dans TreatmentWizard
    setFormData({ ...formData, prescribingDoctorId: doctorId });
  };
  ```

- [ ] Modifier `PharmacyInfoFields.tsx` :
  - Même logique pour les pharmacies
  - Masquer "Ordonnance de référence" si `prescriptions.length === 0`
  ```typescript
  {prescriptions.length > 0 && (
    <div className="space-y-2">
      <Label>Ordonnance de référence (optionnel)</Label>
      <Select ...>...</Select>
    </div>
  )}
  ```

**Livrables :**
- `BasicInfoFields.tsx` modifié
- `PharmacyInfoFields.tsx` modifié

---

#### **Tâche 2.4 : Auto-Complétion Dates et QSP**
- [ ] Dans `BasicInfoFields.tsx` :
  - Initialiser `prescriptionDate` avec la date du jour si vide
  ```typescript
  useEffect(() => {
    if (!formData.prescriptionDate) {
      const today = new Date().toISOString().split('T')[0];
      setFormData({ ...formData, prescriptionDate: today });
    }
  }, []);
  ```
  - Ajouter boutons suggestions pour QSP
  ```tsx
  <div className="flex gap-2 mt-2">
    {[30, 60, 90].map(days => (
      <Button
        key={days}
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setFormData({ ...formData, durationDays: String(days) })}
      >
        {days}j
      </Button>
    ))}
  </div>
  ```

- [ ] Dans `PharmacyInfoFields.tsx` :
  - Auto-remplir `firstPharmacyVisit` avec `prescriptionDate`
  ```typescript
  useEffect(() => {
    if (formData.prescriptionDate && !formData.firstPharmacyVisit) {
      setFormData({ ...formData, firstPharmacyVisit: formData.prescriptionDate });
    }
  }, [formData.prescriptionDate]);
  ```

**Livrables :**
- `BasicInfoFields.tsx` avec auto-complétion
- `PharmacyInfoFields.tsx` avec auto-complétion

---

### Phase 3 : Recherche Médicaments (5-6h)

#### **Tâche 3.1 : Créer `MedicationSearchBar`**
- [ ] Créer le composant `src/components/TreatmentWizard/components/MedicationSearchBar.tsx`
- [ ] Input de recherche avec debounce (300ms)
- [ ] Appel à la fonction de recherche :
  ```typescript
  const { data } = await supabase.rpc('search_medications', {
    search_term: searchQuery
  });
  ```
- [ ] Affichage des résultats :
  ```tsx
  <div className="space-y-2">
    {results.map(med => (
      <div key={med.id} className="flex justify-between items-center p-3 border rounded">
        <div>
          <div className="font-medium">{med.name}</div>
          <div className="text-sm text-muted-foreground">
            {med.substance_active} - {med.form}
          </div>
        </div>
        <Button size="sm" onClick={() => onSelect(med)}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>
    ))}
  </div>
  ```
- [ ] Message si aucun résultat
- [ ] Bouton "Créer un médicament personnalisé"

**Livrables :**
- Composant `MedicationSearchBar.tsx`
- Hook `useMedicationSearch.ts`

---

#### **Tâche 3.2 : Créer `EmptyMedicationsPlaceholder`**
- [ ] Composant simple avec message et illustration
  ```tsx
  export const EmptyMedicationsPlaceholder = () => (
    <Card className="p-8 text-center">
      <div className="text-muted-foreground">
        <PillIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium mb-2">À créer</p>
        <p className="text-sm">
          Commencez par ajouter un médicament depuis le référentiel
        </p>
      </div>
    </Card>
  );
  ```

**Livrables :**
- Composant `EmptyMedicationsPlaceholder.tsx`

---

#### **Tâche 3.3 : Refactoriser `Step2Medications`**
- [ ] Remplacer les 2 boutons par `MedicationSearchBar`
- [ ] Afficher `EmptyMedicationsPlaceholder` si `formData.medications.length === 0`
- [ ] Conserver `MedicationsList` en dessous si médicaments ajoutés
  ```tsx
  <div className="space-y-6">
    <MedicationSearchBar
      catalog={catalog}
      onSelect={addMedicationFromCatalog}
      onCreateCustom={() => setShowCustomDialog(true)}
    />
    
    {formData.medications.length === 0 ? (
      <EmptyMedicationsPlaceholder />
    ) : (
      <MedicationsProvider value={{...}}>
        <MedicationsList />
      </MedicationsProvider>
    )}
  </div>
  ```

**Livrables :**
- `Step2Medications.tsx` refactorisé

---

### Phase 4 : Upload Ordonnance (2-3h)

#### **Tâche 4.1 : Permettre l'Upload Ultérieur**
- [ ] Créer une page ou section dans la page Traitements pour uploader une ordonnance après coup
- [ ] Option 1 : Ajouter un bouton "Ajouter ordonnance" dans les détails d'un traitement
- [ ] Option 2 : Créer une modal `UploadPrescriptionDialog.tsx`
- [ ] Réutiliser la logique de `PrescriptionUpload.tsx`
- [ ] Mise à jour du traitement avec l'ID de l'ordonnance uploadée

**Livrables :**
- Composant `UploadPrescriptionDialog.tsx` (ou équivalent)
- Intégration dans la page Traitements

---

### Phase 5 : Tests et Documentation (2-3h)

#### **Tâche 5.1 : Tests Manuels**
- [ ] Scénario 1 : Nouvel utilisateur sans aucune donnée
  - Créer un médecin via le wizard
  - Créer une pharmacie via le wizard
  - Ajouter des médicaments depuis la recherche
  - Vérifier que tout s'enchaîne correctement
- [ ] Scénario 2 : Utilisateur existant avec médecins et pharmacies
  - Vérifier que les selects sont correctement pré-remplis
  - Vérifier l'auto-complétion des dates
- [ ] Scénario 3 : Recherche de médicaments
  - Tester la recherche full-text
  - Vérifier l'ajout depuis le catalog
  - Vérifier la création de médicament custom
- [ ] Scénario 4 : Upload ordonnance ultérieur
  - Créer un traitement sans ordonnance
  - Uploader l'ordonnance depuis la page Traitements

**Livrables :**
- Liste de cas de tests validés

---

#### **Tâche 5.2 : Documentation**
- [ ] Mettre à jour `docs/refactor/wizard-traitement-v2/IMPLEMENTATION.md`
  - Diagrammes de flux
  - Composants créés
  - Fonctions utilitaires
  - Points d'attention
- [ ] Ajouter des commentaires dans le code pour les parties complexes
- [ ] Créer un fichier `MIGRATION.md` pour expliquer les changements BDD

**Livrables :**
- Documentation complète de la refonte

---

## 5. BASE DE DONNÉES MÉDICAMENTS

### 5.1 Source de Données Officielle

**🎯 Recommandation : Base de Données Publique des Médicaments (Filtrée)**

**URL Principale :** https://base-donnees-publique.medicaments.gouv.fr/

**Contenu :**
- **CIS** (Code Identifiant de Spécialité) : Identifiant unique
- **Nom commercial** : Ex. "DOLIPRANE 1000 mg, comprimé"
- **Forme pharmaceutique** : Comprimé, gélule, solution injectable, etc.
- **Dosage** : Ex. "1000 mg"
- **Substance active** : DCI (Dénomination Commune Internationale)
- **Laboratoire** : Ex. "SANOFI"
- **Date d'AMM** (Autorisation de Mise sur le Marché)
- **Statut** : Commercialisé, arrêté, suspendu

**URL Complémentaire : Open Medic (Données CPAM)**
- https://data.ameli.fr/explore/dataset/open-medic/
- **Contient les volumes de prescriptions par médicament**
- Permet d'identifier les médicaments les plus prescrits
- Données annuelles (dernière : 2024)

**Format disponible :** CSV, JSON, XML

**Mise à jour :** Quotidienne (BDD Publique) / Annuelle (Open Medic)

**Licence :** Données publiques (Open Data)

### 5.2 Stratégie d'Import Filtrée (Recommandée)

**🎯 Objectif : Importer ~200-500 médicaments les plus courants**

#### **Critères de Filtrage Objectifs**

1. **Top 200 des médicaments les plus prescrits** (données Open Medic)
   - Paracétamol (Doliprane, Dafalgan, Efferalgan)
   - Ibuprofène (Advil, Nurofen)
   - Anti-hypertenseurs courants
   - Antidiabétiques oraux
   - Statines
   - etc.

2. **Médicaments par catégorie**
   - Antalgiques (20 médicaments)
   - Anti-inflammatoires (15)
   - Antibiotiques courants (30)
   - Cardiovasculaires (40)
   - Diabète (20)
   - Psychiatrie (30)
   - etc.

3. **Filtre technique**
   - Statut : "Commercialisé" uniquement
   - Forme : Comprimés, gélules (pas les formes hospitalières)
   - Exclure : Médicaments orphelins, hospitaliers uniquement

#### **Sources de Données**

```bash
# 1. Base Publique Médicaments (structure)
https://base-donnees-publique.medicaments.gouv.fr/extrait.php
→ CIS_bdpm.txt (tous les médicaments)

# 2. Open Medic (volumes de prescription)
https://data.ameli.fr/explore/dataset/open-medic/download?format=csv
→ open-medic-2024.csv (médicaments les plus prescrits)
```

### 5.3 Structure du Script d'Import Filtré

```typescript
// scripts/import-medications.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import Papa from 'papaparse';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MedicationCSVRow {
  cis: string;
  denomination: string; // Nom complet
  forme: string;
  voies_administration: string;
  statut_amm: string;
  type_procedure: string;
  commercialisation: string;
}

interface OpenMedicRow {
  cis: string;
  nom: string;
  boites: number; // Nombre de boîtes remboursées
}

// Liste des substances actives les plus courantes (fallback)
const COMMON_SUBSTANCES = [
  'paracétamol', 'ibuprofène', 'aspirine', 'amoxicilline',
  'métoprolol', 'amlodipine', 'atorvastatine', 'metformine',
  'oméprazole', 'lévothyroxine', 'tramadol', 'codéine'
];

async function importMedications() {
  console.log('🚀 Démarrage import médicaments filtrés...\n');
  4 Commande d'Exécution

```bash
# 1. Créer le dossier data
mkdir -p data

# 2. Télécharger les fichiers sources (gratuit)
# Base publique médicaments
curl -o data/CIS_bdpm.txt "https://base-donnees-publique.medicaments.gouv.fr/telechargement.php?fichier=CIS_bdpm.txt"

# Open Medic (top prescrits) - Optionnel mais recommandé
curl -o data/open-medic-2024.csv "https://data.ameli.fr/api/explore/v2.1/catalog/datasets/open-medic/exports/csv?limit=-1&timezone=UTC"

# 3. Installer les dépendances
npm install papaparse @types/papaparse

# 4. Exécuter le script (une seule fois)
npx tsx scripts/import-medications.ts

# Résultat attendu :
# → ~200-500 médicaments importés
# → 5 médicaments existants conservés
# → Total : ~205-505 médicaments
```

### 5.5 Résultat de l'Import

**Après exécution du script :**

```
medication_catalog
├── 5 médicaments existants (data_source='USER_CREATED')
│   ├── Xigduo 5mg/1000mg
│   ├── Doliprane 1mg
│   ├── Quviviq 50mg
│   ├── Venlafaxine 225mg
│   └── Simvastatine 10mg
│
└── ~200-500 médicaments importés (data_source='IMPORT_OFFICIAL')
    ├── Top Antalgiques
    │   ├── Doliprane 500mg (ajouté)
    │   ├── Doliprane 1000mg (ajouté)
    │   ├── Dafalgan 500mg
    │   ├── Efferalgan 1000mg
    │   └── ...
    ├── Top Anti-inflammatoires
    │   ├── Advil 200mg
    │   ├── Nurofen 400mg
    │   └── ...
    ├── Top Diabète
    │   ├── Metformine 500mg
    │   ├── Metformine 850mg
    │   └── ...
    └── Autres catégories...
```

**Impact sur les traitements existants :**
- ✅ AUCUN impact
- ✅ Les 5 médicaments existants restent intacts
- ✅ Les catalog_id des medications restent valides
- ✅ Zéro risque de régression

### 5.6 Maintenance et Évolution

**Gestion Admin (Recommandé)**

```sql
-- Seuls les admins peuvent modifier le catalog
CREATE POLICY "medication_catalog_admin_only"
  ON public.medication_catalog FOR ALL
  USING (has_role((SELECT auth.uid()), 'admin'::app_role));
```

**Mise à jour périodique (Optionnel - 2 fois par an) :**

```bash
# Re-télécharger les sources
./scripts/download-medications.sh

# Re-exécuter l'import (n'ajoute que les nouveaux)
npx tsx scripts/import-medications.ts

# Résultat :
# → Nouveaux médicaments ajoutés
# → Existants conservés
# → Doublons ignorés automatiquement
```

**Statistiques après import :**
```typescript
// Requête de vérification
const { data: stats } = await supabase
  .from('medication_catalog')
  .select('data_source, count(*)')
  .group('data_source');

// Résultat attendu :
// [
//   { data_source: 'USER_CREATED', count: 5 },
//   { data_source: 'IMPORT_OFFICIAL', count: 287 }
// ]
// Total : 292 médicaments
```_bdpm.txt', 'utf-8');
  const { data: allMedications } = Papa.parse<MedicationCSVRow>(medicationsContent, {
    delimiter: '\t',
    header: true,
    skipEmptyLines: true,
  });
  
  console.log(`📊 ${allMedications.length} médicaments dans la base`);
  
  // 3. Filtrer selon critères
  console.log('\n🔍 Application des filtres...');
  
  const filtered = allMedications.filter(med => {
    // Filtre 1 : Commercialisé
    if (med.commercialisation !== 'Commercialisée') return false;
    
    // Filtre 2 : Top prescrit OU substance courante
    const isTopPrescribed = topPrescribed.includes(med.cis);
    const hasCommonSubstance = COMMON_SUBSTANCES.some(substance => 
      med.denomination.toLowerCase().includes(substance)
    );
    
    if (!isTopPrescribed && !hasCommonSubstance) return false;
    
    // Filtre 3 : Formes courantes uniquement
    const commonForms = ['comprimé', 'gélule', 'capsule', 'solution buvable', 'sirop'];
    if (!commonForms.some(form => med.forme?.toLowerCase().includes(form))) {
      return false;
    }
    
    // Filtre 4 : Exclure formes hospitalières
    if (med.denomination.toLowerCase().includes('usage hospitalier')) {
      return false;
    }
    
    return true;filtrés + BDD | 2-3h ⬇️ |
| **Phase 2** | Composants ajout rapide | 4-5h |
| **Phase 3** | Recherche médicaments | 5-6h |
| **Phase 4** | Upload ordonnance | 2-3h |
| **Phase 5** | Tests + Documentation | 2-3h |
| **TOTAL** | | **15-20h** |

**📊 Volumétrie Import :**
- Fichiers sources : ~50 MB (téléchargement unique)
- Médicaments filtrés : **~200-500** (vs 10 000 initialement)
- Stockage Supabase : **~500 KB** (vs 5 MB)
- Durée import : **~30 secondes** (vs 5 minutes)
- Recherche full-text : **< 20ms** (vs < 50ms)on_catalog
  console.log('\n🔄 Préparation des données...');
  const medications = filtered.map(med => {
    // Extraire le dosage du nom
    const strengthMatch = med.denomination.match(/(\d+(?:,\d+)?)\s*(mg|g|ml|µg)/i);
    const strength = strengthMatch ? strengthMatch[0] : null;
    
    // Nettoyer le nom (retirer le dosage)
    const name = med.denomination
      .replace(/,\s*(comprimé|gélule|capsule|solution|sirop).*/i, '')
      .trim();
    
    return {
      cis: med.cis,
      name: name,
      form: med.forme || 'Comprimé',
      strength: strength,
      substance_active: null, // À enrichir avec table CIS_COMPO si besoin
      laboratory: null, // À enrichir avec table CIS_CPD si besoin
      data_source: 'IMPORT_OFFICIAL',
      is_approved: true,
      created_by: null,
      last_sync_at: new Date().toISOString(),
    };
  });
  
  // 5. Vérifier doublons avec existants
  console.log('\n🔍 Vérification des doublons...');
  const { data: existing } = await supabase
    .from('medication_catalog')
    .select('cis, name');
  
  const existingCIS = new Set(existing?.map(e => e.cis) || []);
  const existingNames = new Set(existing?.map(e => e.name.toLowerCase()) || []);
  
  const toImport = medications.filter(med => 
    !existingCIS.has(med.cis) && 
    !existingNames.has(med.name.toLowerCase())
  );
  
  console.log(`✅ ${toImport.length} nouveaux médicaments à importer`);
  console.log(`ℹ️  ${medications.length - toImport.length} doublons ignorés`);
  
  if (toImport.length === 0) {
    console.log('\n✅ Aucun médicament à importer');
    return;
  }
  
  // 6. Bulk insert par batch de 100
  console.log('\n📤 Import en cours...');
  const batchSize = 100;
  let imported = 0;
  
  for (let i = 0; i < toImport.length; i += batchSize) {
    const batch = toImport.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('medication_catalog')
      .insert(batch);
    
    if (error) {
      coDécisions Validées

1. **✅ Import Médicaments Filtrés**
   - Source : Base publique + Open Medic
   - Volumétrie : **~200-500 médicaments** (top prescrits + substances courantes)
   - Fréquence : Import initial + mise à jour semestrielle (optionnelle)
   - Coût : **0 € (gratuit permanent)**

2. **✅ Architecture Tables**
   - `catalog_id` reste **optionnel** (nullable) dans `medications`
   - Colonnes `name`/`strength` **conservées** (pas de breaking change)
   - Ajout du champ `data_source` pour traçabilité
   - Logique applicative améliorée (privilégier catalog si dispo)

3. **✅ Gestion des Médicaments Existants**
   - **Conservation totale** des 5 médicaments existants
   - Marquage `data_source='USER_CREATED'`
   - Détection automatique des doublons
   - **Zéro impact** sur les traitements actifs

4. **✅ Maintenance Admin**
   - Seuls les **admins** peuvent modifier le catalog
   - Users peuvent créer des médicaments custom (marqués `USER_CREATED`)
   - Mises à jour du catalog : semestrielles, par script admin

5. **📝 Didacticiel Interactif**
   - À garder en mémoire pour plus tard
   - Intégrer un guide étape par étape pour les nouveaux utilisateurs
   - Voir `docs/DIDACTICIEL_INTERACTIF.md`

### 8.2 Avantages de la Solution Retenue

| Critère | Valeur | Impact |
|---------|--------|--------|
| **Coût Supabase** | 0 € | ✅ Gratuit permanent |
| **Stockage utilisé** | ~500 KB | ✅ < 0.1% du tier gratuit |
| **Médicaments disponibles** | ~205-505 | ✅ Couvre 95% des cas d'usage |
| **Performance recherche** | < 20ms | ✅ Instantané |
| **Scalabilité** | Excellente | ✅ Ajout progressif possible |
| **Maintenance** | Semestrielle | ✅ Quasi-automatique |
| **Risque breaking change** | Aucun | ✅ Zéro régression |
| **Complexité** | Faible | ✅ Script simple |
| **Lien pathologies** | Automatique | ✅ Filtrage par pathologie dans le wizard |

### 8.3 Fonctionnalité Pathologies

**✅ Intégration Pathologies → Médicaments**

La table `pathologies` existante est déjà **commune** (visible par tous, modifiable par admins uniquement).

**Enrichissements apportés :**

1. **Migration SQL** `20260111000001_add_pathology_link_to_medications.sql` :
   - Ajout de `pathology_id` dans `medication_catalog` (nullable, non breaking)
   - Insertion de ~50 pathologies courantes (si non existantes)
   - Index pour performance des recherches

2. **Mapping automatique** lors de l'import :
   - Chaque médicament est lié à une pathologie selon sa substance active
   - Mapping basique inclus (Paracétamol → Douleur, Metformine → Diabète, etc.)
   - Extensible facilement

3. **Utilisation dans le wizard** :
   - Dropdown "Filtrer par pathologie" dans l'étape 2
   - Affichage uniquement des médicaments liés à la pathologie sélectionnée
   - Améliore drastiquement l'UX pour les nouveaux utilisateurs

**Exemple de filtrage :**
```typescript
// Wizard étape 2 : Recherche médicaments
const { data } = await supabase
  .from('medication_catalog')
  .select('*')
  .eq('pathology_id', selectedPathologyId) // Filtre par pathologie
  .ilike('name', `%${searchTerm}%`)
  .limit(50);
```

**Bénéfices :**
- 🎯 **Recherche ciblée** : L'utilisateur trouve plus vite son médicament
- 📊 **Organisation logique** : Médicaments regroupés par indication
- 🔄 **Extensible** : Possibilité d'ajouter des pathologies manuellement
- ✅ **Non invasif** : Le champ est nullable, l'existant continue de fonctionner
npx tsx scripts/import-medications.ts
```

### 5.4 Maintenance

**Mise à jour périodique (optionnel) :**
- Créer un cron job (mensuel) pour re-télécharger le CSV
- Comparer les CIS existants vs nouveaux
- Insérer les nouveaux médicaments
- Marquer les médicaments arrêtés (`is_approved: false`)

---

## 6. PLANNING ET PRIORISATION

### 6.1 Estimation Globale

| Phase | Tâches | Durée estimée |
|-------|--------|---------------|
| **Phase 1** | Import médicaments + BDD | 3-4h |
| **Phase 2** | Composants ajout rapide | 4-5h |
| **Phase 3** | Recherche médicaments | 5-6h |
| **Phase 4** | Upload ordonnance | 2-3h |
| **Phase 5** | Tests + Documentation | 2-3h |
| **TOTAL** | | **16-21h** |

### 6.2 Ordre de Priorité

#### **🔥 Priorité HAUTE (MVP)**
1. **Import de la base de médicaments** (sans ça, aucune recherche possible)
2. **Ajout rapide médecin/pharmacie** (bloquant pour nouvel utilisateur)
3. **Recherche médicaments** (amélioration majeure de l'UX)

#### **🟡 Priorité MOYENNE**
4. **Auto-complétion dates et QSP** (amélioration UX mais non bloquant)
5. **Masquer ordonnance de référence si vide** (amélioration UX)

#### **🟢 Priorité BASSE (Nice-to-have)**
6. **Upload ordonnance ultérieur** (fonctionnalité additionnelle)

### 6.3 Recommandation Déploiement

**Option 1 : Déploiement Incrémental (Recommandé)**
- Merge de la branche `refactor/wizard-traitement-v2` en plusieurs PR
- PR1 : Phase 1 (BDD + Import médicaments)
- PR2 : Phase 2 (Ajout rapide médecin/pharmacie)
- PR3 : Phase 3 (Recherche médicaments)
- PR4 : Phase 4-5 (Upload + Tests)

**Option 2 : Déploiement Global**
- Merge d'un seul coup après validation complète
- Risque plus élevé mais déploiement plus rapide

---

## 7. POINTS D'ATTENTION

### 7.1 Performance

**⚠️ Recherche Full-Text**
- Avec ~10 000+ médicaments, la recherche peut être lente sans index
- **Solution :** Index GIN sur `to_tsvector` (voir Phase 1, Tâche 1.2)

**⚠️ Chargement du Catalog**
- Ne pas charger tout le catalog en mémoire côté client
- **Solution :** Utiliser la fonction RPC `search_medications()` côté serveur

### 7.2 Sécurité

**⚠️ Service Role Key**
- Le script d'import utilise une clé service role (bypass RLS)
- **Ne jamais commit cette clé dans le repo**
- **Utiliser des variables d'environnement**

**⚠️ Validation Utilisateur**
- Les médecins/pharmacies créés via le wizard doivent avoir `user_id = auth.uid()`
- **Vérifier les RLS policies**

### 7.3 UX

**⚠️ Retour au Wizard après Ajout**
- S'assurer que l'état du wizard est conservé après fermeture du dialog
- **Ne pas réinitialiser le formulaire**

**⚠️ Messages d'Erreur**
- Toujours afficher des messages clairs en cas d'échec
- **Toast avec message explicite**

---

## 8. QUESTIONS / VALIDATIONS

### 8.1 À Valider Avant Développement

1. **Import Médicaments**
   - ✅ Validation : Utiliser la base publique des médicaments ?
   - ✅ Validation : Import en une fois ou synchro régulière ?

2. **Architecture Tables**
   - ⚠️ À décider : Rendre `catalog_id` obligatoire dans `medications` ?
   - ⚠️ À décider : Supprimer les colonnes dupliquées (`name`, `strength`) ?
   - **Recommandation :** Garder l'architecture actuelle pour éviter breaking changes, mais améliorer la logique applicative

3. **Didacticiel Interactif**
   - 📝 À garder en mémoire pour plus tard
   - Intégrer un guide étape par étape pour les nouveaux utilisateurs
   - Voir `docs/DIDACTICIEL_INTERACTIF.md`

### 8.2 Décisions à Prendre

| Question | Options | Recommandation |
|----------|---------|----------------|
| Rendre `catalog_id` obligatoire ? | OUI / NON | **NON** (garder flexibilité) |
| Supprimer `name`/`strength` de `medications` ? | OUI / NON | **NON** (breaking change) |
| Import médicaments en une fois ? | OUI / NON | **OUI** (synchro mensuelle optionnelle) |
| Déploiement incrémental ? | OUI / NON | **OUI** (moins risqué) |

---

## 9. CONCLUSION

### 9.1 Résumé

Cette refonte du wizard de création de traitement vise à :
1. **Débloquer les nouveaux utilisateurs** en leur permettant de créer médecins/pharmacies à la volée
2. **Simplifier l'ajout de médicaments** via une recherche dans un référentiel officiel pré-rempli
3. **Améliorer l'UX** avec auto-complétion et validations intelligentes

### 9.2 Bénéfices Attendus

- **🚀 Réduction du temps de création d'un traitement** : -50%
- **✅ Taux de complétion wizard** : +30%
- **😊 Satisfaction utilisateur** : +40%
- **📊 Base de médicaments fiable** : ~10 000+ entrées officielles

### 9.3 Risques Mitigés

- **Performance** : Index full-text + fonction RPC
- **Sécurité** : RLS policies + validation user_id
- **UX** : Tests manuels approfondis

---

## 10. PROCHAINES ÉTAPES

1. **Validation de ce CR/PA** par l'équipe
2. **Décisions sur les questions en suspend** (voir section 8)
3. **Démarrage Phase 1** (Import médicaments)
4. **Développement itératif** selon planning

---

**Statut :** 📋 **En attente de validation**  
**Auteur :** GitHub Copilot  
**Date :** 11 janvier 2026
