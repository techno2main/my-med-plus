# Correction des erreurs console au démarrage - 21 octobre 2025

## Problèmes identifiés

### 1. Erreur "Invalid Refresh Token" au démarrage
**Symptôme** : L'application affichait une erreur `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` avant même que l'utilisateur ne se connecte.

**Cause** : 
- Supabase essayait automatiquement de restaurer une session avec `getSession()` au démarrage
- Si un refresh token invalide ou corrompu était présent dans le localStorage, cela générait une erreur visible dans la console

**Solution appliquée** :
1. Ajout de la gestion d'erreur dans `useAuth.tsx` :
   - Capture des erreurs lors de `getSession()`
   - Détection des tokens invalides (`refresh_token_not_found`, `Invalid Refresh Token`)
   - Nettoyage silencieux des tokens corrompus

2. Création d'un utilitaire de nettoyage `lib/auth-cleaner.ts` :
   - Fonction `autoCleanInvalidTokens()` qui vérifie et nettoie automatiquement les tokens invalides
   - Intégration dans `main.tsx` pour un nettoyage silencieux au démarrage

3. Amélioration de la configuration Supabase dans `client.ts` :
   - Ajout de `detectSessionInUrl: true`
   - Ajout de `flowType: 'pkce'` pour une meilleure sécurité
   - Ajout d'un header personnalisé `x-application-name`

### 2. Messages console répétitifs en boucle infinie
**Symptôme** : Des centaines de messages identiques apparaissaient dans la console :
- "Utilisateur déconnecté, planificateur désactivé"
- "Aucun utilisateur connecté - planification ignorée"
- Ces messages se répétaient sans cesse, même sans action de l'utilisateur

**Cause** : 
- Le hook `useMedicationNotificationScheduler` créait de nouvelles instances de fonctions à chaque rendu
- Le `NotificationSchedulerProvider` avait `rescheduleAll` dans ses dépendances
- Cela créait une boucle infinie : changement de fonction → re-render → nouvelle fonction → re-render...

**Solution appliquée** :
1. Mémorisation des fonctions avec `useCallback` dans `useMedicationNotificationScheduler.tsx` :
   ```typescript
   const scheduleUpcomingNotifications = useCallback(async (...) => {
     // ...
   }, [preferences.pushEnabled, preferences.medicationReminders, ...]);
   
   const rescheduleAll = useCallback(async (...) => {
     // ...
   }, [scheduleUpcomingNotifications]);
   ```

2. Optimisation de `NotificationSchedulerProvider.tsx` :
   - Ajout d'un `useRef` pour suivre si la planification a déjà été effectuée
   - Ajout d'un `useRef` pour suivre l'ID de l'utilisateur et détecter les changements
   - La planification ne se déclenche qu'une seule fois par utilisateur connecté

3. Suppression des messages de log inutiles :
   - Plus de message "Utilisateur déconnecté" (c'est l'état normal au démarrage)
   - Changement de "❌ Pas d'utilisateur connecté" en "ℹ️ Aucun utilisateur connecté - planification ignorée"
   - Ces messages n'apparaissent plus que lorsque nécessaire

## Fichiers modifiés

1. **src/hooks/useAuth.tsx**
   - Ajout de la gestion d'erreur dans `getSession()`
   - Nettoyage automatique des tokens invalides

2. **src/integrations/supabase/client.ts**
   - Amélioration de la configuration d'authentification
   - Ajout de paramètres de sécurité PKCE

3. **src/lib/auth-cleaner.ts** (nouveau fichier)
   - Utilitaire de nettoyage des tokens corrompus
   - Fonctions de détection et de nettoyage automatique

4. **src/main.tsx**
   - Intégration du nettoyage automatique au démarrage

5. **src/hooks/useMedicationNotificationScheduler.tsx**
   - Ajout de `useCallback` pour mémoriser les fonctions
   - Optimisation des dépendances
   - Réduction des logs inutiles

6. **src/components/NotificationSchedulerProvider.tsx**
   - Ajout de `useRef` pour éviter les re-render inutiles
   - Détection des changements d'utilisateur
   - Une seule planification par session utilisateur

## Résultats attendus

✅ **Plus d'erreurs de refresh token au démarrage**
- Les tokens invalides sont nettoyés silencieusement
- L'application démarre proprement sans erreur d'authentification

✅ **Console propre et lisible**
- Suppression des messages répétitifs
- Logs informatifs uniquement quand nécessaire
- Pas de boucle infinie de messages

✅ **Meilleure performance**
- Moins de re-renders inutiles
- Planification des notifications optimisée
- Utilisation de `useCallback` pour mémoriser les fonctions

## Tests recommandés

1. **Test du nettoyage automatique** :
   - Insérer manuellement un token invalide dans le localStorage
   - Recharger l'application
   - Vérifier que le token est nettoyé sans erreur visible

2. **Test de la boucle infinie** :
   - Ouvrir la console au démarrage
   - Vérifier qu'aucun message ne se répète en boucle
   - Vérifier que la planification ne se déclenche qu'une fois

3. **Test de connexion/déconnexion** :
   - Se connecter → vérifier la planification
   - Se déconnecter → vérifier la réinitialisation
   - Se reconnecter → vérifier que la planification fonctionne

## Notes techniques

- **Performance** : L'utilisation de `useCallback` améliore les performances en évitant la recréation de fonctions
- **Stabilité** : Les `useRef` garantissent que les états persistent entre les rendus
- **UX** : L'utilisateur ne voit plus d'erreurs techniques au démarrage
- **Maintenance** : Le code est plus maintenable avec des fonctions mémorisées

## Prochaines étapes potentielles

- Ajouter un système de logs structuré (niveaux : debug, info, warn, error)
- Créer un dashboard de debug pour les notifications
- Implémenter un système de retry automatique pour les appels Supabase
