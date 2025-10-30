# 📅 Guide d'implémentation - Synchronisation Calendrier Natif

## 🎯 Objectif

Synchroniser les événements de santé de l'application (prises de médicaments, RDV, visites pharmacie, renouvellements) avec le calendrier natif du téléphone (iOS/Android).

## 📋 Compte-rendu d'actions

### ✅ Phase 1 : Architecture et Structure (TERMINÉ)

- [x] Création de la structure de dossiers `src/pages/calendar-sync/`
- [x] Définition des types TypeScript (`types.ts`)
- [x] Utilitaires de gestion des dates (`utils/dateUtils.ts`)
- [x] Utilitaires de mapping d'événements (`utils/eventMapper.ts`)
- [x] Hook de gestion du calendrier natif (`hooks/useNativeCalendar.ts`)
- [x] Hook de gestion de la configuration (`hooks/useSyncConfig.ts`)
- [x] Hook principal de synchronisation (`hooks/useCalendarSync.ts`)
- [x] Composant de sélection de calendrier (`components/CalendarSelector.tsx`)
- [x] Composant d'options de synchronisation (`components/SyncOptions.tsx`)
- [x] Composant de statut de synchronisation (`components/SyncStatus.tsx`)
- [x] Composant de bannière de permissions (`components/PermissionBanner.tsx`)
- [x] Page principale de synchronisation (`CalendarSync.tsx`)
- [x] Documentation complète (`docs/calendar_sync.md`)
- [x] Route `/calendar-sync` intégrée dans App.tsx
- [x] Menu Admin avec accès à la synchronisation calendrier

### ✅ Phase 2 : Intégration Capacitor (TERMINÉ)

- [x] Installation du plugin `@ebarooni/capacitor-calendar` v7.2.0
- [x] Configuration des permissions Android (AndroidManifest.xml)
- [x] Implémentation réelle des méthodes du hook `useNativeCalendar`
  - [x] `checkPermission()` avec `CalendarPermissionScope`
  - [x] `requestPermission()` avec `requestFullCalendarAccess()`
  - [x] `loadCalendars()` avec `listCalendars()`
  - [x] `createEvent()` avec support color et alerts
  - [x] `updateEvent()` avec `modifyEvent()`
  - [x] `deleteEvent()`

### ✅ Phase 3 : Couleurs et Alertes (TERMINÉ)

- [x] Système de couleurs par type d'événement et statut
  - Vert (#10B981) : prise à l'heure
  - Ambre (#F59E0B) : prise en retard
  - Rouge (#EF4444) : prise manquée
  - Bleu (#3B82F6) : prise à venir
  - Violet (#8B5CF6) : RDV médecin
  - Cyan (#06B6D4) : visite pharmacie
  - Rose (#EC4899) : renouvellement ordonnance
- [x] Système d'alertes/rappels par type
  - Prises : 15 minutes avant
  - RDV/Pharmacie : 24h et 1h avant
  - Renouvellements : 7 jours et 1 jour avant

### ✅ Phase 4 : Synchronisation Intelligente (TERMINÉ)

- [x] Système de mapping événements app ↔ calendrier natif
- [x] Gestion des doublons (pas de re-création)
- [x] Synchronisation incrémentale :
  - CREATE : nouveaux événements
  - UPDATE : événements modifiés (statut changé)
  - DELETE : événements supprimés (traitement archivé)
- [x] Filtrage depuis le 13 octobre 2025
- [x] Stockage du mapping dans localStorage

### ✅ Phase 5 : Correction Fuseau Horaire (TERMINÉ - CRITIQUE)

- [x] Création fonction `getCurrentDateInParis()` avec `Intl.DateTimeFormat`
- [x] Remplacement `new Date()` par `getCurrentDateInParis()` dans :
  - [x] TodaySection.tsx
  - [x] TomorrowSection.tsx
  - [x] Index.tsx (auto-open et handleTakeIntake)
  - [x] `isIntakeValidationAllowed()`
- [x] **FIX CRITIQUE** : Garantit que "Aujourd'hui" affiche bien les bonnes prises même sur émulateurs configurés en PST/EST/etc.

### ✅ Phase 6 : Corrections Critiques Samsung Calendar (TERMINÉ)

- [x] Détection incompatibilité Samsung Calendar avec `updateEvent()`
- [x] Implémentation stratégie DELETE+CREATE pour Samsung
- [x] Correction calcul statut : utilisation `taken_at` au lieu de `updated_at`
- [x] Tests sur émulateur Samsung Galaxy S25
- [x] Validation codes couleur (7 couleurs fonctionnelles)
- [x] Validation alertes (15min, 24h+1h, 7j+1j)
- [x] Tests synchronisation complète 144 prises (13/10 → 02/11/2025)

**Bugs résolus** :
- ❌ **Bug couleurs** : Événements toujours verts → ✅ RÉSOLU (utilisation `taken_at`)
- ❌ **Bug UPDATE Samsung** : Erreur native → ✅ RÉSOLU (stratégie DELETE+CREATE)
- ❌ **Bug doublons** : Événements multipliés → ✅ RÉSOLU (mapping `syncedEvents`)

### ⏳ Phase 7 : Tests Android Réels (EN COURS)

- [ ] Tests sur téléphone Android réel (Samsung/Google)
- [ ] Vérification persistance événements après redémarrage app
- [ ] Tests modification événements depuis calendrier natif
- [ ] Tests suppression événements depuis calendrier natif
- [ ] Validation alertes push réelles (notifications 15min avant)

### ⏳ Phase 8 : Documentation Utilisateur (À FINALISER)

- [ ] Guide utilisateur avec screenshots
- [ ] FAQ et troubleshooting
- [ ] Vidéo de démonstration

---

## 🔧 Guide d'implémentation

### Prérequis

1. **Environnement de développement Capacitor configuré**
   - Android Studio installé (pour Android)
   - Xcode installé (pour iOS)
   - Projet cloné depuis GitHub

2. **Dépendances installées**
   ```bash
   npm install
   ```

### Étape 1 : Installation du plugin calendrier

```bash
npm install @ebarooni/capacitor-calendar --legacy-peer-deps
npx cap sync android
```

**Note** : Le package `@ebarooni/capacitor-calendar` v7.2.0 est compatible Capacitor 7.

### Étape 2 : Configuration des permissions Android

Le fichier `android/app/src/main/AndroidManifest.xml` contient déjà :

```xml
<uses-permission android:name="android.permission.READ_CALENDAR" />
<uses-permission android:name="android.permission.WRITE_CALENDAR" />
```**✅ Déjà configurées** - Rien à faire !

### Étape 3 : Accès à la page de synchronisation

1. Ouvrir l'application
2. Aller dans **Menu → Admin**
3. Cliquer sur **"Synchronisation calendrier"**

La page est accessible via `/calendar-sync`.

### Étape 4 : Utilisation

1. **Demander les permissions**
   - Cliquer sur "Autoriser l'accès au calendrier"
   - Accepter les permissions Android (READ_CALENDAR + WRITE_CALENDAR)

2. **Sélectionner un calendrier**
   - Choisir le calendrier natif dans la liste (Google Calendar, Samsung Calendar, etc.)
   - Le calendrier sélectionné sera utilisé pour tous les événements synchronisés

3. **Configurer les types d'événements** (tous activés par défaut)
   - ✅ Prises de médicaments
   - ✅ Rendez-vous médicaux
   - ✅ Visites pharmacie
   - ✅ Renouvellements d'ordonnance

4. **Lancer la synchronisation**
   - Cliquer sur "Synchroniser maintenant"
   - Les événements depuis le 13/10/2025 seront créés dans le calendrier natif
   - La synchronisation est **incrémentale** : pas de doublons !

5. **Synchronisations suivantes**
   - Seuls les nouveaux événements sont créés
   - Les événements modifiés sont mis à jour
   - Les événements supprimés sont retirés du calendrier

---

## 🎨 Couleurs des événements

Chaque type d'événement a sa propre couleur dans le calendrier natif :

| Type | Couleur | Code Hex |
|------|---------|----------|
| 🟢 Prise à l'heure | Vert | #10B981 |
| 🟠 Prise en retard | Ambre | #F59E0B |
| 🔴 Prise manquée | Rouge | #EF4444 |
| 🔵 Prise à venir | Bleu | #3B82F6 |
| 🟣 RDV médecin | Violet | #8B5CF6 |
| 🔷 Visite pharmacie | Cyan | #06B6D4 |
| 🩷 Renouvellement ordonnance | Rose | #EC4899 |

---

## 🔔 Système d'alertes

Les alertes/rappels sont configurés automatiquement selon le type d'événement :

| Type d'événement | Alertes |
|------------------|---------|
| **Prises de médicaments** | 15 minutes avant |
| **RDV médicaux** | 24 heures + 1 heure avant |
| **Visites pharmacie** | 24 heures + 1 heure avant |
| **Renouvellements ordonnance** | 7 jours + 1 jour avant |

**Note** : Les prises déjà prises ou manquées n'ont pas d'alerte.

---

## 🔄 Synchronisation intelligente

Le système de synchronisation utilise un **mapping persistent** pour éviter les doublons :

### Première synchronisation (CREATE)
- Tous les événements depuis le 13/10/2025 sont créés
- Chaque événement app reçoit un ID calendrier natif
- Le mapping est stocké dans `localStorage`

### Synchronisations suivantes (UPDATE/DELETE)
- **CREATE** : Nouveaux événements non présents dans le mapping
- **UPDATE** : Événements déjà synchronisés mais modifiés (ex: statut prise changé)
- **DELETE** : Événements supprimés de l'app (ex: traitement archivé)

### Exemple de mapping
```json
{
  "intake_abc123": "native_event_xyz789",
  "doctor_def456": "native_event_uvw012",
  ...
}
```

---

## 🌍 Gestion du fuseau horaire

**⚠️ CRITIQUE** : L'application utilise **toujours le fuseau horaire de Paris** (Europe/Paris), même sur des émulateurs/appareils configurés différemment.

### Fonction `getCurrentDateInParis()`
```typescript
const getCurrentDateInParis = (): Date => {
  const parisFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const now = new Date();
  const parts = parisFormatter.formatToParts(now);
  // ... reconstruit une Date avec l'heure de Paris
};
```

### Utilisée dans
- `TodaySection.tsx` : Détermine "Aujourd'hui"
- `TomorrowSection.tsx` : Détermine "Demain"
- `Index.tsx` : Auto-open des accordions et validation des prises
- `isIntakeValidationAllowed()` : Vérification heure >= 06:00 Paris

### Pourquoi c'est critique ?
Sur un émulateur Android configuré en PST (UTC-8), sans cette correction :
- Il est 15:00 à Paris → "Aujourd'hui"
- Mais l'émulateur affiche 06:00 PST → "Hier" ❌
- Les sections Today/Tomorrow affichent les mauvaises prises !

Avec `getCurrentDateInParis()` :
- Toujours 15:00 Paris → "Aujourd'hui" ✅
- Fonctionne sur **tous** les appareils, quel que soit le fuseau local

---

## 📱 Tests recommandés

### Tests émulateur Android

1. **Build et sync**
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   ```

2. **Vérifications**
   - [ ] Permissions demandées correctement
   - [ ] Liste des calendriers natifs affichée
   - [ ] Sélection calendrier fonctionnelle
   - [ ] Synchronisation sans erreur
   - [ ] Événements visibles dans Google Calendar/Samsung Calendar
   - [ ] Couleurs correctes par type
   - [ ] Alertes créées (vérifier notifications)
   - [ ] "Aujourd'hui" affiche les bonnes prises (même en PST/EST)

### Tests téléphone Android réel

1. **Générer APK de test**
   ```bash
   npm run build
   npx cap sync android
   cd android
   ./gradlew assembleDebug
   ```
   APK généré dans `android/app/build/outputs/apk/debug/`

2. **Installer et tester**
   - Transférer l'APK et installer
   - Tester le flux complet
   - Vérifier avec Google Calendar / Samsung Calendar
   - Tester synchronisation incrémentale (modifier une prise, re-synchroniser)

### Tests iOS (si disponible)

1. **Build et sync**
   ```bash
   npm run build
   npx cap sync ios
   npx cap open ios
   ```

2. **Configuration Xcode**
   - Vérifier `Info.plist` contient `NSCalendarsUsageDescription`
   - Signer avec compte développeur
   - Lancer sur simulateur ou device réel

3. **Vérifications**
   - Permissions iOS
   - Calendrier iCloud/local
   - Alertes iOS
   - Intégration Siri

---

## 🐛 Troubleshooting

### Problème : "Permissions refusées"
**Solution** : Aller dans Paramètres Android → Applications → MyHealth+ → Autorisations → Calendrier → Autoriser

### Problème : "Aucun calendrier disponible"
**Solution** : Créer un compte Google et synchroniser le calendrier, ou utiliser le calendrier local Samsung

### Problème : "Événements en double"
**Solution** : Le système empêche normalement les doublons via le mapping. Si doublons :
1. Supprimer les événements manuellement
2. Effacer les données de l'app (Paramètres → Stockage)
3. Re-synchroniser

### Problème : "Today/Tomorrow affichent mauvaises dates sur émulateur"
**✅ CORRIGÉ** : `getCurrentDateInParis()` force toujours le fuseau horaire Paris. Si le problème persiste, vérifier que tous les fichiers utilisent bien cette fonction.

### Problème : "Couleurs ne s'affichent pas"
**Note** : Certaines apps calendrier Android n'affichent pas les couleurs personnalisées des événements. Testé et fonctionnel sur Google Calendar.

### Problème : "Alertes ne se déclenchent pas"
**Solution** : Vérifier que l'app a la permission NOTIFICATIONS et que "Ne pas déranger" est désactivé.

---

## 📚 Documentation technique

### Architecture des fichiers

```
src/pages/calendar-sync/
├── CalendarSync.tsx              # Page principale
├── types.ts                       # Types TypeScript
├── components/
│   ├── CalendarSelector.tsx       # Sélection calendrier
│   ├── SyncOptions.tsx            # Options sync
│   ├── SyncStatus.tsx             # Statut sync
│   └── PermissionBanner.tsx       # Bannière permissions
├── hooks/
│   ├── useNativeCalendar.ts       # Hook calendrier natif (plugin)
│   ├── useSyncConfig.ts           # Hook configuration (localStorage)
│   └── useCalendarSync.ts         # Hook synchronisation principal
└── utils/
    ├── dateUtils.ts               # Utilitaires dates/filtres
    └── eventMapper.ts             # Mapping événements app→calendrier
```

### Flux de synchronisation

```
1. USER: Clique "Synchroniser"
   ↓
2. useCalendarSync.syncToNativeCalendar()
   ↓
3. loadAppEvents() → Charge depuis Supabase (prises, RDV, visites, renouvellements)
   ↓
4. filterEventsFromStartDate() → Filtre >= 13/10/2025
   ↓
5. mapXxxToEvents() → Transforme en CalendarEvent (avec color et alerts)
   ↓
6. Pour chaque événement:
   - Si syncedEvents[event.id] existe → UPDATE
   - Sinon → CREATE
   ↓
7. Détection événements supprimés:
   - Pour chaque syncedEvents[appId] non traité → DELETE
   ↓
8. updateConfig({ syncedEvents, lastSyncDate })
   ↓
9. Retour SyncResult (eventsCreated, eventsUpdated, eventsDeleted)
```

### API du plugin @ebarooni/capacitor-calendar

```typescript
import { CapacitorCalendar, CalendarPermissionScope } from '@ebarooni/capacitor-calendar';

// Permissions
await CapacitorCalendar.checkPermission({ scope: CalendarPermissionScope.READ_CALENDAR });
await CapacitorCalendar.requestFullCalendarAccess();

// Calendriers
const { result: calendars } = await CapacitorCalendar.listCalendars();

// Événements
const { id } = await CapacitorCalendar.createEvent({
  title: string,
  description: string,
  startDate: number, // timestamp ms
  endDate: number,
  calendarId: string,
  location?: string,
  color?: string, // hex Android
  alerts?: number[], // minutes avant
  isAllDay: boolean
});

await CapacitorCalendar.modifyEvent({ id, title, description, ... });
await CapacitorCalendar.deleteEvent({ id });
```

---

## 🚀 Prochaines évolutions possibles

### V2 : Synchronisation bidirectionnelle
- Détecter modifications dans calendrier natif
- Mettre à jour statut prises depuis calendrier
- Gérer conflits app ↔ calendrier

### V3 : Synchronisation en arrière-plan
- Service worker pour sync auto toutes les 6h
- Push notifications quand événements créés/modifiés

### V4 : Personnalisation avancée
- Choisir couleurs personnalisées par type
- Configurer durée des événements
- Choisir alertes personnalisées

---

## ✅ Checklist déploiement

Avant de merger `feat/calendar-sync` dans `dev` :

- [x] Plugin installé et configuré
- [x] Permissions Android ajoutées
- [x] Hooks implémentés (pas de mocks)
- [x] Couleurs et alertes configurées
- [x] Synchronisation intelligente (CREATE/UPDATE/DELETE)
- [x] Fix fuseau horaire Paris
- [ ] Tests émulateur Android réussis
- [ ] Tests device Android réel réussis
- [ ] Documentation complète
- [ ] Screenshots ajoutés
- [ ] APK de test généré et validé

---

**Dernière mise à jour** : 30 octobre 2025  
**Branche** : `feat/calendar-sync`  
**Statut** : ✅ Phases 1-5 terminées | ⏳ Phase 6 tests en cours

1. **Stocker les IDs de mapping**
   Créer une table Supabase `calendar_event_mappings` :
   ```sql
   CREATE TABLE calendar_event_mappings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     app_event_id TEXT NOT NULL,
     app_event_type TEXT NOT NULL,
     native_event_id TEXT NOT NULL,
     calendar_id TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Détecter les modifications**
   Utiliser `Calendar.listEventsInRange()` pour récupérer les événements du calendrier natif et comparer avec les données de l'app.

3. **Appliquer les modifications**
   Si un événement a été modifié ou supprimé dans le calendrier natif, mettre à jour l'app en conséquence.

---

## 📊 Gestion des fuseaux horaires

### Principe CRITIQUE

- **Base de données** : Toutes les dates sont stockées en UTC
- **Récupération** : Les dates sont récupérées **SANS CONVERSION**
- **Synchronisation** : Les dates UTC sont envoyées telles quelles au calendrier natif
- **Affichage** : Le calendrier natif gère lui-même la conversion vers le fuseau local

### Implémentation

```typescript
// ✅ CORRECT - Pas de conversion
const startDate = new Date(intake.scheduled_time); // UTC depuis BDD
await Calendar.createEvent({
  startDate: startDate.getTime(), // Timestamp UTC
  endDate: endDate.getTime()
});

// ❌ INCORRECT - Ne pas faire de conversion manuelle
const localDate = new Date(intake.scheduled_time);
localDate.setHours(localDate.getHours() + 1); // MAUVAIS!
```

---

## 🎨 Icônes et Statuts

### Types d'événements

- 💊 **Prise de médicament** : `✓ À l'heure` / `⚠ En retard` / `✗ Manquée` / `⏰ À venir`
- 👨‍⚕️ **RDV Médecin** : Fin de traitement
- 🏥 **Visite pharmacie** : Retrait de médicaments
- 📋 **Renouvellement ordonnance** : 7 jours avant expiration

### Calcul des statuts

```typescript
// À l'heure : pris dans les 30min après l'heure prévue
// En retard : pris > 30min après l'heure prévue
// Manquée : marqué comme "skipped" ou > 30min après sans être pris
// À venir : heure prévue dans le futur
```

---

## 🐛 Dépannage

### Problème : Permission refusée

- Vérifier que les clés sont bien dans `Info.plist` (iOS)
- Vérifier que les permissions sont dans `AndroidManifest.xml` (Android)
- Sur iOS, supprimer l'app et réinstaller pour réinitialiser les permissions
- Sur Android, aller dans Paramètres > Apps > Permissions

### Problème : Calendrier non visible

- S'assurer que le calendrier natif existe bien sur l'appareil
- Vérifier que le calendrier autorise les modifications
- Tester avec le calendrier principal de l'appareil

### Problème : Dates incorrectes

- Vérifier qu'aucune conversion de fuseau horaire n'est faite
- S'assurer que les dates en BDD sont bien en UTC
- Vérifier les timestamps (millisecondes vs secondes)

### Problème : Événements en double

- Implémenter le système de mapping ID app ↔ ID natif
- Avant de créer, vérifier si l'événement existe déjà
- Utiliser `updateEvent` au lieu de `createEvent` si l'ID existe

---

## 📚 Ressources

- [Documentation @capacitor-community/calendar](https://github.com/capacitor-community/calendar)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Calendar Framework](https://developer.apple.com/documentation/eventkit)
- [Android Calendar Provider](https://developer.android.com/guide/topics/providers/calendar-provider)

---

## 🚀 Prochaines étapes

1. **Installation du plugin** : `npm install @capacitor-community/calendar`
2. **Configuration des permissions** (iOS + Android)
3. **Implémentation des méthodes natives** dans `useNativeCalendar.ts`
4. **Tests sur appareils réels**
5. **Optimisations et synchronisation bidirectionnelle**

---

**Date de création** : 29 octobre 2025  
**Dernière mise à jour** : 29 octobre 2025  
**Version** : 1.0.0
