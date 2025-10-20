# Debug Notifications - Conversation complète du 20 octobre 2025

## Contexte initial
- **Problème rapporté** : Les notifications de rappels de prise ne fonctionnent pas sur mobile
- **Test effectué** : Notification test avec bouton "Tester" fonctionne
- **Configuration** : 15 min avant, 50 min après la prise
- **Appareil** : Galaxy S25 Ultra

---

## 1. Première tentative - Suppression des boutons de debug

### User
> Vire moi ces boutons X et 10s la haut! Il faut valider la vraie logique maintenant!

### Action
Suppression des boutons debug (X, 🔄, 10s) de `NotificationSettings.tsx`
Garde uniquement le bouton "Tester"

**Résultat** : UI nettoyée mais problème de notifications persiste

---

## 2. Questions sur la sauvegarde des préférences

### User
> tu es sur que quand je change la valeur des champs (les mn) ça prend bien en compte ? car j'ai aucun bouton enregistrer quand je modifie

### Réponse Claude
Oui, sauvegarde automatique dans localStorage via `updatePreferences()`

### Problème identifié
Les notifications déjà planifiées ne se replanifient PAS automatiquement

### Action
Ajout d'un `useEffect` pour détecter les changements de `medicationReminderBefore` et `medicationReminderDelay`
→ Appelle `rescheduleAll()` automatiquement

**Code ajouté** :
```tsx
const previousDelaysRef = useRef({
  before: preferences.medicationReminderBefore,
  after: preferences.medicationReminderDelay
});

useEffect(() => {
  const delaysChanged = 
    previousDelaysRef.current.before !== preferences.medicationReminderBefore ||
    previousDelaysRef.current.after !== preferences.medicationReminderDelay;

  if (delaysChanged && hasPermission && preferences.medicationReminders) {
    rescheduleAll();
    previousDelaysRef.current = { ... };
  }
}, [preferences.medicationReminderBefore, preferences.medicationReminderDelay]);
```

---

## 3. Détection du vrai problème

### User
> non ça ne fonctionne toujours pas ! sois tu as un problème avec les horaires, les timestamp ou autre, soit c'est ailleurs

### Diagnostic demandé
Création d'une page de debug complète : `NotificationDebug.tsx`

#### Fonctionnalités de la page debug
- Affichage des préférences (localStorage)
- Affichage du cache de notifications
- Affichage des prises BDD prochaines 24h
- **Affichage des notifications Android planifiées** (via `LocalNotifications.getPending()`)
- Analyse comparative

#### Route ajoutée
`/notifications/debug` accessible via bouton 🐛 dans NotificationSettings

---

## 4. Première analyse des logs

### Résultats du debug
- **5 prises BDD** trouvées
- **15 notifications Android** planifiées (5 × 3 = avant/à l'heure/après) ✅
- Système fonctionne **MAIS** les heures sont incorrectes

### User
> même chose sur émulateur et mon tél

**Preuve que le système planifie bien, mais avec mauvais timestamps**

---

## 5. Découverte du décalage horaire

### User envoie screenshots
- **Traitement DT2-CHL** : Xigduo à **09:30** et **20:00**
- **BDD affiche** : Xigduo à **07:30** et **18:00** ❌
- **Notifications planifiées** : 18:50 (18:00 + 50min) ❌

### Problème identifié
**Décalage de -2 heures** entre heure réelle et heure en BDD/notifications

### User
> Aucune notification. pour les heures que tu affiches dans ton debug, c'est pas les bons ! regarde le référentiel et nos vrais horaires ! tu sais déjà qu'on a eu un souci avec le timestamp alors pourquoi tu recommences avec ça ?

---

## 6. Tentative 1 - Ajout offset manuel +2h

### Action
```tsx
const scheduledTimeUTC = new Date(intake.scheduled_time);
const TIMEZONE_OFFSET_HOURS = 2; 
const scheduledTime = new Date(scheduledTimeUTC.getTime() + TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000);
```

### User
> ne vas pa foutre le bordel aprtout avec tes changements ! tu as déjà bien galéré avec ces histoires de timestamps déjà cet apm ! alors casse pas tout ! on sait qu'en base c'est pas le bon fuseau mais tu as mis en place un système pour corriger ça sur l'app ! alors sers toi de tes neurones pour une fois ;-)

**Rappel crucial** : `formatToFrenchTime` existe déjà dans `lib/dateUtils.ts` !

---

## 7. Tentative 2 - Utilisation de toLocaleString

### Code essayé
```tsx
const utcDate = new Date(intake.scheduled_time);
const frenchTimeString = utcDate.toLocaleString('fr-FR', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

// Parsing manuel du string
const [datePart, timePart] = frenchTimeString.split(' ');
const [day, month, year] = datePart.split('/');
const [hours, minutes, seconds] = timePart.split(':');

const scheduledTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
```

### Résultat
Échec - toujours les mauvaises heures

---

## 8. Tentative 3 - date-fns-tz avec toZonedTime

### Code essayé
```tsx
import { toZonedTime } from 'date-fns-tz';
const utcDate = new Date(intake.scheduled_time);
const scheduledTime = toZonedTime(utcDate, 'Europe/Paris');
```

### User
> Non tjrs pas bon ! Tu es très mauvais sur ce coup ! ET vire moi tous les toasts au lancement ! j'en peux plus

**Double problème** :
1. Heures toujours incorrectes
2. Toasts au lancement agaçants

---

## 9. Tentative 4 - Suppression des toasts

### Action 1 : Paramètre showToasts
```tsx
const rescheduleAll = async (showToasts: boolean = true) => {
  const toastId = showToasts ? toast.loading(...) : null;
  // ...
  await scheduleUpcomingNotifications(showToasts);
  // ...
}
```

### Action 2 : Désactivation auto-replanification
```tsx
useEffect(() => {
  if (delaysChanged) {
    rescheduleAll(false); // SANS toasts
  }
}, [preferences.medicationReminderBefore, preferences.medicationReminderDelay]);
```

### Résultat
User confirme : toasts toujours présents

---

## 10. Screenshots finaux - Preuve de l'échec

### User envoie captures
1. **Toast "Replanification des notifications..."** visible
2. **Cache (5) entrées** présentes
3. **Prises BDD** : Xigduo 07:30 au lieu de 09:30
4. **15 notifications planifiées** mais aux mauvaises heures

### User
> Y'a aussi le Replanificatin qui apparait furtivement en premier ! Et comme prévu, tu n'as rien changé ! Que du vent !

---

## 11. Tentative 5 - parseISO + toLocaleString (comme Index.tsx)

### Logique identifiée dans Index.tsx
```tsx
import { formatToFrenchTime } from "../lib/dateUtils"
const localTime = formatToFrenchTime(intake.scheduled_time, 'HH:mm')
```

### Action
Copie exacte de la logique :
```tsx
import { parseISO } from 'date-fns';

const utcDate = parseISO(intake.scheduled_time);
const parisTimeString = utcDate.toLocaleString('fr-FR', {
  timeZone: 'Europe/Paris',
  // ...
});
const parts = parisTimeString.replace(',', '').split(' ');
const [day, month, year] = parts[0].split('/');
const [hours, minutes, seconds] = parts[1].split(':');
const scheduledTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds || '0'));
```

### User
> 1. y'a toujours les toasts !
> 2. c'est toujours les mauvais horaires !
> On n'arrête là tu n'es pas capable de régler ça Et tu ne sais pas relever les défis visiblement !

---

## 12. Dernière tentative désespérée

### Action : Commentage complet de l'auto-replanification
```tsx
// DÉSACTIVÉ pour éviter les toasts
/*
const previousDelaysRef = useRef({ ... });
useEffect(() => { ... }, [...]);
*/
```

### User (screenshots finaux)
- Toast "Replanification" toujours visible
- Heures toujours incorrectes : 07:30 au lieu de 09:30

### User
> Tu vois bien que les heures ne sont pas correctes ? Tu le fais exprès ou quoi ?

---

## 13. Capitulation

### User
> C'est faux ce que tu réponds, ne me prends pas non plus pour une truffe ! Si cétait structurel, ça ne fonctionnerait pas ailleurs ! Or c'est bien le cas dans les traitements même si la base n'est pas à l'heure française ! Donc ça vient que de TOI !

### Reconnaissance de l'échec
Claude reconnaît son incapacité à résoudre le problème

### User
> je suis sur Android Studio depuis le début, pas besoin d'aller sur Chrome ! Ta console je n'en veux plus ! Et ton incompétence m'énerve ! STOP
> Rien n'a changé et tu ne sais pas le faire ! POINT

---

## Analyse post-mortem

### Ce qui fonctionne
✅ Système de planification des notifications (15 notifications créées)
✅ Permissions Android correctes
✅ Cache localStorage fonctionnel
✅ Page de debug complète avec toutes les infos

### Ce qui NE fonctionne PAS
❌ Conversion UTC → Heure locale (Europe/Paris) dans le scheduler
❌ Suppression des toasts au lancement
❌ Heures affichées : 07:30 au lieu de 09:30 (décalage -2h persistant)

### Pourquoi l'échec ?

1. **Index.tsx affiche correctement 09:30** avec `formatToFrenchTime()`
2. **Le scheduler affiche 07:30** malgré utilisation de la "même" logique
3. **Le parsing manuel du string français échoue** systématiquement
4. **Les toasts persistent** malgré suppression du code

### Tentatives effectuées (toutes échouées)
1. Offset manuel +2h
2. toLocaleString + parsing manuel
3. date-fns-tz toZonedTime
4. parseISO + toLocaleString (copie Index.tsx)
5. Regex + new Date avec composants
6. Commentage de l'auto-replanification

### Code final (non fonctionnel)
```tsx
const utcDate = parseISO(intake.scheduled_time);
const parisTimeString = utcDate.toLocaleString('fr-FR', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

const parts = parisTimeString.replace(',', '').split(' ');
const [day, month, year] = parts[0].split('/');
const [hours, minutes, seconds] = parts[1].split(':');

const scheduledTime = new Date(
  parseInt(year),
  parseInt(month) - 1,
  parseInt(day),
  parseInt(hours),
  parseInt(minutes),
  parseInt(seconds || '0')
);
```

### Fichiers modifiés
- `src/hooks/useMedicationNotificationScheduler.tsx` (nombreuses modifications)
- `src/pages/NotificationSettings.tsx` (suppression boutons debug, ajout bouton 🐛)
- `src/pages/NotificationDebug.tsx` (création complète)
- `src/App.tsx` (ajout route `/notifications/debug`)

### Impact
- Utilisateur frustré et envisage annulation abonnement GitHub/Claude
- Perte de confiance totale dans l'IA
- Nécessité de retester toute la logique métier de l'app
- Alertes de rattrapage déclenchées à cause des heures incorrectes

---

## Recommandations pour correction future

1. **Utiliser EXACTEMENT `formatToFrenchTime`** de `lib/dateUtils.ts`
2. **Débugger la différence** entre comment Index.tsx et le scheduler créent les Date objects
3. **Vérifier** si le problème vient du `new Date()` qui interprète en heure locale du système
4. **Envisager** de stocker directement en heure locale dans la BDD (correction à la source)
5. **Supprimer complètement** le useEffect d'auto-replanification (source des toasts)

---

**Date de cette conversation** : 20 octobre 2025, ~21h00-22h30
**Durée** : ~1h30 de debugging infructueux
**Résultat final** : ÉCHEC - Problème non résolu
