Refactorisation du système de gestion des médicaments actuel

Mon constat : 
Question sur la légitimité de la table medication_catalog :

Le référentiel sert actuellement à stocker la liste des médicaments disponibles pouvant être ajoutés à un traitement utilisateur. MAIS si on peut récupérer directement la fiche médicament depuis la source officielle (via QR Code ou recherche manuelle) à l'étape 2 du Wizard d'ajout d'un traitement (ou en ajoutant un nouveau médicament au traitement existant), alors quel est le réel intérêt de stocker une table medication_catalog dans la base ?

A mon sens, la vraie table qui doit être considérée, c'est la fiche médicament (table medications) :
C'est ici qu'on doit injecter les données récupérées de la base officielle via le QR Code ou recherche dynamique par nom, en stockant les informations du médicament dans une fiche détaillée : 
Champs non modifiables 
- Id du traitement lié
- Nom du médicament (ex. : XigDuo)
- Forme du médicament (ex. : comprimé, gélule, etc.)
- Dosage/Force (ex. : 5mg/1000mg)
Champs modifiables
- Pathologie associée à ce médicament pour le traitement concerné (peut être différente selon le traitement utilisateur)
- Stock initial (défini à l'ajout du médicament au traitement)
- Seuil d'alerte (stock minimum pour rappels)
- Quantité (stock actuel)
- Posologie (Saisie intuitive en langage naturel, pour définir les horaires. Ex: 1 le matin et soir, etc.)
- Horaires (heures de prise(s) par défaut calculés à partir de la posologie)
- Informations/Description (Ex. : A prendre après repas)
- Date de péremption de la boite 
- Photo du médicament (optionnel)

La solution finale proposée : 

# PHASE 8 — Refonte Système Médicaments (Mix Lovable + VSCode Agent)

**Date:** 3 novembre 2025  
**Auteur:** Plan consolidé issu des analyses Lovable.dev + VSCode Agent Claude Sonnet 4.5  
**Objectif:** Intégrer BDPM + scan DataMatrix GS1, supprimer la redondance du catalogue historique, introduire un référentiel cache officiel, simplifier le modèle de données, garantir offline/perf et sécurité de migration avec rollback

---

## Table des matières

1. [Contexte et problématique](#contexte)
2. [Décisions clés](#decisions)
3. [Architecture cible](#architecture)
4. [La solution finale proposée](#solution)
5. [Migration ultra-sécurisée (v2 + rollback)](#migration)
6. [Intégration BDPM + DataMatrix](#integration)
7. [Services backend et synchronisation](#backend)
8. [Endpoints API](#endpoints)
9. [Frontend — Wizard et refonte](#frontend)
10. [Sécurité, RLS, gouvernance](#securite)
11. [Tests (unitaires, E2E)](#tests)
12. [Plan d'exécution et calendrier](#execution)
13. [Checklists de validation](#checklists)
14. [Rollback](#rollback)
15. [Annexes techniques](#annexes)

---

<a name="contexte"></a>
## 1. Contexte et problématique

### Question centrale
**Quelle est la légitimité de la table `medicationcatalog` si on peut récupérer directement les fiches médicaments depuis une source officielle via scan ou recherche ?**

### Problèmes identifiés
- Le référentiel `medicationcatalog` stocke manuellement des médicaments disponibles
- Risque de données obsolètes, incomplètes ou incorrectes
- Duplication des données entre `medicationcatalog` et `medications` (nom, dosage)
- Complexité de maintien du catalogue et synchronisation manuelle
- Aucune traçabilité des sources officielles

### État des lieux actuel

**Tables existantes:**
- `medicationcatalog`: Référentiel de médicaments disponibles (catalogid, name, description, defaultdosage)
- `medications`: Instances de médicaments dans les traitements (treatmentid, catalogid, name, dosage dupliqué)
- `medicationintakes`: Prises de médicaments liées aux instances

**Flux actuel:**
1. Ajout manuel dans le catalogue (`medicationcatalog`)
2. Sélection depuis le catalogue lors de l'ajout à un traitement
3. Duplication des données nom/dosage dans `medications`
4. Gestion des prises via `medicationintakes`

---

<a name="decisions"></a>
## 2. Décisions clés

### Décision 1: Architecture hybride
Remplacer le catalogue manuel par un **référentiel cache officiel** (BDPM) avec instances personnalisées par traitement, garantissant:
- Performance et disponibilité offline via cache local
- Fraîcheur des données via synchronisation différée
- Traçabilité via source officielle BDPM
- Personnalisation utilisateur sans écrasement lors des mises à jour

### Décision 2: Migration sécurisée v2
Créer des tables v2 en parallèle, copier, valider, basculer progressivement, avec possibilité de rollback instantané sur v1.

### Décision 3: Intégration scan DataMatrix
Parser les codes GS1 (01=GTIN/CIP13, 17=expiration, 10=lot) pour préremplir automatiquement les fiches depuis la BDPM.

---

<a name="architecture"></a>
## 3. Architecture cible

### Schéma de données cible

```
medicationreferencecache (référentiel officiel)
    ├─ id (UUID PK)
    ├─ ciscode (TEXT UNIQUE) — Code CIS officiel
    ├─ cis13code (TEXT) — Code CIP13 si disponible
    ├─ officialname (TEXT NOT NULL)
    ├─ strength (TEXT) — Dosage
    ├─ pharmaceuticalform (TEXT)
    ├─ administrationroute (TEXT)
    ├─ atccode (TEXT)
    ├─ laboratory (TEXT)
    ├─ marketingstatus (TEXT)
    ├─ marketingauthorizationdate (DATE)
    ├─ officialdata (JSONB) — Données brutes BDPM
    ├─ cachesource (TEXT) — api|datamatrix|manual
    ├─ lastsyncedat (TIMESTAMPTZ)
    └─ createdat, updatedat

medicationsv2 (instances utilisateur par traitement)
    ├─ id (UUID PK)
    ├─ treatmentid (UUID FK treatments)
    ├─ referencecacheid (UUID FK medicationreferencecache) — NULL si custom
    ├─ Copies minimales pour offline:
    │   ├─ officialname
    │   ├─ officialstrength
    │   ├─ pharmaceuticalform
    │   └─ ciscode
    ├─ Personnalisation utilisateur:
    │   ├─ username (TEXT) — Nom personnalisé si différent
    │   ├─ pathologyid (UUID FK)
    │   ├─ posology (TEXT)
    │   ├─ times (JSONB)
    │   ├─ unitspertake (NUMERIC DEFAULT 1)
    │   ├─ initialstock (INTEGER)
    │   ├─ currentstock (INTEGER)
    │   ├─ minthreshold (INTEGER)
    │   ├─ expirydate (DATE)
    │   ├─ batchnumber (TEXT)
    │   ├─ usernotes (TEXT)
    │   └─ photourl (TEXT)
    └─ createdat, updatedat

medicationintakesv2 (prises)
    ├─ id (UUID PK)
    ├─ medicationid (UUID FK medicationsv2)
    ├─ takendatetime (TIMESTAMPTZ)
    ├─ planned (BOOLEAN)
    ├─ taken (BOOLEAN)
    ├─ units (NUMERIC)
    └─ createdat
```

### Flux de données

```
Scan/Recherche → BDPM (source officielle)
                      ↓
        medicationreferencecache (cache local)
                      ↓
         medicationsv2 (instance + perso)
                      ↓
         medicationintakesv2 (prises)
```

---

<a name="solution"></a>
## 4. La solution finale proposée

### Architecture hybride
Référentiel cache officiel + instances par traitement, avec:
- Suppression de la redondance catalog → instance
- Intégration BDPM et scan DataMatrix GS1 pour préremplissage
- Garantie offline via copies minimales locales dans `medicationsv2`

### Sécurité migration
- Création des tables v2 en parallèle
- Copie contrôlée avec validation d'intégrité
- Bascule progressive via feature flag
- Rollback instantané en repointant sur v1 si besoin

### Performance et UX
- Recherche cache-first (latence < 500 ms)
- Rafraîchissement différé (30 jours)
- Wizard d'ajout unifié (scan/recherche/saisie)
- Préremplissage lot/péremption depuis DataMatrix
- Gestion des stocks/alertes robuste avec triggers

---

## 5. Modèle de données détaillé

### Table 1: medicationreferencecache

**Rôle:** Cache des fiches officielles BDPM, accessible en lecture à tous les utilisateurs authentifiés, mise à jour uniquement via backend.

**Colonnes:**
- `id` (UUID PK): Identifiant unique
- `ciscode` (TEXT UNIQUE NOT NULL): Code CIS officiel (clé de référence BDPM)
- `cis13code` (TEXT): Code CIP13 dérivé du GTIN si disponible
- `officialname` (TEXT NOT NULL): Nom commercial du médicament
- `strength` (TEXT): Dosage/Force (ex: "5mg/1000mg")
- `pharmaceuticalform` (TEXT): Forme pharmaceutique (comprimé, gélule, sirop, etc.)
- `administrationroute` (TEXT): Voie d'administration (orale, injectable, etc.)
- `atccode` (TEXT): Classification ATC
- `laboratory` (TEXT): Laboratoire fabricant
- `marketingstatus` (TEXT): Statut de commercialisation
- `marketingauthorizationdate` (DATE): Date d'AMM
- `officialdata` (JSONB): Données brutes BDPM pour traçabilité complète
- `cachesource` (TEXT): Source de création ('api', 'datamatrix', 'manual')
- `lastsyncedat` (TIMESTAMPTZ): Dernière synchronisation avec BDPM
- `createdat`, `updatedat` (TIMESTAMPTZ): Horodatages

**Index:**
- Index unique sur `ciscode`
- Index sur `atccode`
- Index GIN full-text sur `officialname` (français)

**RLS:**
- Lecture: ouverte aux utilisateurs authentifiés
- Écriture: réservée au service_role (backend)

---

### Table 2: medicationsv2

**Rôle:** Instance d'un médicament dans un traitement utilisateur, avec personnalisation et copies minimales pour offline.

**Colonnes:**

*Liens:*
- `id` (UUID PK): Identifiant unique
- `treatmentid` (UUID NOT NULL FK treatments): Traitement associé
- `referencecacheid` (UUID FK medicationreferencecache): Lien vers le cache (NULL si médicament custom)

*Copies minimales pour offline:*
- `officialname` (TEXT): Copie du nom officiel
- `officialstrength` (TEXT): Copie du dosage
- `pharmaceuticalform` (TEXT): Copie de la forme
- `ciscode` (TEXT): Copie du code CIS

*Personnalisation utilisateur:*
- `username` (TEXT): Nom personnalisé si différent de l'officiel
- `pathologyid` (UUID FK pathologies): Pathologie associée
- `posology` (TEXT): Posologie en langage naturel
- `times` (JSONB): Horaires de prise (ex: `[{"hour": 8, "minute": 0}, {"hour": 20, "minute": 0}]`)
- `unitspertake` (NUMERIC DEFAULT 1): Nombre d'unités par prise

*Gestion des stocks:*
- `initialstock` (INTEGER DEFAULT 0): Stock initial
- `currentstock` (INTEGER DEFAULT 0): Stock actuel
- `minthreshold` (INTEGER DEFAULT 0): Seuil d'alerte

*Traçabilité boîte:*
- `expirydate` (DATE): Date de péremption (préremplie par scan)
- `batchnumber` (TEXT): Numéro de lot (prérempli par scan)

*Autres:*
- `usernotes` (TEXT): Notes personnelles
- `photourl` (TEXT): Photo de la boîte
- `createdat`, `updatedat` (TIMESTAMPTZ): Horodatages

**Contraintes:**
- `currentstock >= 0`
- `minthreshold >= 0`
- `unitspertake > 0`

**Index:**
- Index sur `treatmentid`
- Index sur `referencecacheid`
- Index sur `pathologyid`

**RLS:**
- Filtrage par user via chaînage `treatments` → `userid`

---

### Table 3: medicationintakesv2

**Rôle:** Enregistrement des prises de médicaments avec trigger de décrément du stock.

**Colonnes:**
- `id` (UUID PK): Identifiant unique
- `medicationid` (UUID NOT NULL FK medicationsv2): Médicament concerné
- `takendatetime` (TIMESTAMPTZ NOT NULL): Date/heure de la prise
- `planned` (BOOLEAN DEFAULT false): Prise planifiée ou ad-hoc
- `taken` (BOOLEAN DEFAULT true): Confirmé pris ou non
- `units` (NUMERIC DEFAULT 1): Nombre d'unités prises
- `createdat` (TIMESTAMPTZ): Horodatage

**Index:**
- Index sur `medicationid`
- Index sur `takendatetime`

**Trigger:**
- Après insertion: décrément automatique de `currentstock` dans `medicationsv2`

**RLS:**
- Filtrage par user via `medicationsv2` → `treatments` → `userid`

---

<a name="migration"></a>
## 6. Migration ultra-sécurisée (v2 + rollback)

### Principe
Ne pas modifier ni supprimer les tables v1. Créer des tables v2 en parallèle, copier les données avec validation, basculer le code progressivement, conserver v1 pour rollback instantané.

### Étapes détaillées

#### 6.1. Backups (sauvegarde complète)
```sql
-- Backups des tables v1
CREATE TABLE public.medications_backup AS TABLE public.medications;
CREATE TABLE public.medicationintakes_backup AS TABLE public.medicationintakes;
CREATE TABLE public.medicationcatalog_backup AS TABLE public.medicationcatalog;
CREATE TABLE public.treatments_backup AS TABLE public.treatments;
```

#### 6.2. Création des tables v2
- Créer `medicationreferencecache` (vide initialement)
- Créer `pathologiesv2`, `healthprofessionalsv2`, `prescriptionsv2`, `treatmentsv2` si duplication complète décidée
- Créer `medicationsv2`
- Créer `medicationintakesv2`
- Ajouter tous les index, contraintes, triggers
- Configurer RLS

#### 6.3. Copie des données

**Copie des tables de référence (si v2 complète):**
```sql
-- Pathologies
INSERT INTO public.pathologiesv2 SELECT * FROM public.pathologies;

-- Health professionals
INSERT INTO public.healthprofessionalsv2 SELECT * FROM public.healthprofessionals;

-- Prescriptions
INSERT INTO public.prescriptionsv2 SELECT * FROM public.prescriptions;

-- Treatments
INSERT INTO public.treatmentsv2 SELECT * FROM public.treatments;
```

**Copie medications → medicationsv2:**
```sql
INSERT INTO public.medicationsv2 (
  id, treatmentid, referencecacheid,
  officialname, officialstrength, pharmaceuticalform, ciscode,
  username, pathologyid, posology, times, unitspertake,
  initialstock, currentstock, minthreshold, expirydate, batchnumber,
  usernotes, photourl, createdat, updatedat
)
SELECT
  m.id,
  m.treatmentid,
  NULL::uuid AS referencecacheid, -- À enrichir ultérieurement
  COALESCE(mc.name, m.name) AS officialname,
  COALESCE(mc.defaultdosage, m.dosage) AS officialstrength,
  NULL AS pharmaceuticalform,
  NULL AS ciscode,
  CASE 
    WHEN m.name IS NOT NULL 
      AND mc.name IS NOT NULL 
      AND m.name <> mc.name 
    THEN m.name 
  END AS username,
  m.pathologyid,
  m.posology,
  m.times,
  COALESCE(m.unitspertake, 1) AS unitspertake,
  COALESCE(m.initialstock, 0) AS initialstock,
  COALESCE(m.currentstock, 0) AS currentstock,
  COALESCE(m.minthreshold, 0) AS minthreshold,
  m.expirydate,
  m.batchnumber,
  m.usernotes,
  m.photourl,
  m.createdat,
  m.updatedat
FROM public.medications m
LEFT JOIN public.medicationcatalog mc ON mc.id = m.catalogid;
```

**Copie medicationintakes → medicationintakesv2:**
```sql
INSERT INTO public.medicationintakesv2 (
  id, medicationid, takendatetime, planned, taken, units, createdat
)
SELECT 
  id, medicationid, takendatetime, 
  COALESCE(planned, false), 
  COALESCE(taken, true), 
  COALESCE(units, 1), 
  createdat
FROM public.medicationintakes;
```

#### 6.4. Vérifications d'intégrité

**Comptages:**
```sql
-- Vérifier que tous les enregistrements ont été copiés
SELECT 
  (SELECT COUNT(*) FROM medications) AS v1_medications,
  (SELECT COUNT(*) FROM medicationsv2) AS v2_medications,
  (SELECT COUNT(*) FROM medicationintakes) AS v1_intakes,
  (SELECT COUNT(*) FROM medicationintakesv2) AS v2_intakes;
```

**Orphelines FK:**
```sql
-- Vérifier qu'aucune prise n'est orpheline
SELECT COUNT(*) 
FROM medicationintakesv2 i 
LEFT JOIN medicationsv2 m ON m.id = i.medicationid 
WHERE m.id IS NULL;
-- Doit retourner 0

-- Vérifier qu'aucun médicament n'est orphelin
SELECT COUNT(*) 
FROM medicationsv2 m 
LEFT JOIN treatments t ON t.id = m.treatmentid 
WHERE t.id IS NULL;
-- Doit retourner 0
```

**Validation manuelle:**
- Sélectionner 10 médicaments aléatoires et vérifier que les données sont identiques entre v1 et v2
- Vérifier que les stocks correspondent
- Vérifier que les prises sont liées correctement

#### 6.5. Normalisation des pathologies
```sql
-- Si des pathologies textuelles existent dans medications, les insérer dans pathologiesv2
INSERT INTO public.pathologiesv2 (name, description)
SELECT DISTINCT 
  m.pathology_text AS name,
  NULL AS description
FROM public.medications m
WHERE m.pathology_text IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM pathologiesv2 p 
    WHERE p.name = m.pathology_text
  );

-- Lier les médicaments aux nouvelles pathologies
UPDATE public.medicationsv2 mv2
SET pathologyid = (
  SELECT id FROM pathologiesv2 p 
  WHERE p.name = (
    SELECT m.pathology_text 
    FROM medications m 
    WHERE m.id = mv2.id
  )
)
WHERE mv2.pathologyid IS NULL;
```

---

<a name="integration"></a>
## 7. Intégration BDPM + DataMatrix

### 7.1. Base de Données Publique des Médicaments (BDPM)

**Source officielle:** ANSM (Agence Nationale de Sécurité du Médicament)  
**URL:** https://base-donnees-publique.medicaments.gouv.fr/telechargement

**Fichiers disponibles:**
- `CIS_bdpm.txt`: Spécialités (Code CIS, nom, forme, voies d'administration, statut AMM)
- `CIS_CIP_bdpm.txt`: Correspondances CIS ↔ CIP13 (présentations)
- `CIS_COMPO_bdpm.txt`: Compositions
- `CIS_HAS_SMR_bdpm.txt`: Avis SMR/ASMR
- `CIS_GENER_bdpm.txt`: Médicaments génériques

**Format:** CSV avec séparateur `\t` (tabulation)

**Licence:** Licence Ouverte (utilisation gratuite avec citation de source)

**Synchronisation:**
- Téléchargement initial des fichiers
- Parsing et insertion dans `medicationreferencecache`
- Mise à jour mensuelle (BDPM actualisée mensuellement)
- Refresh différé des entrées dont `lastsyncedat > 30 jours`

### 7.2. Parsing DataMatrix GS1

**Format:** Code 2D GS1 DataMatrix sur les boîtes de médicaments  
**Identifiants d'application (IA) GS1:**
- `(01)`: GTIN/CIP13 (14 chiffres, commence par 3400 en France)
- `(17)`: Date d'expiration (format AAMMJJ)
- `(10)`: Numéro de lot (longueur variable)

**Exemple de payload:**
```
(01)03400936470392(17)251231(10)LOT12345
```

**Extraction:**
- Scanner le DataMatrix avec ML Kit ou ZXing
- Parser les IA via regex
- Mapper CIP13 → CIS via fichier `CIS_CIP_bdpm.txt`
- Récupérer la fiche médicament depuis le cache ou BDPM
- Préremplir les champs `expirydate` et `batchnumber`

---

<a name="backend"></a>
## 8. Services backend et synchronisation

### 8.1. Service MedicationAPI

**Principe:** Cache-first, puis BDPM si trou, avec upsert systématique dans le cache.

**Méthodes principales:**

#### searchMedications(query: string)
1. Recherche dans `medicationreferencecache` (ILIKE + full-text search)
2. Si résultats trouvés → retourner immédiatement
3. Sinon, interroger BDPM via parsing CSV ou API tierce
4. Upsert dans le cache avec `cachesource='api'`
5. Retourner les résultats

**Latence cible:** < 500 ms (cache) / < 2 s (fetch BDPM)

#### getMedicationByCIS(cis: string)
1. Recherche dans `medicationreferencecache` par `ciscode`
2. Vérifier fraîcheur: si `lastsyncedat > 30 jours` → stale
3. Si absent ou stale, fetch BDPM
4. Upsert dans le cache
5. Retourner la fiche

#### createFromDataMatrix(payload: string, treatmentId: string)
1. Parser GS1: extraire (01), (17), (10)
2. Mapper CIP13 → CIS via fichier ou API BDPM
3. Vérifier présence dans le cache
4. Si absent, fetch BDPM et upsert
5. Créer `medicationsv2` avec:
   - `referencecacheid`
   - Copies minimales (`officialname`, `officialstrength`, etc.)
   - `expirydate` (depuis IA 17)
   - `batchnumber` (depuis IA 10)
6. Retourner la fiche créée

### 8.2. Tâche planifiée de synchronisation

**Fréquence:** Hebdomadaire (chaque dimanche à 2h00)

**Logique:**
```sql
-- Identifier les entrées stales
SELECT * FROM medicationreferencecache
WHERE cachesource = 'api'
  AND lastsyncedat < (NOW() - INTERVAL '30 days');

-- Pour chaque entrée:
--   1. Fetch BDPM par CIS
--   2. Merge les données officielles (ne pas écraser les champs custom)
--   3. Mettre à jour lastsyncedat
```

**Important:** Ne jamais écraser les champs utilisateur dans `medicationsv2` lors du refresh.

---

<a name="endpoints"></a>
## 9. Endpoints API (Edge Functions)

### POST /medications/search

**Body:**
```json
{
  "query": "xigduo"
}
```

**Réponse:**
```json
{
  "results": [
    {
      "id": "uuid",
      "ciscode": "62345678",
      "officialname": "XIGDUO",
      "strength": "5mg/1000mg",
      "pharmaceuticalform": "comprimé",
      "laboratory": "AstraZeneca"
    }
  ]
}
```

### GET /medications/:cis

**Paramètres:** `cis` (code CIS)

**Réponse:**
```json
{
  "id": "uuid",
  "ciscode": "62345678",
  "officialname": "XIGDUO",
  "strength": "5mg/1000mg",
  "pharmaceuticalform": "comprimé",
  "atccode": "A10BD15",
  "laboratory": "AstraZeneca",
  "marketingstatus": "Commercialisée",
  "officialdata": { /* données brutes BDPM */ }
}
```

### POST /medications/datamatrix

**Body:**
```json
{
  "payload": "(01)03400936470392(17)251231(10)LOT12345",
  "treatmentId": "uuid"
}
```

**Réponse:**
```json
{
  "medication": {
    "id": "uuid",
    "referencecacheid": "uuid",
    "officialname": "XIGDUO",
    "strength": "5mg/1000mg",
    "pharmaceuticalform": "comprimé",
    "expirydate": "2025-12-31",
    "batchnumber": "LOT12345",
    "currentstock": 0
  }
}
```

---

<a name="frontend"></a>
## 10. Frontend — Wizard et refonte

### 10.1. Wizard d'ajout unifié

**Étape 1: Choix de la méthode**
- Scanner la boîte (DataMatrix)
- Rechercher par nom
- Saisir manuellement

**Étape 2: Sélection/Résultats**
- Si scan → parsing automatique, affichage de la fiche pré-remplie
- Si recherche → liste de résultats depuis cache/BDPM
- Si saisie manuelle → formulaire vide

**Étape 3: Personnalisation**
- Nom personnalisé (optionnel, si différent de l'officiel)
- Pathologie associée (sélection depuis `pathologies`)
- Posologie (texte libre + parsing intelligent)
- Horaires de prise (widget de sélection multiple)
- Unités par prise (nombre)
- Stock initial et seuil d'alerte
- Date de péremption (préremplie si scan)
- Numéro de lot (prérempli si scan)
- Notes personnelles
- Photo de la boîte

**Étape 4: Confirmation**
- Récapitulatif
- Validation
- Création dans `medicationsv2`

### 10.2. Composants impactés (17 fichiers)

**À refactoriser:**
- `MedicationWizard.tsx`: Nouvelle logique (scan/recherche/saisie)
- `MedicationSearch.tsx`: Interrogation cache/BDPM via endpoint
- `MedicationForm.tsx`: Utilisation de `referencecacheid` au lieu de `catalogid`
- `MedicationCard.tsx`: Affichage depuis copies minimales ou join cache
- `MedicationList.tsx`: idem
- `MedicationDetail.tsx`: idem
- Hooks: `useMedications.ts`, `useMedicationIntakes.ts`

**À supprimer:**
- Écrans de gestion du catalogue (`CatalogManagement.tsx`, `CatalogAdmin.tsx`, etc.)
- Hooks liés au catalogue

### 10.3. Offline et synchronisation

**Lecture offline:**
- Affichage depuis les copies minimales dans `medicationsv2` (`officialname`, `officialstrength`, `pharmaceuticalform`)
- Join avec `medicationreferencecache` uniquement si online pour enrichissement

**Ajout offline:**
- Impossible de scanner/rechercher sans connexion
- Possibilité de saisie manuelle uniquement
- Création avec `referencecacheid = NULL` et `cachesource='manual'`

---

<a name="securite"></a>
## 11. Sécurité, RLS, gouvernance

### 11.1. RLS (Row Level Security)

#### medicationreferencecache
```sql
-- Lecture: tous les utilisateurs authentifiés
CREATE POLICY medref_select ON public.medicationreferencecache
  FOR SELECT USING (auth.role() = 'authenticated');

-- Écriture: service_role uniquement (backend)
CREATE POLICY medref_write ON public.medicationreferencecache
  FOR INSERT TO service_role USING (true) WITH CHECK (true);

CREATE POLICY medref_update ON public.medicationreferencecache
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
```

#### medicationsv2
```sql
-- Appartenance via treatments → userid
CREATE POLICY meds_select ON public.medicationsv2
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.treatments t
      WHERE t.id = medicationsv2.treatmentid
        AND t.userid = auth.uid()
    )
  );

CREATE POLICY meds_cud ON public.medicationsv2
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.treatments t
      WHERE t.id = medicationsv2.treatmentid
        AND t.userid = auth.uid()
    )
  ) WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.treatments t
      WHERE t.id = medicationsv2.treatmentid
        AND t.userid = auth.uid()
    )
  );
```

#### medicationintakesv2
```sql
-- Appartenance via medications → treatments → userid
CREATE POLICY intakes_select ON public.medicationintakesv2
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.medicationsv2 m
      JOIN public.treatments t ON t.id = m.treatmentid
      WHERE m.id = medicationintakesv2.medicationid
        AND t.userid = auth.uid()
    )
  );

CREATE POLICY intakes_cud ON public.medicationintakesv2
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.medicationsv2 m
      JOIN public.treatments t ON t.id = m.treatmentid
      WHERE m.id = medicationintakesv2.medicationid
        AND t.userid = auth.uid()
    )
  ) WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.medicationsv2 m
      JOIN public.treatments t ON t.id = m.treatmentid
      WHERE m.id = medicationintakesv2.medicationid
        AND t.userid = auth.uid()
    )
  );
```

### 11.2. Gouvernance des données

**Séparation nette:**
- Référentiel (`medicationreferencecache`): données publiques, communes à tous
- Données personnelles (`medicationsv2`, `medicationintakesv2`): scopées par user

**Traçabilité:**
- `officialdata` (JSONB): conservation des données brutes BDPM
- `lastsyncedat`: horodatage de dernière synchronisation
- `cachesource`: origine de la donnée (api/datamatrix/manual)

**Conformité RGPD:**
- Aucune donnée personnelle dans le cache
- Données perso strictement filtrées par RLS
- Droit à l'oubli: suppression en cascade via FK

**Mentions légales:**
- Citer la source BDPM dans l'écran "À propos"
- Mentionner la date de dernière mise à jour
- Ne pas dénaturer les données officielles

---

<a name="tests"></a>
## 12. Tests (unitaires, E2E)

### 12.1. Tests unitaires

**Parsing GS1:**
```typescript
describe('parseGS1', () => {
  it('should extract GTIN from (01)', () => {
    const result = parseGS1('(01)03400936470392(17)251231(10)LOT12345');
    expect(result.gtin).toBe('03400936470392');
  });

  it('should extract expiry date from (17)', () => {
    const result = parseGS1('(01)03400936470392(17)251231(10)LOT12345');
    expect(result.expiry).toEqual(new Date(2025, 11, 31)); // Mois 0-indexed
  });

  it('should extract batch number from (10)', () => {
    const result = parseGS1('(01)03400936470392(17)251231(10)LOT12345');
    expect(result.batch).toBe('LOT12345');
  });
});
```

**Mapping CIP13 → CIS:**
```typescript
describe('mapCIP13toCIS', () => {
  it('should map valid CIP13 to CIS', async () => {
    const cis = await bdpm.mapCIP13toCIS('03400936470392');
    expect(cis).toBe('62345678');
  });

  it('should throw error for invalid CIP13', async () => {
    await expect(bdpm.mapCIP13toCIS('00000000000000')).rejects.toThrow();
  });
});
```

**Upsert cache:**
```typescript
describe('upsertCache', () => {
  it('should insert new medication in cache', async () => {
    const medication = {
      ciscode: '62345678',
      officialname: 'XIGDUO',
      strength: '5mg/1000mg',
      pharmaceuticalform: 'comprimé'
    };
    const result = await upsertCache([medication], 'api');
    expect(result[0].ciscode).toBe('62345678');
  });

  it('should update existing medication on conflict', async () => {
    // Insert initial
    await upsertCache([{ ciscode: '62345678', officialname: 'XIGDUO' }], 'api');
    
    // Update with new data
    const updated = await upsertCache([
      { ciscode: '62345678', officialname: 'XIGDUO XR' }
    ], 'api');
    
    expect(updated[0].officialname).toBe('XIGDUO XR');
  });
});
```

### 12.2. Tests E2E

**Ajout par recherche:**
```typescript
describe('Add medication by search', () => {
  it('should search and add medication from cache', async () => {
    // 1. Rechercher
    const results = await searchMedications('xigduo');
    expect(results.length).toBeGreaterThan(0);
    
    // 2. Sélectionner
    const selected = results[0];
    
    // 3. Personnaliser et créer
    const medication = await createMedication({
      treatmentId: 'uuid',
      referencecacheid: selected.id,
      posology: '1 comprimé matin et soir',
      times: [{ hour: 8, minute: 0 }, { hour: 20, minute: 0 }],
      initialstock: 30
    });
    
    expect(medication.officialname).toBe('XIGDUO');
    expect(medication.currentstock).toBe(30);
  });
  
  it('should have latency < 500ms for cache hit', async () => {
    const start = Date.now();
    await searchMedications('xigduo');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
});
```

**Ajout par scan:**
```typescript
describe('Add medication by scan', () => {
  it('should parse DataMatrix and create medication', async () => {
    const payload = '(01)03400936470392(17)251231(10)LOT12345';
    const medication = await createFromDataMatrix(payload, 'treatment-uuid');
    
    expect(medication.officialname).toBe('XIGDUO');
    expect(medication.expirydate).toEqual(new Date(2025, 11, 31));
    expect(medication.batchnumber).toBe('LOT12345');
  });
});
```

**Non-régression prises et stock:**
```typescript
describe('Intakes and stock management', () => {
  it('should decrement stock after intake', async () => {
    // Créer médicament avec stock initial
    const medication = await createMedication({
      treatmentId: 'uuid',
      initialstock: 30,
      currentstock: 30
    });
    
    // Enregistrer prise
    await createIntake({
      medicationid: medication.id,
      units: 1
    });
    
    // Vérifier décrément
    const updated = await getMedication(medication.id);
    expect(updated.currentstock).toBe(29);
  });
  
  it('should trigger alert when below threshold', async () => {
    const medication = await createMedication({
      currentstock: 5,
      minthreshold: 10
    });
    
    const alerts = await getStockAlerts();
    expect(alerts).toContainEqual(
      expect.objectContaining({ medicationid: medication.id })
    );
  });
});
```

**Offline:**
```typescript
describe('Offline mode', () => {
  it('should display medications from local copies when offline', async () => {
    // Simuler offline
    mockNetworkOffline();
    
    // Récupérer liste
    const medications = await getMedications();
    
    // Vérifier que les copies minimales sont affichées
    expect(medications[0].officialname).toBeDefined();
    expect(medications[0].officialstrength).toBeDefined();
  });
  
  it('should allow manual entry when offline', async () => {
    mockNetworkOffline();
    
    const medication = await createMedication({
      treatmentId: 'uuid',
      officialname: 'Aspirine',
      officialstrength: '500mg',
      referencecacheid: null // Pas de lien vers cache
    });
    
    expect(medication.officialname).toBe('Aspirine');
  });
});
```

---

<a name="execution"></a>
## 13. Plan d'exécution et calendrier

### Prérequis
- Créer branche: `feature/phase8-medications-refactor`
- Environnement de test avec copie de la prod
- Accès BDPM (téléchargement initial des fichiers)

### Phase 8.1 — Migration BDD (2 jours)

**Jour 1:**
- ✅ Backups complets (medications, medicationintakes, medicationcatalog)
- ✅ Création `medicationreferencecache` + index + RLS
- ✅ Création `medicationsv2` + index + RLS + triggers
- ✅ Création `medicationintakesv2` + index + RLS
- ✅ Scripts de migration (copie v1 → v2)

**Jour 2:**
- ✅ Exécution des scripts de copie
- ✅ Vérifications d'intégrité (counts, orphelines, FK)
- ✅ Tests manuels sur 10 enregistrements aléatoires
- ✅ Validation finale

**Livrables:**
- Tables v2 créées et peuplées
- Rapport de migration avec counts et checks
- Scripts SQL versionnés

---

### Phase 8.2 — Backend (2-3 jours)

**Jour 1:**
- ✅ Téléchargement et parsing initial BDPM
- ✅ Population du cache (insertion initiale)
- ✅ Service `searchMedications` (cache-first)
- ✅ Service `getMedicationByCIS` (refresh si stale)

**Jour 2:**
- ✅ Parsing GS1 DataMatrix (01/17/10)
- ✅ Mapping CIP13 → CIS
- ✅ Service `createFromDataMatrix`
- ✅ Tests unitaires (parsing, mapping, upsert)

**Jour 3:**
- ✅ Endpoints Edge Functions (search, :cis, datamatrix)
- ✅ Tâche planifiée de synchronisation hebdomadaire
- ✅ Tests d'intégration backend
- ✅ Documentation API

**Livrables:**
- Services backend opérationnels
- Endpoints testés et documentés
- Cache BDPM initialisé

---

### Phase 8.3 — Frontend (2-3 jours)

**Jour 1:**
- ✅ Nouveau wizard d'ajout (structure et routing)
- ✅ Étape 1: Choix méthode (scan/recherche/saisie)
- ✅ Étape 2: Résultats (intégration endpoints)

**Jour 2:**
- ✅ Étape 3: Personnalisation (formulaire complet)
- ✅ Étape 4: Confirmation et création
- ✅ Intégration scan DataMatrix (ML Kit/ZXing)

**Jour 3:**
- ✅ Refactorisation composants existants (Card, List, Detail)
- ✅ Mise à jour hooks (useMedications, useMedicationIntakes)
- ✅ Suppression écrans catalogue
- ✅ Feature flags (ENABLE_MEDICATIONS_V2)

**Livrables:**
- Wizard fonctionnel (scan/recherche/saisie)
- Composants migrés vers v2
- Feature flags configurés

---

### Phase 8.4 — Tests & Rollout (1-2 jours)

**Jour 1:**
- ✅ Suite de tests E2E (ajout, prises, stock, alertes)
- ✅ Tests de performance (latence cache, fetch BDPM)
- ✅ Tests offline (affichage, saisie manuelle)
- ✅ Tests de régression (non-régression fonctionnalités existantes)

**Jour 2:**
- ✅ Canary rollout 10% (activation feature flag)
- ✅ Monitoring erreurs et latence
- ✅ Collecte feedback utilisateurs
- ✅ Rollout progressif 50% → 100%

**Livrables:**
- Tests E2E validés
- Rollout progressif réussi
- Documentation utilisateur

---

### Calendrier global

| Phase | Durée | Dates estimées |
|-------|-------|----------------|
| 8.1 Migration BDD | 2 j | J1-J2 |
| 8.2 Backend | 2-3 j | J3-J5 |
| 8.3 Frontend | 2-3 j | J6-J8 |
| 8.4 Tests & Rollout | 1-2 j | J9-J10 |
| **TOTAL** | **7-10 jours** | **~2 semaines** |

---

<a name="checklists"></a>
## 14. Checklists de validation

### Avant bascule (validation Phase 8.1-8.3)

**BDD:**
- [ ] Tables v2 créées avec toutes les colonnes
- [ ] Index créés (ciscode, treatmentid, medicationid, etc.)
- [ ] RLS configurés et testés
- [ ] Triggers créés et fonctionnels (décrément stock)
- [ ] Copie des données terminée
- [ ] Counts v1 vs v2 identiques
- [ ] Aucune orpheline FK
- [ ] 10 enregistrements aléatoires validés manuellement

**Backend:**
- [ ] Cache BDPM initialisé (> 10 000 entrées)
- [ ] Endpoint `/medications/search` testé (cache + fetch)
- [ ] Endpoint `/medications/:cis` testé (refresh si stale)
- [ ] Endpoint `/medications/datamatrix` testé (parsing GS1)
- [ ] Tâche planifiée configurée (hebdomadaire)
- [ ] Tests unitaires passent (parsing, mapping, upsert)

**Frontend:**
- [ ] Wizard accessible et fonctionnel
- [ ] Scan DataMatrix opérationnel (caméra + parsing)
- [ ] Recherche par nom fonctionnelle
- [ ] Saisie manuelle fonctionnelle
- [ ] Personnalisation complète (posologie, horaires, stock, notes, photo)
- [ ] Composants migrés (Card, List, Detail)
- [ ] Écrans catalogue supprimés
- [ ] Feature flags configurés

---

### Après bascule canary (validation Phase 8.4)

**Fonctionnel:**
- [ ] Aucune régression sur les prises existantes
- [ ] Aucune régression sur les stocks
- [ ] Aucune régression sur les alertes
- [ ] Ajout par recherche fonctionnel (latence < 500 ms cache)
- [ ] Ajout par scan fonctionnel (préremplissage lot/exp)
- [ ] Ajout manuel fonctionnel (offline compatible)

**Performance:**
- [ ] Latence recherche cache < 500 ms
- [ ] Latence fetch BDPM < 2 s
- [ ] Pas de dégradation temps de chargement listes
- [ ] Offline consultable (copies minimales)

**Monitoring:**
- [ ] Taux d'erreurs < 0.5%
- [ ] Aucune erreur critique (500, timeout)
- [ ] Logs DataMatrix parsing OK (taux de succès > 95%)
- [ ] Logs refresh BDPM OK

**Feedback utilisateurs:**
- [ ] NPS > 8/10
- [ ] Aucun feedback bloquant
- [ ] Wizard jugé intuitif

---

### Validation finale (100% rollout)

- [ ] Toutes les checklist canary validées
- [ ] 0 erreur critique sur 48h
- [ ] Feedback utilisateurs positif
- [ ] Documentation utilisateur publiée
- [ ] Documentation technique à jour

---

<a name="rollback"></a>
## 15. Rollback

### Principe
En cas d'anomalie majeure, rollback instantané en repointant le code sur les tables v1 sans suppression des v2.

### Procédure

**Étape 1: Désactivation feature flag**
```typescript
// Repasser ENABLE_MEDICATIONS_V2 à false
```

**Étape 2: Repoint backend**
```typescript
// Dans les services, rebasculer sur tables v1:
// - medications (au lieu de medicationsv2)
// - medicationintakes (au lieu de medicationintakesv2)
```

**Étape 3: Repoint frontend**
```typescript
// Dans les hooks, rebasculer sur tables v1
// Réactiver les écrans catalogue si nécessaire
```

**Étape 4: Monitoring**
- Vérifier que l'app fonctionne normalement avec v1
- Analyser les logs pour identifier la cause du rollback

**Étape 5: Conservation v2**
- Ne pas supprimer les tables v2
- Conserver pour analyse et correction
- Planifier une nouvelle tentative après correction

### Critères de rollback

**Rollback immédiat si:**
- Taux d'erreurs > 5%
- Perte de données constatée
- Impossibilité d'ajouter/consulter médicaments
- Régression critique sur prises/stocks
- Timeout généralisés (> 5 s)

**Rollback différé si:**
- Feedback utilisateurs très négatifs (NPS < 5/10)
- Bugs non bloquants mais nombreux
- Performance dégradée (latence x2)

---

<a name="annexes"></a>
## 16. Annexes techniques

### A. SQL — Création complète des tables v2

```sql
-- ============================================
-- MEDICATIONREFERENCECACHE
-- ============================================
CREATE TABLE IF NOT EXISTS public.medicationreferencecache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ciscode TEXT UNIQUE NOT NULL,
  cis13code TEXT,
  officialname TEXT NOT NULL,
  strength TEXT,
  pharmaceuticalform TEXT,
  administrationroute TEXT,
  atccode TEXT,
  laboratory TEXT,
  marketingstatus TEXT,
  marketingauthorizationdate DATE,
  officialdata JSONB,
  cachesource TEXT CHECK (cachesource IN ('api','datamatrix','manual')) DEFAULT 'api',
  lastsyncedat TIMESTAMPTZ DEFAULT NOW(),
  createdat TIMESTAMPTZ DEFAULT NOW(),
  updatedat TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_medref_ciscode ON public.medicationreferencecache(ciscode);
CREATE INDEX IF NOT EXISTS idx_medref_atccode ON public.medicationreferencecache(atccode);
CREATE INDEX IF NOT EXISTS idx_medref_name_search ON public.medicationreferencecache 
  USING GIN (to_tsvector('french', officialname));

-- ============================================
-- MEDICATIONSV2
-- ============================================
CREATE TABLE IF NOT EXISTS public.medicationsv2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatmentid UUID NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  referencecacheid UUID REFERENCES public.medicationreferencecache(id),
  -- Copies minimales pour offline
  officialname TEXT,
  officialstrength TEXT,
  pharmaceuticalform TEXT,
  ciscode TEXT,
  -- Personnalisation utilisateur
  username TEXT,
  pathologyid UUID REFERENCES public.pathologies(id),
  posology TEXT,
  times JSONB,
  unitspertake NUMERIC DEFAULT 1 CHECK (unitspertake > 0),
  -- Stocks
  initialstock INTEGER DEFAULT 0 CHECK (initialstock >= 0),
  currentstock INTEGER DEFAULT 0 CHECK (currentstock >= 0),
  minthreshold INTEGER DEFAULT 0 CHECK (minthreshold >= 0),
  -- Traçabilité boîte
  expirydate DATE,
  batchnumber TEXT,
  -- Autres
  usernotes TEXT,
  photourl TEXT,
  createdat TIMESTAMPTZ DEFAULT NOW(),
  updatedat TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_meds_treatmentid ON public.medicationsv2(treatmentid);
CREATE INDEX IF NOT EXISTS idx_meds_referencecacheid ON public.medicationsv2(referencecacheid);
CREATE INDEX IF NOT EXISTS idx_meds_pathologyid ON public.medicationsv2(pathologyid);

-- ============================================
-- MEDICATIONINTAKESV2
-- ============================================
CREATE TABLE IF NOT EXISTS public.medicationintakesv2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicationid UUID NOT NULL REFERENCES public.medicationsv2(id) ON DELETE CASCADE,
  takendatetime TIMESTAMPTZ NOT NULL,
  planned BOOLEAN DEFAULT false,
  taken BOOLEAN DEFAULT true,
  units NUMERIC DEFAULT 1 CHECK (units > 0),
  createdat TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_intakes_medicationid ON public.medicationintakesv2(medicationid);
CREATE INDEX IF NOT EXISTS idx_intakes_takendatetime ON public.medicationintakesv2(takendatetime);

-- ============================================
-- TRIGGER: Décrément stock après prise
-- ============================================
CREATE OR REPLACE FUNCTION public.decrement_stock_after_intake()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.medicationsv2
     SET currentstock = GREATEST(0, currentstock - NEW.units),
         updatedat = NOW()
   WHERE id = NEW.medicationid;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_decrement_stock_after_intake ON public.medicationintakesv2;
CREATE TRIGGER trg_decrement_stock_after_intake
AFTER INSERT ON public.medicationintakesv2
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_after_intake();
```

---

### B. SQL — RLS (Row Level Security)

```sql
-- ============================================
-- RLS: medicationreferencecache
-- ============================================
ALTER TABLE public.medicationreferencecache ENABLE ROW LEVEL SECURITY;

-- Lecture: tous les utilisateurs authentifiés
CREATE POLICY medref_select ON public.medicationreferencecache
  FOR SELECT USING (auth.role() = 'authenticated');

-- Écriture: service_role uniquement
CREATE POLICY medref_write ON public.medicationreferencecache
  FOR INSERT TO service_role USING (true) WITH CHECK (true);

CREATE POLICY medref_update ON public.medicationreferencecache
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- RLS: medicationsv2
-- ============================================
ALTER TABLE public.medicationsv2 ENABLE ROW LEVEL SECURITY;

-- Appartenance via treatments → userid
CREATE POLICY meds_select ON public.medicationsv2
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.treatments t
      WHERE t.id = medicationsv2.treatmentid
        AND t.userid = auth.uid()
    )
  );

CREATE POLICY meds_cud ON public.medicationsv2
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.treatments t
      WHERE t.id = medicationsv2.treatmentid
        AND t.userid = auth.uid()
    )
  ) WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.treatments t
      WHERE t.id = medicationsv2.treatmentid
        AND t.userid = auth.uid()
    )
  );

-- ============================================
-- RLS: medicationintakesv2
-- ============================================
ALTER TABLE public.medicationintakesv2 ENABLE ROW LEVEL SECURITY;

-- Appartenance via medications → treatments → userid
CREATE POLICY intakes_select ON public.medicationintakesv2
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM public.medicationsv2 m
      JOIN public.treatments t ON t.id = m.treatmentid
      WHERE m.id = medicationintakesv2.medicationid
        AND t.userid = auth.uid()
    )
  );

CREATE POLICY intakes_cud ON public.medicationintakesv2
  FOR ALL USING (
    EXISTS(
      SELECT 1 FROM public.medicationsv2 m
      JOIN public.treatments t ON t.id = m.treatmentid
      WHERE m.id = medicationintakesv2.medicationid
        AND t.userid = auth.uid()
    )
  ) WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.medicationsv2 m
      JOIN public.treatments t ON t.id = m.treatmentid
      WHERE m.id = medicationintakesv2.medicationid
        AND t.userid = auth.uid()
    )
  );
```

---

### C. TypeScript — Services backend

```typescript
// ============================================
// MedicationAPIService.ts
// ============================================

import { supabase } from './supabase';
import { parseGS1 } from './gs1';
import { bdpm } from './bdpm';

export interface MedicationReference {
  id: string;
  ciscode: string;
  officialname: string;
  strength?: string;
  pharmaceuticalform?: string;
  atccode?: string;
  laboratory?: string;
}

// ============================================
// searchMedications (cache-first)
// ============================================
export async function searchMedications(query: string): Promise<MedicationReference[]> {
  // 1. Recherche dans le cache local
  const { data: cached, error } = await supabase
    .from('medicationreferencecache')
    .select('*')
    .or(`officialname.ilike.%${query}%,laboratory.ilike.%${query}%`)
    .limit(20);

  if (error) throw error;

  if (cached && cached.length > 0) {
    return cached;
  }

  // 2. Si rien dans le cache, interroger BDPM
  const official = await bdpm.search(query);

  // 3. Upsert dans le cache
  const upserted = await upsertCache(official, 'api');

  return upserted;
}

// ============================================
// getMedicationByCIS (refresh si stale)
// ============================================
export async function getMedicationByCIS(cis: string): Promise<MedicationReference> {
  const { data: ref, error } = await supabase
    .from('medicationreferencecache')
    .select('*')
    .eq('ciscode', cis)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  // Vérifier fraîcheur (30 jours)
  const stale = ref && (Date.now() - new Date(ref.lastsyncedat).getTime()) > 30 * 24 * 3600 * 1000;

  if (!ref || stale) {
    // Fetch BDPM
    const official = await bdpm.getByCIS(cis);
    const [upserted] = await upsertCache([official], 'api');
    return upserted;
  }

  return ref;
}

// ============================================
// createFromDataMatrix (scan GS1)
// ============================================
export async function createFromDataMatrix(
  payload: string,
  treatmentId: string
): Promise<any> {
  // 1. Parser GS1
  const parsed = parseGS1(payload);

  if (!parsed.gtin) {
    throw new Error('Invalid DataMatrix: GTIN not found');
  }

  // 2. Mapper CIP13 → CIS
  const cis = await bdpm.mapCIP13toCIS(parsed.gtin);

  // 3. Vérifier cache
  let ref = await getMedicationByCIS(cis);

  // 4. Créer medicationsv2
  const { data: medication, error } = await supabase
    .from('medicationsv2')
    .insert({
      treatmentid: treatmentId,
      referencecacheid: ref.id,
      officialname: ref.officialname,
      officialstrength: ref.strength,
      pharmaceuticalform: ref.pharmaceuticalform,
      ciscode: ref.ciscode,
      expirydate: parsed.expiry,
      batchnumber: parsed.batch,
      currentstock: 0,
      minthreshold: 0
    })
    .select()
    .single();

  if (error) throw error;

  return medication;
}

// ============================================
// upsertCache (insertion/mise à jour)
// ============================================
async function upsertCache(
  medications: any[],
  source: 'api' | 'datamatrix' | 'manual'
): Promise<MedicationReference[]> {
  const { data, error } = await supabase
    .from('medicationreferencecache')
    .upsert(
      medications.map(m => ({
        ciscode: m.ciscode,
        cis13code: m.cis13code,
        officialname: m.officialname,
        strength: m.strength,
        pharmaceuticalform: m.pharmaceuticalform,
        administrationroute: m.administrationroute,
        atccode: m.atccode,
        laboratory: m.laboratory,
        marketingstatus: m.marketingstatus,
        marketingauthorizationdate: m.marketingauthorizationdate,
        officialdata: m,
        cachesource: source,
        lastsyncedat: new Date().toISOString()
      })),
      { onConflict: 'ciscode' }
    )
    .select();

  if (error) throw error;

  return data;
}
```

---

### D. TypeScript — Parsing GS1 DataMatrix

```typescript
// ============================================
// gs1.ts — Parsing GS1 DataMatrix
// ============================================

export interface GS1Parsed {
  gtin?: string;
  expiry?: Date;
  batch?: string;
}

/**
 * Parse GS1 DataMatrix payload
 * Exemple: "(01)03400936470392(17)251231(10)LOT12345"
 */
export function parseGS1(raw: string): GS1Parsed {
  const out: GS1Parsed = {};

  // (01) GTIN / CIP13 (14 chiffres)
  const m01 = raw.match(/\(01\)(\d{14})/);
  if (m01) {
    out.gtin = m01[1];
  }

  // (17) Expiry YYMMDD
  const m17 = raw.match(/\(17\)(\d{6})/);
  if (m17) {
    const yy = 2000 + parseInt(m17[1].slice(0, 2), 10);
    const mm = parseInt(m17[1].slice(2, 4), 10) - 1; // Mois 0-indexed
    const dd = parseInt(m17[1].slice(4, 6), 10);
    out.expiry = new Date(yy, mm, dd);
  }

  // (10) Batch (longueur variable)
  const m10 = raw.match(/\(10\)([^\(]+)/);
  if (m10) {
    out.batch = m10[1].trim();
  }

  return out;
}
```

---

### E. TypeScript — Service BDPM (simplifié)

```typescript
// ============================================
// bdpm.ts — Interface BDPM
// ============================================

export interface BDPMResult {
  ciscode: string;
  cis13code?: string;
  officialname: string;
  strength?: string;
  pharmaceuticalform?: string;
  atccode?: string;
  laboratory?: string;
}

/**
 * Recherche dans les fichiers BDPM téléchargés
 * (ou via API tierce si disponible)
 */
export async function search(query: string): Promise<BDPMResult[]> {
  // TODO: Implémenter parsing CSV ou appel API tierce
  // Exemple: parsing CIS_bdpm.txt avec recherche sur nom
  throw new Error('BDPM search not implemented');
}

/**
 * Récupérer une fiche par code CIS
 */
export async function getByCIS(cis: string): Promise<BDPMResult> {
  // TODO: Implémenter parsing CSV ou appel API tierce
  // Exemple: parsing CIS_bdpm.txt avec filtre sur CIS
  throw new Error('BDPM getByCIS not implemented');
}

/**
 * Mapper CIP13 → CIS via fichier CIS_CIP_bdpm.txt
 */
export async function mapCIP13toCIS(cip13: string): Promise<string> {
  // TODO: Implémenter parsing CIS_CIP_bdpm.txt
  // Format: CIS \t CIP7 \t CIP13 \t ...
  throw new Error('BDPM mapCIP13toCIS not implemented');
}
```

---

### F. Edge Function — POST /medications/search

```typescript
// ============================================
// supabase/functions/medications-search/index.ts
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { searchMedications } from '../_shared/medicationAPI.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response('Invalid query', { status: 400 });
    }

    const results = await searchMedications(query);

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

---

### G. Tâche planifiée — Refresh hebdomadaire

```typescript
// ============================================
// supabase/functions/medications-sync/index.ts
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabase } from '../_shared/supabase.ts';
import { bdpm } from '../_shared/bdpm.ts';

serve(async (req) => {
  try {
    // 1. Identifier les entrées stales (> 30 jours)
    const { data: stale, error } = await supabase
      .from('medicationreferencecache')
      .select('*')
      .eq('cachesource', 'api')
      .lt('lastsyncedat', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());

    if (error) throw error;

    console.log(`Found ${stale.length} stale entries`);

    // 2. Pour chaque entrée, fetch BDPM et upsert
    for (const entry of stale) {
      try {
        const official = await bdpm.getByCIS(entry.ciscode);

        await supabase
          .from('medicationreferencecache')
          .update({
            officialname: official.officialname,
            strength: official.strength,
            pharmaceuticalform: official.pharmaceuticalform,
            atccode: official.atccode,
            laboratory: official.laboratory,
            officialdata: official,
            lastsyncedat: new Date().toISOString(),
            updatedat: new Date().toISOString()
          })
          .eq('id', entry.id);

        console.log(`Synced ${entry.ciscode}`);
      } catch (err) {
        console.error(`Failed to sync ${entry.ciscode}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ synced: stale.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Conclusion

Ce plan de Phase 8 fusionne les meilleures pratiques des deux analyses (Lovable.dev + VSCode Agent) pour garantir:

✅ **Robustesse:** Migration v2 sécurisée avec rollback instantané  
✅ **Performance:** Cache local avec recherche < 500 ms  
✅ **Fiabilité:** Source officielle BDPM avec sync différée  
✅ **UX:** Wizard unifié (scan/recherche/saisie)  
✅ **Offline:** Copies minimales pour consultation hors connexion  
✅ **Gouvernance:** RLS stricte, traçabilité BDPM, conformité RGPD  
✅ **Testabilité:** Suite E2E et unitaires complète

**Prochaines étapes:**
1. Validation du plan par l'équipe
2. Création de la branche `feature/phase8-medications-refactor`
3. Lancement Phase 8.1 (Migration BDD)

---

**Document généré le:** 3 novembre 2025  
**Version:** 1.0 (complète et exécutable)  
**Contact:** Équipe MyHealth+ Dev
