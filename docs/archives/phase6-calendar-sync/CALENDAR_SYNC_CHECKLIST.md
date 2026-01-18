# Checklist d'implémentation - Synchronisation Calendrier

## ✅ Phase 1 : Architecture (COMPLÉTÉ)

- [x] Récupération des fichiers depuis lovable-dev
- [x] Ajout export default dans CalendarSync.tsx
- [x] Ajout route `/calendar-sync` dans App.tsx
- [x] Vérification compilation TypeScript

## ✅ Phase 2 : Installation du plugin Capacitor (COMPLÉTÉ)

### Étape 1 : Installation du plugin

```bash
npm install @ebarooni/capacitor-calendar --legacy-peer-deps
npx cap sync android
```

- [x] Exécuter `npm install @ebarooni/capacitor-calendar --legacy-peer-deps`
- [x] Exécuter `npx cap sync android`
- [x] Vérifier que le plugin est bien ajouté dans package.json

### Étape 2 : Configuration Android

Fichier: `android/app/src/main/AndroidManifest.xml`

Ajouter les permissions (normalement déjà présentes) :

```xml
<uses-permission android:name="android.permission.READ_CALENDAR" />
<uses-permission android:name="android.permission.WRITE_CALENDAR" />
```

- [x] Vérifier les permissions dans AndroidManifest.xml
- [x] Ajouter les permissions si manquantes

### Étape 3 : Test de la page

- [x] Ouvrir l'app en dev : `npm run dev`
- [x] Naviguer vers `/calendar-sync`
- [x] Vérifier que la page s'affiche sans erreur
- [ ] Tester sur émulateur Android

## ✅ Phase 3 : Implémentation des hooks (COMPLÉTÉ)

Le hook `useNativeCalendar.ts` utilise maintenant le plugin réel.

Fichier: `src/pages/calendar-sync/hooks/useNativeCalendar.ts`

- [x] Remplacer les mocks par les vraies méthodes du plugin
- [x] Implémenter `requestPermissions()` avec `requestFullCalendarAccess()`
- [x] Implémenter `getCalendars()` avec `listCalendars()`
- [x] Implémenter `createEvent()` avec `createEvent()`
- [x] Implémenter `updateEvent()` avec `modifyEvent()`
- [x] Implémenter `deleteEvent()` avec `deleteEvent()`

## ✅ Phase 4 : Mapping des événements (COMPLÉTÉ)

Fichier: `src/pages/calendar-sync/utils/eventMapper.ts`

- [x] Vérifier le mapping des prises de médicaments
- [x] Vérifier le mapping des RDV médicaux
- [x] Vérifier le mapping des visites pharmacie
- [x] Vérifier le mapping des renouvellements d'ordonnance
- [x] Ajouter les couleurs par type d'événement (vert/ambre/rouge/bleu/violet/cyan/rose)
- [x] Ajouter les alertes/rappels (15min prises, 24h+1h RDV, 7j+1j renouvellements)

## ✅ Phase 5 : Synchronisation (COMPLÉTÉ)

- [x] Implémenter la synchronisation complète depuis le 13/10
- [x] Implémenter la synchronisation incrémentale (CREATE/UPDATE/DELETE)
- [x] Gérer les doublons (mapping app_event_id → native_event_id)
- [x] Gérer les mises à jour (si statut change)
- [x] Gérer les suppressions (si traitement archivé)
- [x] Stockage du mapping dans localStorage (syncedEvents)

## ✅ Phase 5b : Correction Fuseau Horaire (CRITIQUE - COMPLÉTÉ)

- [x] Créer fonction `getCurrentDateInParis()` avec `Intl.DateTimeFormat`
- [x] Remplacer `new Date()` dans TodaySection.tsx
- [x] Remplacer `new Date()` dans TomorrowSection.tsx
- [x] Remplacer `new Date()` dans Index.tsx (auto-open et handleTakeIntake)
- [x] Mettre à jour `isIntakeValidationAllowed()` pour utiliser heure Paris
- [x] **FIX CRITIQUE** : Garantit "Aujourd'hui" correct sur tous les appareils

## 🧪 Phase 6 : Tests (EN ATTENTE)

- [ ] Tester sur émulateur Android
- [ ] Tester sur téléphone Android réel
- [ ] Tester les permissions
- [ ] Tester la sélection de calendrier
- [ ] Tester la synchronisation complète
- [ ] Tester la synchronisation incrémentale
- [ ] Vérifier les fuseaux horaires (UTC → Paris)
- [ ] Vérifier les couleurs et icônes
- [ ] Vérifier les alertes/notifications

## ✅ Phase 7 : Documentation (COMPLÉTÉ)

- [x] Mettre à jour `docs/calendar_sync.md`
- [x] Documenter toutes les phases (1-5)
- [x] Guide utilisateur step-by-step
- [x] Tableau des couleurs
- [x] Tableau des alertes
- [x] Explication sync intelligente (CREATE/UPDATE/DELETE)
- [x] Documentation fix timezone Paris
- [x] Section troubleshooting
- [x] Architecture technique et API
- [ ] Ajouter des screenshots (à faire après tests device)
- [x] Checklist déploiement

## 🚀 Phase 8 : Déploiement (PRÊT)

- [x] Build de production : `npm run build`
- [x] Sync Android : `npx cap sync android`
- [ ] Générer APK de test : `cd android && ./gradlew assembleDebug`
- [ ] Tests sur téléphone réel
- [x] Commit et push sur `feat/calendar-sync` (7 commits)
- [ ] Merge dans `dev` après validation tests

---

## 📊 Résumé de la progression

### ✅ TERMINÉ (Phases 1-5 + 7)

- Architecture complète (14 fichiers)
- Plugin @ebarooni/capacitor-calendar v7.2.0 installé
- Hooks implémentés (plus de mocks)
- Couleurs et alertes par type d'événement
- Synchronisation intelligente (CREATE/UPDATE/DELETE)
- **FIX CRITIQUE** : Fuseau horaire Paris garanti
- Documentation complète (docs/calendar_sync.md)
- Build production : **1,014 kB (290 kB gzipped)**
- Capacitor plugins : **6 détectés** (dont calendar@7.2.0)

### ⏳ EN ATTENTE (Phase 6)

- Tests émulateur Android
- Tests device Android réel
- Validation fonctionnelle complète

### 🎯 PRÊT POUR (Phase 8)

- Génération APK debug
- Tests device réel
- Merge dans `dev`

---

## 🔗 Commits de la branche feat/calendar-sync

1. `edf99d9` - feat: add calendar sync architecture from lovable-dev
2. `093846e` - feat(calendar-sync): integrate with AppLayout and Admin menu
3. `75c1d05` - feat(calendar-sync): implement native calendar integration
4. `10f594e` - docs: update calendar sync checklist - phases 2 and 3 completed
5. `cf3913a` - fix(timezone): use Paris timezone for Today/Tomorrow sections
6. `494ab8f` - feat(calendar-sync): add colors and alerts to calendar events
7. `03672ec` - feat(calendar-sync): implement smart sync with deduplication
8. `3e6d9e7` - docs(calendar-sync): complete comprehensive documentation

**Total** : 8 commits | **Fichiers modifiés** : 20+ | **Lignes ajoutées** : ~2500

---

## 📌 Notes importantes

### Fuseaux horaires

- Les dates en BDD sont en UTC
- Les heures de prise sont stockées comme "09:30", "20:00" etc.
- Il faut utiliser les fonctions de `utils/dateUtils.ts` qui gèrent déjà la conversion Paris

### Filtrage des données

- Démarrer la sync depuis le 13/10/2025
- Ne synchroniser que les traitements actifs (`is_active = true`)
- Exclure les prises déjà passées et non validées (status = skipped)

### Gestion des statuts

- **Prise à l'heure** : badge vert
- **Prise en retard** : badge orange
- **Prise manquée** : badge rouge
- **RDV** : icône calendrier
- **Visite pharmacie** : icône pharmacie
- **Renouvellement** : icône document

### Plugin Capacitor Calendar

Documentation : https://github.com/capacitor-community/calendar

Méthodes principales :

- `Calendar.checkPermission()` - Vérifier permissions
- `Calendar.requestPermissions()` - Demander permissions
- `Calendar.getCalendars()` - Liste des calendriers
- `Calendar.createEvent()` - Créer événement
- `Calendar.modifyEvent()` - Modifier événement
- `Calendar.deleteEvent()` - Supprimer événement

---

**Date de création** : 30 octobre 2025
**Branche** : feat/calendar-sync
**Status** : Architecture complète, installation plugin en attente
