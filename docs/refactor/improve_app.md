# Plan d'améliorations de l'application MyHealthPlus

## 🏠 Page Accueil

### Étape 1 : Correction de l'affichage par défaut ✅
**Status:** Complétée le 29/10/2025

1.1. ✅ Corriger le bug d'affichage "Aujourd'hui" à partir de 00h00 et Configurer l'affichage "Aujourd'hui" en déroulé par défaut :
- **Action réalisée:** Création de `getLocalDateString()` dans `dateUtils.ts` pour éviter les bugs UTC/DST
- **Fichiers modifiés:**
  - `src/lib/dateUtils.ts` : Nouvelles fonctions `getLocalDateString()`, `getStartOfLocalDay()`, `getEndOfLocalDay()`
  - `src/pages/index/Index.tsx` : Section "Aujourd'hui" déroulée par défaut
  - `src/pages/index/components/TodaySection.tsx` : Utilisation de `getLocalDateString()` pour comparaison locale
  - `src/pages/index/components/TomorrowSection.tsx` : Utilisation de `getLocalDateString()` pour comparaison locale
  - `src/pages/index/hooks/useDashboardData.ts` : Gestion des dates en local
- **Résultat:** "Aujourd'hui" s'affiche correctement dès 00h00 sans décalage UTC

1.2. ✅ Revoir la fonction de gestion mutualisée des dates/heures (problème heure été/hiver) :
- **Action réalisée:** Centralisation dans `dateUtils.ts` avec fonctions utilisant `getFullYear()`, `getMonth()`, `getDate()` au lieu de `toISOString()`
- **Résultat:** Plus de décalage horaire, activation correcte à 00h00 pile

### Étape 2 : Configuration des boutons de prises ✅
**Status:** Complétée le 29/10/2025

2.1. ✅ Activer les boutons "Aujourd'hui" à partir de 06h00 et maintenir la section "Demain" désactivée par défaut :
- **Action réalisée:** Ajout de `isIntakeValidationAllowed()` vérifiant l'heure >= 6
- **Fichiers modifiés:**
  - `src/lib/dateUtils.ts` : Fonction `isIntakeValidationAllowed()`
  - `src/pages/index/components/IntakeCard.tsx` : Logique de désactivation basée sur l'heure
  - `src/pages/index/Index.tsx` : Gestion auto-open modale si heure valide
- **Résultat:** Boutons cliquables uniquement de 06h00 à 23h59

2.2. ✅ Implémenter les couleurs d'alerte pour les seuils (garder bleu pour "OK") :
- **Action réalisée:** Ajout de classes conditionnelles selon statut stock
- **Fichiers modifiés:**
  - `src/pages/index/components/IntakeCard.tsx` : Classes `bg-orange-500`, `bg-red-500` pour alertes
- **Résultat:** Alertes visuelles orange/rouge, bleu conservé pour OK

### Étape 3 : Amélioration de l'interface ✅
**Status:** Complétée le 29/10/2025

3.1. ✅ Ajouter la date en grisé à côté des titres "Aujourd'hui" et "Demain"
- **Action réalisée:** Affichage format français avec `date-fns`
- **Fichiers modifiés:**
  - `src/pages/index/components/TodaySection.tsx` : Ajout date formatée en `text-muted-foreground`
  - `src/pages/index/components/TomorrowSection.tsx` : Ajout date formatée en `text-muted-foreground`
- **Résultat:** Dates affichées style "Mercredi 29 Octobre 2025"

## 📅 Page Calendrier

### Étape 4 : Amélioration de l'affichage ✅
**Status:** Complétée le 29/10/2025

4.1. ✅ Ajouter "(Aujourd'hui)" et " | " à côté de la date avant le "0/5"
- **Action réalisée:** Condition avec `getLocalDateString()` pour afficher "(Aujourd'hui)"
- **Fichiers modifiés:**
  - `src/pages/calendar/Calendar.tsx` : Ajout indicateur aujourd'hui
- **Résultat:** Format "Date (Aujourd'hui) | 0/5"

4.2. ✅ Ajouter pastille "!" orange/rouge pour alertes sur page Calendrier :
- **Action réalisée:** Pastilles colorées selon niveau alerte stock
- **Fichiers modifiés:**
  - `src/pages/calendar/components/DayDetailsPanel.tsx` : Classes conditionnelles pour alertes
- **Résultat:** Pastilles discrètes orange/rouge pour signaler alertes

### Étape 5 : Implémentation de la synchronisation calendrier ✅
**Status:** Complétée le 29-30/10/2025 - **PHASE 6**

5.1. ✅ Créer page intermédiaire de sélection des critères
- **Action réalisée:** Page complète `/calendar-sync` avec configuration sync
- **Fichiers créés:**
  - `src/pages/calendar-sync/CalendarSync.tsx` : Page principale avec AppLayout
  - `src/pages/calendar-sync/components/CalendarSelector.tsx` : Sélection calendrier natif
  - `src/pages/calendar-sync/components/PermissionBanner.tsx` : Demande permissions
  - `src/pages/calendar-sync/components/SyncOptions.tsx` : Toggles options sync
  - `src/pages/calendar-sync/components/SyncStatus.tsx` : Status dernière sync
  - `src/pages/calendar-sync/hooks/useCalendarSync.ts` : Logique synchronisation
  - `src/pages/calendar-sync/hooks/useNativeCalendar.ts` : Interaction calendrier natif
  - `src/pages/calendar-sync/hooks/useSyncConfig.ts` : Gestion configuration
  - `src/pages/calendar-sync/hooks/useExportConfig.ts` : Sauvegarde localStorage
  - `src/pages/calendar-sync/utils/dateUtils.ts` : Fonctions timezone Paris
  - `src/pages/calendar-sync/utils/eventMapper.ts` : Mapping événements
  - `src/pages/calendar-sync/types.ts` : Interfaces TypeScript
- **Fichiers modifiés:**
  - `src/App.tsx` : Route `/calendar-sync`
  - `src/pages/admin/dashboard/constants.ts` : Menu "Synchroniser le Calendrier"
- **Packages installés:**
  - `@ebarooni/capacitor-calendar@7.2.0` : Plugin Capacitor calendrier natif
- **Résultat:** Interface complète de configuration avec options sync (prises, visites pharmacie, renouvellements)

5.2. ✅ Implémenter filtres de sélection avant export vers le Calendrier choisi sur le téléphone
- **Action réalisée:** Système de filtrage intelligent avec détection modifications
- **Fonctionnalités:**
  - Sélection calendrier natif (Google Calendar, Samsung Calendar, etc.)
  - Options granulaires : prises médicaments, visites pharmacie, renouvellements
  - Smart Sync : CREATE pour nouveaux, UPDATE pour modifiés, DELETE pour supprimés
  - Stratégie DELETE+CREATE pour Samsung Calendar (incompatibilité UPDATE)
- **Résultat:** Synchronisation bidirectionnelle avec gestion conflits

5.3. ✅ Développer l'ajout automatique au calendrier du téléphone
- **Action réalisée:** Génération événements avec codes couleur et alertes
- **Fonctionnalités:**
  - **Codes couleur (7 couleurs)** :
    - Bleu (`#3b82f6`) : À venir (dans + de 3h)
    - Vert (`#22c55e`) : Pris à l'heure (dans fenêtre ±15min)
    - Orange (`#f97316`) : Pris en retard (> 15min après heure prévue)
    - Rouge (`#ef4444`) : Manqué / En retard critique
    - Gris (`#6b7280`) : Passé (plus de 3h écoulées)
    - Violet (`#8b5cf6`) : Visite pharmacie
    - Indigo (`#6366f1`) : Renouvellement traitement
  - **Alertes intelligentes** :
    - Prises : 15min avant
    - Visites : 24h + 1h avant
    - Renouvellements : 7j + 1j avant
  - **Titres descriptifs** :
    - Prises : "💊 [Nom médicament] - [Statut]"
    - Visites : "🏥 Visite pharmacie - [Traitement]"
    - Renouvellements : "🔄 Renouvellement - [Traitement]"
- **Résultat:** Événements visibles dans calendrier natif avec toutes métadonnées

5.4. ✅ Gestion timezone et compatibilité Samsung
- **Action réalisée:** Fonction `getCurrentDateInParis()` pour éviter décalages UTC
- **Corrections critiques:**
  - Utilisation `taken_at` au lieu de `updated_at` pour status réel
  - Stratégie DELETE+CREATE pour Samsung Calendar (problème UPDATE confirmé)
  - Mapping `syncedEvents` pour éviter doublons
- **Résultat:** Synchronisation fiable sans décalage horaire, compatible tous calendriers Android

### Étape 6 : Amélioration des interactions ✅
**Status:** Complétée le 29/10/2025

6.1. ✅ Rendre cliquables les prises du jour → redirection vers Accueil avec modale correspondante :
- **Action réalisée:** Logique de redirection intelligente avec URL params
- **Fichiers modifiés:**
  - `src/pages/calendar/components/IntakeDetailCard.tsx` : Prises cliquables avec `cursor-pointer`
  - `src/pages/calendar/components/DayDetailsPanel.tsx` : Navigation vers `/` avec `?date=` et `?openIntake=`
- **Résultat:** Clic sur prise → redirection Accueil avec modale auto-open

6.2. ✅ Implémenter clic sur médicament (dates antérieures) → redirection vers historique :
- **Action réalisée:** Redirection conditionnelle selon date (aujourd'hui → Accueil, passé → Historique)
- **Fichiers modifiés:**
  - `src/pages/calendar/components/DayDetailsPanel.tsx` : Logique if/else selon comparaison dates
- **Résultat:** Smart routing selon contexte temporel

6.3. ✅ Restructurer : hooks, utils, components
- **Note:** Déjà fait dans refacto précédente

6.4. ✅ Configurer affichage de toutes les dates par défaut
- **Note:** Pas nécessaire ici, concerne plutôt page Historique (étape future)

## 💊 Page Traitements

### Étape 7 : Correction de l'affichage ✅
**Status:** Complétée le 29/10/2025

7.1. ✅ Supprimer "(s)" si 1 seul traitement actif (sauf sur le titre de page)
- **Action réalisée:** Logique pluriel conditionnel
- **Fichiers modifiés:**
  - `src/pages/treatments/Treatments.tsx` : `${count} traitement${count > 1 ? 's' : ''} actif${count > 1 ? 's' : ''}`
- **Résultat:** Affichage grammaticalement correct

### Étape 8 : Gestion des traitements archivés ✅
**Status:** Complétée le 29/10/2025

8.1. ✅ Ajouter icône œil alignée à droite pour afficher/masquer le détail
- **Action réalisée:** Toggle avec état local `showDetails`, scroll vers carte
- **Fichiers modifiés:**
  - `src/pages/treatments/components/TreatmentCard.tsx` : Icônes `Eye`/`EyeOff`, `useRef` pour scroll, logique inversée (barré = masqué par défaut)
- **Résultat:** Détails masqués par défaut, œil barré, clic pour afficher + scroll automatique

## 📋 Page Ordonnances

### Étape 9 : Amélioration des statuts ✅
**Status:** Complétée le 29/10/2025

9.1. ✅ Implémenter pastille "Archivée" pour ordonnances liées à traitements archivés
- **Action réalisée:** Badge gris "Archivée" si `!is_active`
- **Fichiers modifiés:**
  - `src/pages/prescriptions/hooks/usePrescriptions.ts` : Select `is_active` dans query
  - `src/pages/prescriptions/components/PrescriptionCard.tsx` : Condition affichage badge
- **Résultat:** Badge visible uniquement si traitement archivé

9.2. ✅ Afficher "Expire bientôt" uniquement si traitement non archivé
- **Action réalisée:** Condition `isExpiringSoon && is_active`
- **Fichiers modifiés:**
  - `src/pages/prescriptions/components/PrescriptionCard.tsx` : Double condition pour badge expiration
- **Résultat:** Pas d'alerte expiration pour ordonnances archivées

9.3. ✅ Gérer le cochage pour date unique sans refill :
- **Action réalisée:** Auto-check si date passée et aucun refill
- **Fichiers modifiés:**
  - `src/pages/prescriptions/components/PrescriptionCard.tsx` : Logique `isAutoChecked` avec comparaison dates
- **Résultat:** Date unique cochée automatiquement après passage

### Étape 10 : Correction des bugs ✅
**Status:** Complétée le 29/10/2025

10.1. ✅ Corriger l'affichage des médicaments prescrits sur 2 lignes :
- **Action réalisée:** Ajout classes Tailwind pour gestion overflow
- **Fichiers modifiés:**
  - `src/pages/prescriptions/components/MedicationsList.tsx` : `max-w-full`, `break-words`
- **Résultat:** Médicaments s'affichent proprement sur plusieurs lignes si nécessaire

### Étape 11 : Gestion des refills ✅
**Status:** Complétée le 29/10/2025

11.1. ✅ Implémenter confirmation avant date prévue avec possibilité d'annulation
- **Action réalisée:** Système de dialogue avec warnings
- **Fichiers créés:**
  - `src/pages/prescriptions/components/RefillConfirmDialog.tsx` : Composant réutilisable AlertDialog
- **Fichiers modifiés:**
  - `src/pages/prescriptions/Prescriptions.tsx` : État `pendingVisitAction`, fonction `handleVisitClick()` avec comparaison dates
- **Résultat:** Dialogue "Rechargement anticipé" ou "Annulation du rechargement" selon contexte

11.2. ✅ Permettre l'annulation du refill avec avertissement si hors délai :
- **Action réalisée:** Même système avec messages adaptés
- **Résultat:** Utilisateur averti si action hors planning prévu

## 📦 Page Stocks

### Étape 12 : Corrections critiques ✅
**Status:** Complétée le 29/10/2025

12.1. ✅ Corriger le calcul et l'affichage des stocks section Détails
- **Action réalisée:** Query `medication_intakes` pour compter prises réelles du jour
- **Fichiers modifiés:**
  - `src/pages/stocks/hooks/useStockDetails.ts` : Requête intakes avec dates locales, `actualTakesPerDay = intakesData?.length || 1`
- **Résultat:** Xigduo affiche correctement "2 prises/jour" au lieu de "1 prise"

### Étape 13 : Renommage ✅
**Status:** Complétée le 29/10/2025

13.1. ✅ Renommer "stock" → "stocks"
13.2. ✅ Mettre à jour dossiers, fichiers et routes
- **Action réalisée:** Renommage complet dossier + routes
- **Fichiers/Dossiers modifiés:**
  - Dossier `src/pages/stock/` → `src/pages/stocks/`
  - `src/App.tsx` : Routes `/stock/*` → `/stocks/*`
  - `src/pages/stocks/Stock.tsx`, `StockDetails.tsx`, `StockForm.tsx` : Mise à jour `backTo` routes
  - `src/pages/stocks/hooks/useStockForm.ts`, `useStock.ts` : Navigation vers `/stocks`
  - `src/pages/medication-catalog/hooks/useMedicationCatalog.ts` : Navigation stocks mise à jour
- **Résultat:** Toutes les routes et imports cohérents avec `/stocks`
- **⚠️ TODO MANUEL:** Mettre à jour table `navigation_items` : path `/stock` → `/stocks`

## 🔔 Notifications

### Étape 14 : Correction des règles de filtrage ✅
**Status:** Complétée le 29/10/2025 - **CRITIQUE**

14.1. ✅ Empêcher notifications si médicament marqué comme pris (ni avant ni à l'heure ni après)
- **Action réalisée:** Annulation notifications lors validation prise
- **Fichiers modifiés:**
  - `src/pages/index/hooks/useTakeIntake.ts` : Fonction `hashCode()` + `LocalNotifications.cancel()` avec 3 IDs (before/ontime/after)
- **Résultat:** Notifications annulées immédiatement après validation

14.2. ✅ Corriger bug notifications médicament à prendre malgré prises validées
- **Note:** Résolu avec 14.1

14.3. ✅ Exclure notifications pour médicaments de traitements archivés
- **Action réalisée:** Filtrage avec `!inner` joins et `.eq("is_active", true)`
- **Fichiers modifiés:**
  - `src/hooks/useMedicationNotificationScheduler.tsx` : Requête avec `medications!inner(treatments!inner(is_active))`
- **Résultat:** Seuls les traitements actifs génèrent des notifications

14.4. ✅ Corriger bug notifications Doliprane (problème statut pending + filtrage is_active)
- **Note:** Résolu avec 14.3

### Étape 15 : Nouvelles fonctionnalités ⏸️
**Status:** À FAIRE

15.1. ⏸️ Implémenter alertes de stocks en push
15.2. ⏸️ Ajouter redirection vers action concernée lors du clic sur notification

## ⚙️ Section Personnaliser

### Étape 16 : Amélioration de l'interface ✅
**Status:** Complétée le 29/10/2025

16.1. ✅ Implémenter déroulement automatique du contenu lors du clic "modifier"
- **Action réalisée:** Scroll automatique vers boutons avec `scrollIntoView()`
- **Fichiers modifiés:**
  - `src/pages/notification-settings/components/CustomMessagesCard.tsx` : `useRef` sur boutons, `setTimeout()` + `scrollIntoView({ behavior: 'smooth', block: 'end' })`
  - `src/pages/notification-settings/NotificationSettings.tsx` : Ajout `pb-24` pour espace scroll
- **Résultat:** Ouverture section + scroll vers bas pour voir tous les champs et boutons

16.2. ✅ Ajouter boutons "Enregistrer" et "Annuler" pour validation des changements
- **Action réalisée:** Gestion état local avec workflow save/cancel
- **Fichiers modifiés:**
  - `src/pages/notification-settings/components/CustomMessagesCard.tsx` : État `editedMessages` séparé, fonctions `handleSave()` et `handleCancel()`
- **Résultat:** Modifications non appliquées tant que "Enregistrer" pas cliqué

## 📥 Télécharger les données

### Étape 17 : Développement de l'export ✅
**Status:** Complétée le 30/10/2025

17.1. ✅ Implémenter export complet : profil, observance, traitements détaillés, ordonnances, historique prises, stocks
- **Action réalisée:** Système complet d'export avec configuration granulaire
- **Fichiers créés:**
  - `src/pages/profile-export/ProfileExport.tsx` : Page principale avec AppLayout
  - `src/pages/profile-export/hooks/useExportConfig.ts` : Gestion configuration export
  - `src/pages/profile-export/hooks/useExportData.ts` : Récupération données Supabase
  - `src/pages/profile-export/components/ExportConfig.tsx` : Toggles sections à exporter
  - `src/pages/profile-export/components/ExportActions.tsx` : Boutons PDF/JSON
  - `src/pages/profile-export/components/PeriodSelector.tsx` : Sélection dates
  - `src/pages/profile-export/types.ts` : Interfaces TypeScript
  - `src/pages/profile-export/utils/pdfGenerator.ts` : Génération PDF avec jsPDF
- **Fichiers modifiés:**
  - `src/App.tsx` : Route `/profile-export`
  - `src/pages/admin/dashboard/constants.ts` : Menu "Export de profil"
  - `src/integrations/supabase/types.ts` : Ajout `export_config` à user_preferences
- **Packages installés:**
  - `jspdf` : Génération PDF
  - `jspdf-autotable` : Tables formatées
  - `@capacitor/filesystem` : Sauvegarde fichiers Android/iOS
- **Résultat:** Export PDF/JSON avec sections configurables, sauvegarde native sur mobile dans Documents/

17.2. ✅ Ajouter sélection de période (date début/fin)
- **Action réalisée:** Composant PeriodSelector avec DatePicker
- **Résultat:** Filtrage données selon dates choisies

17.3. ✅ Générer format PDF avec mise en forme correcte
- **Action réalisée:** PDF structuré avec header, tables, pagination automatique
- **Résultat:** PDF professionnel avec profil, stats adhérence, traitements, ordonnances, historique (100 dernières prises), stocks
- **Note:** Sur Android utilise Capacitor Filesystem, sur web téléchargement classique

17.4. ✅ Migration base de données pour export_config
- **Fichier créé:** `supabase/migrations/20251030000000_add_export_config_to_user_preferences.sql`
- **Résultat:** Colonne JSONB `export_config` dans table `user_preferences`

## 🗑️ Supprimer mon compte

### Étape 18 : Processus sécurisé de suppression ⏸️
**Status:** À FAIRE

18.1. ⏸️ Implémenter proposition d'export PDF avant première confirmation
18.2. ⏸️ Créer première confirmation
18.3. ⏸️ Développer confirmation finale avec mot de passe/empreinte obligatoire
18.4. ⏸️ Ajouter case à cocher "J'ai bien compris que..."

### Étape 19 : Gestion des mots de passe ⏸️
**Status:** À FAIRE

19.1. ⏸️ Implémenter "mot de passe oublié" avec mail
19.2. ⏸️ Demander mot de passe actuel pour modifications

---

## 📊 Récapitulatif

**✅ Complété:** Étapes 1-4, 5 (Phase 6), 6-14, 16, 17  
**⏸️ À faire:** Étapes 15, 18, 19

### Statistiques du projet

**Pages créées** : 
- `/calendar-sync` (14 fichiers) - Phase 6
- `/profile-export` (8 fichiers) - Étape 17

**Packages ajoutés** :
- `@ebarooni/capacitor-calendar@7.2.0`
- `jspdf` + `jspdf-autotable`
- `@capacitor/filesystem@7.1.4`

**Migrations base de données** :
- `20251030000000_add_export_config_to_user_preferences.sql`

**Capacitor plugins détectés** : 7
- @capacitor/app
- @capacitor/filesystem ✨ (nouveau)
- @capacitor/local-notifications
- @capacitor/push-notifications
- @capacitor/status-bar
- @ebarooni/capacitor-calendar ✨ (nouveau)
- capacitor-native-biometric

**Date dernière mise à jour:** 30 octobre 2025

## 🚀 Prochaines étapes prioritaires

1. **Étape 15** : Notifications alertes stocks + redirection clic notification
2. **Étape 18** : Processus sécurisé suppression compte (export avant suppression)
3. **Étape 19** : Gestion mots de passe (reset + modification sécurisée)

## 📱 Tests à effectuer

### Tests Android prioritaires
- [ ] Export PDF sur APK (sauvegarde Documents/)
- [ ] Synchronisation calendrier Samsung/Google
- [ ] Codes couleur événements calendrier
- [ ] Alertes notifications calendrier (15min, 24h, 7j)
- [ ] Smart Sync DELETE+CREATE sur Samsung

### Tests fonctionnels
- [ ] Export JSON
- [ ] Filtrage période export
- [ ] Sections configurables export
- [ ] Permissions calendrier

---
