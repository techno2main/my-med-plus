# 📋 PHASE 8 - Analyse & Proposition de Refonte du Système de Gestion des Médicaments

**Date**: 3 novembre 2025  
**Auteur**: Analyse d'expert système  
**Objectif**: Évaluation critique et proposition de refonte de l'architecture actuelle

---

## 🔍 ÉTAT DES LIEUX ACTUEL

### Architecture Existante

```
medication_catalog (référentiel)
    ↓ catalog_id
medications (fiches médicaments dans traitements)
    ↓ treatment_id
treatments (traitements utilisateurs)
```

### Tables Actuelles

#### **`medication_catalog`** : Référentiel de médicaments disponibles
```sql
- id UUID PRIMARY KEY
- name TEXT NOT NULL
- description TEXT
- default_dosage TEXT
- created_by UUID (multi-users)
- is_approved BOOLEAN (multi-users)
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

#### **`medications`** : Instances de médicaments dans les traitements
```sql
- id UUID PRIMARY KEY
- treatment_id UUID FK → treatments
- catalog_id UUID FK → medication_catalog
- name TEXT (dupliqué depuis catalog)
- dosage TEXT (peut différer du catalog)
- posology TEXT
- times JSONB
- initial_stock INTEGER
- current_stock INTEGER
- minimum_threshold INTEGER
- pathology_id UUID FK → pathologies
- description TEXT
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
```

### Workflow Actuel

```
1. Utilisateur crée/sélectionne médicament dans medication_catalog
   ↓
2. Médicament ajouté à un traitement via medications
   ↓
3. Données dupliquées (name, dosage) + personnalisation (stock, posologie)
```

### ❌ Problèmes Identifiés

1. **Redondance de données**
   - `name` et `dosage` dupliqués entre catalog et medications
   - Risque de désynchronisation

2. **Rigidité du système**
   - Obligation de créer une entrée catalog avant d'ajouter au traitement
   - Deux étapes pour un seul ajout

3. **Limitation des informations**
   - Manque de données officielles : forme galénique, composition, laboratoire
   - Pas de code CIS (identifiant officiel français)
   - Pas d'intégration avec bases officielles

4. **Double saisie utilisateur**
   - Ajout au catalog (étape 1)
   - Ajout au traitement (étape 2)
   - Friction UX importante

5. **Maintenance complexe**
   - Synchronisation catalog ↔ medications difficile
   - Mise à jour en cascade nécessaire
   - Gestion des médicaments orphelins

6. **Manque de standardisation**
   - Pas de lien avec référentiels officiels
   - Noms de médicaments non normalisés
   - Dosages en format libre (non structuré)

---

## 💡 MON AVIS D'EXPERT

### ✅ Points Positifs de Votre Analyse

1. **`medication_catalog` perd effectivement son sens** si vous intégrez une API officielle (Base Claude Bernard, Vidal, Open Data Médicaments)

2. **La table `medications` devrait être enrichie** avec les données officielles structurées

3. **Le workflow devient plus simple** : API externe → medications directement

4. **Vision correcte** : La vraie valeur est dans la fiche traitement (medications), pas dans un référentiel intermédiaire

### ⚠️ MAIS Attention aux Points Suivants

#### 1. **Cache & Performance**
Sans catalog local, chaque recherche frappe l'API externe :
- **Coût API** : Si API payante (ex: Vidal), chaque recherche = coût
- **Latence réseau** : Délai utilisateur à chaque recherche
- **Dépendance externe** : API down = app inutilisable
- **Quotas API** : Risque de dépassement de limite

#### 2. **Personnalisation Utilisateur**
Le catalog permettait aux users de créer leurs propres médicaments non-officiels :
- Compléments alimentaires (non dans bases officielles)
- Médicaments étrangers (hors France)
- Préparations magistrales (préparées en pharmacie)
- Homéopathie / Phytothérapie
- Produits de parapharmacie

#### 3. **Historique & Cohérence**
Si un médicament disparaît de l'API officielle (retrait du marché) :
- Les traitements historiques deviennent orphelins
- Perte d'informations sur d'anciens médicaments
- Impossible de consulter l'historique complet

#### 4. **Offline First**
Sans cache local :
- App inutilisable sans connexion internet
- Impossible d'ajouter un médicament hors ligne
- Dégradation de l'UX mobile

---

## 🎯 PROPOSITIONS DE REFONTE

### Option A : **Suppression Complète du Catalog** (Votre Proposition)

#### Architecture Simplifiée

```
API Officielle
    ↓ (appel direct)
medications (fiches enrichies)
    ↓ treatment_id
treatments
```

#### Structure `medications` Enrichie

```sql
CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
    
    -- Données OFFICIELLES (non modifiables)
    cis_code VARCHAR(13),              -- Code CIS officiel
    name TEXT NOT NULL,                -- Nom commercial
    form TEXT,                         -- comprimé, gélule, solution, etc.
    dosage TEXT,                       -- 5mg/1000mg
    composition TEXT,                  -- Substances actives
    laboratory TEXT,                   -- Laboratoire fabricant
    
    -- Données PERSONNALISÉES (modifiables)
    pathology_id UUID REFERENCES pathologies(id),
    initial_stock INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    minimum_threshold INTEGER DEFAULT 10,
    posology TEXT,                     -- "1 le matin et soir"
    times JSONB,                       -- [{"time": "09:00"}, {"time": "19:00"}]
    instructions TEXT,                 -- "Après repas"
    expiry_date DATE,
    photo_url TEXT,
    
    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Workflow Simplifié

```
┌─────────────────────────────────────┐
│  Wizard Ajout Médicament            │
├─────────────────────────────────────┤
│                                     │
│  1. Scan QR Code / Recherche nom    │
│     ↓                               │
│  2. Appel API Officielle            │
│     ↓                               │
│  3. Création DIRECTE dans           │
│     medications avec données API    │
│     ↓                               │
│  4. Personnalisation utilisateur    │
│     (stock, posologie, horaires)    │
│                                     │
└─────────────────────────────────────┘
```

#### ✅ Avantages

- **Simplicité architecturale** : 1 table au lieu de 2
- **Données toujours à jour** : Directement depuis source officielle
- **Moins de maintenance** : Pas de synchronisation catalog ↔ medications
- **Pas de redondance** : Données stockées une seule fois
- **Code plus simple** : Moins de jointures SQL

#### ❌ Inconvénients

- **Dépendance totale à l'API externe** : App cassée si API down
- **Pas de médicaments personnalisés** : Compléments alimentaires impossibles
- **Coût/latence des appels API** : Chaque recherche = appel réseau
- **Pas de cache** : Recherches répétées pour médicaments courants
- **Offline impossible** : Nécessite connexion internet permanente
- **Risque de perte de données historiques** : Si médicament retiré du marché
- **Performances dégradées** : Latence réseau à chaque action

---

### Option B : **Système Hybride Intelligent** (MA RECOMMANDATION)

#### Architecture Proposée

```
API Officielle
    ↓ (sync périodique)
medications_reference (cache enrichi)
    ↓ medication_ref_id
treatment_medications (instances personnalisées)
    ↓ treatment_id
treatments
```

#### Nouvelle Structure de Tables

##### **`medications_reference`** (Remplace medication_catalog)
```sql
CREATE TABLE medications_reference (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Données OFFICIELLES (via API)
    cis_code VARCHAR(13) UNIQUE,       -- Code CIS officiel (identifiant unique France)
    name TEXT NOT NULL,                -- Nom commercial
    form TEXT,                         -- comprimé, gélule, solution injectable, etc.
    dosage TEXT,                       -- 5mg/1000mg, 500mg, etc.
    composition TEXT,                  -- Substances actives (DCI)
    laboratory TEXT,                   -- Laboratoire fabricant
    atc_code VARCHAR(10),              -- Classification thérapeutique ATC
    
    -- Métadonnées de source
    source TEXT NOT NULL CHECK (source IN ('official_api', 'user_created')),
    official_data JSONB,               -- Données brutes complètes de l'API
    
    -- Multi-users (pour médicaments personnalisés)
    created_by UUID REFERENCES auth.users(id),
    is_approved BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_sync_at TIMESTAMPTZ           -- Dernière synchronisation avec API
);

CREATE INDEX idx_medications_reference_cis ON medications_reference(cis_code);
CREATE INDEX idx_medications_reference_name ON medications_reference(name);
CREATE INDEX idx_medications_reference_source ON medications_reference(source);
```

##### **`treatment_medications`** (Remplace medications)
```sql
CREATE TABLE treatment_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
    medication_ref_id UUID NOT NULL REFERENCES medications_reference(id),
    
    -- Champs MODIFIABLES par l'utilisateur
    pathology_id UUID REFERENCES pathologies(id),
    initial_stock INTEGER DEFAULT 0,
    current_stock INTEGER DEFAULT 0,
    minimum_threshold INTEGER DEFAULT 10,
    posology TEXT,                     -- "1 comprimé le matin et soir"
    times JSONB,                       -- [{"time": "09:00"}, {"time": "19:00"}]
    instructions TEXT,                 -- "À prendre après repas avec un grand verre d'eau"
    expiry_date DATE,
    photo_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_treatment_medications_treatment ON treatment_medications(treatment_id);
CREATE INDEX idx_treatment_medications_ref ON treatment_medications(medication_ref_id);
```

#### Workflow Hybride Intelligent

```
┌─────────────────────────────────────────────────────────┐
│  Wizard Ajout Médicament                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Scan QR Code / Recherche nom                        │
│     ↓                                                   │
│  2. Vérification LOCALE dans medications_reference      │
│     ├─ Trouvé ? → Utiliser cache local (instant)       │
│     └─ Pas trouvé ?                                     │
│         ↓                                               │
│         Appel API Officielle                            │
│         ↓                                               │
│         Création dans medications_reference             │
│         (source = 'official_api')                       │
│     ↓                                                   │
│  3. Création dans treatment_medications                 │
│     avec données personnalisées                         │
│     ↓                                                   │
│  4. Personnalisation utilisateur                        │
│     (stock, posologie, horaires, instructions)          │
│                                                         │
│  ┌──────────────────────────────────────┐              │
│  │ Option : Médicament non-officiel     │              │
│  │ → Création manuelle dans             │              │
│  │   medications_reference              │              │
│  │   (source = 'user_created')          │              │
│  └──────────────────────────────────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Service d'Intégration (Code TypeScript)

```typescript
// services/medicationAPIService.ts

interface OfficialMedicationData {
  cisCode: string;
  name: string;
  form: string;
  dosage: string;
  composition: string;
  laboratory: string;
  atcCode?: string;
}

class MedicationAPIService {
  private readonly API_BASE_URL = 'https://base-donnees-publique.medicaments.gouv.fr/api';
  
  /**
   * Recherche par nom dans le cache local d'abord, puis API si nécessaire
   */
  async searchByName(name: string): Promise<MedicationReference[]> {
    // 1. Recherche dans le cache local
    const { data: cached } = await supabase
      .from('medications_reference')
      .select('*')
      .ilike('name', `%${name}%`)
      .limit(10);
    
    if (cached && cached.length > 0) {
      return cached;
    }
    
    // 2. Si pas de résultat, interroger l'API officielle
    const officialResults = await this.fetchFromOfficialAPI(name);
    
    // 3. Mettre en cache les résultats
    for (const result of officialResults) {
      await this.cacheOfficialMedication(result);
    }
    
    return officialResults;
  }
  
  /**
   * Recherche par QR Code (code CIS)
   */
  async fetchByCIS(cisCode: string): Promise<MedicationReference> {
    // 1. Vérifier le cache local
    const { data: cached } = await supabase
      .from('medications_reference')
      .select('*')
      .eq('cis_code', cisCode)
      .single();
    
    if (cached) {
      // Vérifier si sync récente (< 30 jours)
      const lastSync = new Date(cached.last_sync_at);
      const daysSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceSync < 30) {
        return cached;
      }
    }
    
    // 2. Récupérer depuis l'API officielle
    const officialData = await this.fetchOfficialByCIS(cisCode);
    
    // 3. Mettre à jour le cache
    return await this.cacheOfficialMedication(officialData);
  }
  
  /**
   * Mise en cache ou mise à jour d'un médicament officiel
   */
  private async cacheOfficialMedication(data: OfficialMedicationData): Promise<MedicationReference> {
    const { data: medication, error } = await supabase
      .from('medications_reference')
      .upsert({
        cis_code: data.cisCode,
        name: data.name,
        form: data.form,
        dosage: data.dosage,
        composition: data.composition,
        laboratory: data.laboratory,
        atc_code: data.atcCode,
        source: 'official_api',
        official_data: data,
        last_sync_at: new Date().toISOString()
      }, {
        onConflict: 'cis_code'
      })
      .select()
      .single();
    
    if (error) throw error;
    return medication;
  }
  
  /**
   * Création d'un médicament personnalisé (non-officiel)
   */
  async createCustomMedication(
    name: string, 
    form: string, 
    dosage: string,
    userId: string
  ): Promise<MedicationReference> {
    const { data, error } = await supabase
      .from('medications_reference')
      .insert({
        name,
        form,
        dosage,
        source: 'user_created',
        created_by: userId,
        is_approved: false
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Appel réel à l'API officielle (à implémenter selon l'API choisie)
   */
  private async fetchFromOfficialAPI(name: string): Promise<OfficialMedicationData[]> {
    // TODO: Implémenter selon API choisie
    // - Base de Données Publique des Médicaments (gratuite)
    // - Vidal API (payante)
    // - Base Claude Bernard (payante)
    throw new Error('Not implemented');
  }
  
  private async fetchOfficialByCIS(cisCode: string): Promise<OfficialMedicationData> {
    // TODO: Implémenter selon API choisie
    throw new Error('Not implemented');
  }
}

export const medicationAPI = new MedicationAPIService();
```

#### ✅ Avantages du Système Hybride

1. **Best of both worlds** : Données officielles + flexibilité personnalisation
2. **Performance optimale** : Cache local = recherche instantanée
3. **Résilience** : App fonctionne même si API externe down
4. **Coût maîtrisé** : Appels API limités (cache intelligent)
5. **Offline first** : Médicaments fréquents disponibles hors ligne
6. **Historique préservé** : Données cachées même si médicament retiré du marché
7. **Évolutivité** : Facile d'ajouter d'autres sources de données
8. **Flexibilité** : Médicaments personnalisés possibles (compléments, etc.)
9. **RGPD friendly** : Séparation référentiel / données personnelles
10. **Sync périodique** : Mise à jour automatique des données officielles

#### ⚠️ Inconvénients (mineurs)

- Architecture légèrement plus complexe (2 tables au lieu de 1)
- Nécessite stratégie de sync périodique
- Gestion du cache à maintenir

---

## 📊 COMPARAISON DÉTAILLÉE DES OPTIONS

| Critère | Option A (Sans catalog) | Option B (Hybride) | Gagnant |
|---------|------------------------|-------------------|---------|
| **Simplicité architecturale** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | A |
| **Performance (latence)** | ⭐⭐ | ⭐⭐⭐⭐⭐ | B |
| **Flexibilité** | ⭐⭐ | ⭐⭐⭐⭐⭐ | B |
| **Coût API** | ⭐⭐ | ⭐⭐⭐⭐ | B |
| **Résilience (API down)** | ⭐ | ⭐⭐⭐⭐⭐ | B |
| **Offline first** | ⭐ | ⭐⭐⭐⭐⭐ | B |
| **Maintenance code** | ⭐⭐⭐⭐ | ⭐⭐⭐ | A |
| **Historique préservé** | ⭐⭐ | ⭐⭐⭐⭐⭐ | B |
| **Médicaments personnalisés** | ❌ | ✅ | B |
| **Conformité RGPD** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | B |

**Score final** : Option A = 24/50 ⭐ | Option B = 43/50 ⭐

---

## 🚀 PLAN D'ACTION RECOMMANDÉ (Option B)

### Phase 8.1 : Migration de la Structure BDD

#### Migration SQL

```sql
-- ============================================
-- PHASE 8.1 : Migration vers système hybride
-- ============================================

BEGIN;

-- 1. RENOMMER medication_catalog → medications_reference
ALTER TABLE medication_catalog RENAME TO medications_reference;

-- 2. AJOUTER colonnes pour données officielles
ALTER TABLE medications_reference
ADD COLUMN cis_code VARCHAR(13) UNIQUE,
ADD COLUMN form TEXT,
ADD COLUMN composition TEXT,
ADD COLUMN laboratory TEXT,
ADD COLUMN atc_code VARCHAR(10),
ADD COLUMN source TEXT DEFAULT 'user_created' CHECK (source IN ('official_api', 'user_created')),
ADD COLUMN official_data JSONB,
ADD COLUMN last_sync_at TIMESTAMPTZ;

-- 3. MISE À JOUR des données existantes
UPDATE medications_reference
SET source = 'user_created'
WHERE source IS NULL;

-- 4. CRÉER index pour performance
CREATE INDEX IF NOT EXISTS idx_medications_reference_cis 
ON medications_reference(cis_code);

CREATE INDEX IF NOT EXISTS idx_medications_reference_name 
ON medications_reference USING gin(to_tsvector('french', name));

CREATE INDEX IF NOT EXISTS idx_medications_reference_source 
ON medications_reference(source);

-- 5. RENOMMER medications → treatment_medications
ALTER TABLE medications RENAME TO treatment_medications;

-- 6. RENOMMER colonne FK
ALTER TABLE treatment_medications 
RENAME COLUMN catalog_id TO medication_ref_id;

-- 7. AJOUTER colonnes manquantes
ALTER TABLE treatment_medications
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS instructions TEXT;

-- 8. SUPPRIMER colonnes redondantes (si elles existent encore)
-- name et dosage sont maintenant dans medications_reference uniquement
-- ALTER TABLE treatment_medications DROP COLUMN IF EXISTS name;
-- ALTER TABLE treatment_medications DROP COLUMN IF EXISTS dosage;
-- NOTE: À décommenter après migration des données vers medications_reference

-- 9. METTRE À JOUR les RLS policies
DROP POLICY IF EXISTS "medications_reference_read" ON medications_reference;
CREATE POLICY "medications_reference_read"
  ON medications_reference FOR SELECT
  TO authenticated
  USING (
    (created_by = (SELECT auth.uid())) OR 
    (is_approved = true) OR
    (source = 'official_api')
  );

DROP POLICY IF EXISTS "treatment_medications_read" ON treatment_medications;
CREATE POLICY "treatment_medications_read"
  ON treatment_medications FOR SELECT
  TO authenticated
  USING (
    treatment_id IN (
      SELECT id FROM treatments WHERE user_id = (SELECT auth.uid())
    )
  );

COMMIT;
```

### Phase 8.2 : Intégration API Officielle

#### Choix de l'API

**Recommandation** : Base de Données Publique des Médicaments (gratuite)
- URL : https://base-donnees-publique.medicaments.gouv.fr/
- Licence : Licence Ouverte (Open Data)
- Coût : Gratuit
- Format : JSON / CSV
- Mise à jour : Hebdomadaire

**Alternative payante** : Vidal API (si budget disponible)
- Plus complète (interactions médicamenteuses, contre-indications)
- Coût : À partir de 500€/mois

#### Implémentation du Service

```typescript
// src/services/medication/medicationAPIService.ts

import { supabase } from '@/integrations/supabase/client';

interface OfficialMedicationResponse {
  codeCIS: string;
  denomination: string;
  formePharmaceutique: string;
  voiesAdministration: string[];
  statutAMM: string;
  titulaires: string[];
  compositions: Array<{
    designationElementPharmaceutique: string;
    composants: Array<{
      denominationSubstance: string;
      dosage: string;
    }>;
  }>;
}

export class MedicationAPIService {
  private readonly BASE_URL = 'https://base-donnees-publique.medicaments.gouv.fr/api/v1';
  
  /**
   * Recherche intelligente avec cache
   */
  async searchMedication(query: string): Promise<MedicationReference[]> {
    // 1. Recherche locale d'abord
    const localResults = await this.searchLocal(query);
    if (localResults.length > 0) {
      return localResults;
    }
    
    // 2. Recherche API si rien en local
    const apiResults = await this.searchAPI(query);
    
    // 3. Cache les résultats
    for (const result of apiResults) {
      await this.cacheResult(result);
    }
    
    return apiResults;
  }
  
  /**
   * Recherche dans le cache local
   */
  private async searchLocal(query: string): Promise<MedicationReference[]> {
    const { data, error } = await supabase
      .from('medications_reference')
      .select('*')
      .or(`name.ilike.%${query}%,composition.ilike.%${query}%`)
      .limit(20);
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Recherche via API officielle
   */
  private async searchAPI(query: string): Promise<OfficialMedicationResponse[]> {
    const response = await fetch(
      `${this.BASE_URL}/medicaments.json?denomination=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Scan QR Code (Code CIS)
   */
  async fetchByCIS(cisCode: string): Promise<MedicationReference> {
    // 1. Check cache
    const { data: cached } = await supabase
      .from('medications_reference')
      .select('*')
      .eq('cis_code', cisCode)
      .single();
    
    if (cached && this.isCacheValid(cached.last_sync_at)) {
      return cached;
    }
    
    // 2. Fetch from API
    const response = await fetch(`${this.BASE_URL}/medicament/${cisCode}.json`);
    if (!response.ok) {
      throw new Error('Médicament non trouvé');
    }
    
    const data = await response.json();
    
    // 3. Cache result
    return await this.cacheResult(data);
  }
  
  /**
   * Vérifie si le cache est encore valide (< 30 jours)
   */
  private isCacheValid(lastSync: string | null): boolean {
    if (!lastSync) return false;
    const daysSinceSync = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceSync < 30;
  }
  
  /**
   * Met en cache un résultat API
   */
  private async cacheResult(apiData: OfficialMedicationResponse): Promise<MedicationReference> {
    const composition = apiData.compositions
      .map(c => c.composants.map(comp => 
        `${comp.denominationSubstance} ${comp.dosage}`
      ).join(', '))
      .join(' / ');
    
    const { data, error } = await supabase
      .from('medications_reference')
      .upsert({
        cis_code: apiData.codeCIS,
        name: apiData.denomination,
        form: apiData.formePharmaceutique,
        dosage: this.extractDosage(apiData),
        composition: composition,
        laboratory: apiData.titulaires.join(', '),
        source: 'official_api',
        official_data: apiData,
        last_sync_at: new Date().toISOString(),
        is_approved: true
      }, {
        onConflict: 'cis_code'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Extrait le dosage depuis les données API
   */
  private extractDosage(apiData: OfficialMedicationResponse): string {
    const mainComponent = apiData.compositions[0]?.composants[0];
    return mainComponent?.dosage || '';
  }
}

export const medicationAPI = new MedicationAPIService();
```

### Phase 8.3 : Nouveau Wizard d'Ajout

#### Composant React

```typescript
// src/components/medication/MedicationWizard.tsx

import { useState } from 'react';
import { medicationAPI } from '@/services/medication/medicationAPIService';
import { QRCodeScanner } from './QRCodeScanner';
import { MedicationSearch } from './MedicationSearch';
import { MedicationForm } from './MedicationForm';

interface WizardStep {
  step: 'method' | 'search' | 'customize' | 'confirm';
}

export function MedicationWizard({ treatmentId }: { treatmentId: string }) {
  const [step, setStep] = useState<WizardStep['step']>('method');
  const [selectedMedication, setSelectedMedication] = useState<MedicationReference | null>(null);
  
  // Étape 1 : Choix de la méthode
  if (step === 'method') {
    return (
      <div className="space-y-4">
        <h2>Comment souhaitez-vous ajouter votre médicament ?</h2>
        
        <button onClick={() => setStep('search')} className="btn-primary">
          📷 Scanner le QR Code (Datamatrix)
        </button>
        
        <button onClick={() => setStep('search')} className="btn-secondary">
          🔍 Recherche par nom
        </button>
        
        <button onClick={handleCustomMedication} className="btn-tertiary">
          ✏️ Saisie manuelle (médicament non-officiel)
        </button>
      </div>
    );
  }
  
  // Étape 2 : Recherche/Scan
  if (step === 'search') {
    return (
      <div>
        {/* QR Code Scanner ou Recherche */}
        <QRCodeScanner 
          onScan={async (cisCode) => {
            const med = await medicationAPI.fetchByCIS(cisCode);
            setSelectedMedication(med);
            setStep('customize');
          }}
        />
        
        <MedicationSearch
          onSelect={(med) => {
            setSelectedMedication(med);
            setStep('customize');
          }}
        />
      </div>
    );
  }
  
  // Étape 3 : Personnalisation
  if (step === 'customize' && selectedMedication) {
    return (
      <MedicationForm
        medicationRef={selectedMedication}
        treatmentId={treatmentId}
        onSubmit={handleSubmit}
      />
    );
  }
  
  return null;
}
```

### Phase 8.4 : Tâche de Synchronisation Périodique

#### Edge Function Supabase

```typescript
// supabase/functions/sync-medications/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // Récupérer les médicaments officiels non synchronisés depuis > 30 jours
  const { data: outdated } = await supabase
    .from('medications_reference')
    .select('cis_code')
    .eq('source', 'official_api')
    .lt('last_sync_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  
  // Resynchroniser chaque médicament
  for (const med of outdated || []) {
    try {
      const response = await fetch(
        `https://base-donnees-publique.medicaments.gouv.fr/api/v1/medicament/${med.cis_code}.json`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        await supabase
          .from('medications_reference')
          .update({
            official_data: data,
            last_sync_at: new Date().toISOString()
          })
          .eq('cis_code', med.cis_code);
      }
    } catch (error) {
      console.error(`Failed to sync ${med.cis_code}:`, error);
    }
  }
  
  return new Response(
    JSON.stringify({ synced: outdated?.length || 0 }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

#### Cron Job Configuration

```sql
-- Planifier la sync toutes les semaines
SELECT cron.schedule(
  'sync-medications-weekly',
  '0 2 * * 0',  -- Dimanche à 2h du matin
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/sync-medications',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

---

## 🎯 MA RECOMMANDATION FINALE

### Je recommande **FORTEMENT l'Option B (Système Hybride)** pour les raisons suivantes :

#### 1. **Architecture Robuste & Scalable**
- Cache intelligent = performance optimale
- Résilience face aux pannes API
- Prêt pour migration vers API payante (Vidal) si besoin

#### 2. **Expérience Utilisateur Optimale**
- Recherche instantanée (cache local)
- Offline first (médicaments courants disponibles)
- Pas de latence perceptible

#### 3. **Flexibilité & Évolutivité**
- Médicaments officiels + personnalisés
- Ajout facile d'autres sources de données
- Migration progressive possible

#### 4. **Conformité & Sécurité**
- RGPD friendly (séparation référentiel/données perso)
- Traçabilité complète (source, sync dates)
- Historique préservé

#### 5. **Coût Maîtrisé**
- Cache = réduction drastique des appels API
- Compatible API gratuite (Open Data)
- Migration vers API payante facilitée

### 🚦 Prochaines Étapes Suggérées

**Phase immédiate** :
1. ✅ Valider cette proposition
2. 🔄 Créer une branche `feature/phase8-medications-refactor`
3. 📝 Exécuter migration SQL (Phase 8.1)
4. 🧪 Tester migration sur données existantes

**Phase suivante** :
1. 💻 Implémenter `MedicationAPIService`
2. 🎨 Créer nouveau Wizard d'ajout
3. 🔄 Mettre en place sync périodique
4. ✅ Tests end-to-end

**Durée estimée** : 2-3 semaines de développement

---

## 📚 Ressources & Références

### APIs Médicaments France

1. **Base de Données Publique des Médicaments** (recommandée)
   - URL : https://base-donnees-publique.medicaments.gouv.fr/
   - Documentation : https://base-donnees-publique.medicaments.gouv.fr/docs
   - Licence : Open Data (gratuit)

2. **Vidal API** (alternative payante)
   - URL : https://api.vidal.fr/
   - Avantages : Interactions médicamenteuses, contre-indications
   - Coût : ~500€/mois

3. **Base Claude Bernard**
   - URL : http://www.resip.fr/
   - Utilisé par les professionnels de santé

### QR Code Datamatrix

- Standard GS1 DataMatrix
- Contient le code CIS + numéro de lot + date péremption
- Librairie recommandée : `@zxing/browser` (TypeScript)

### Normes & Standards

- **Code CIS** : Code Identifiant de Spécialité (13 chiffres)
- **Code ATC** : Anatomical Therapeutic Chemical (classification OMS)
- **DCI** : Dénomination Commune Internationale (substance active)

---

**Questions ? Besoin de précisions sur un point spécifique ?**
