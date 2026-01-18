# 🟠 ÉTAPE 04 : Mise à jour @supabase/supabase-js (CRITIQUE)

**Priorité :** P3 - HAUTE (BACKEND COMPLET)  
**Durée estimée :** 30-45 minutes  
**Risque :** 🟡 Moyen (+14 versions mineures)  
**Type d'action :** MINOR (2.75.0 → 2.89.0)

---

## ⚠️ AVERTISSEMENT CRITIQUE

Cette étape met à jour le **CLIENT SUPABASE** qui gère TOUT le backend de l'application :
- 🔐 **Authentification** (login, logout, biométrie, sessions)
- 💾 **Base de données** (profiles, medications, prescriptions, etc.)
- 📁 **Storage** (PDF, documents médicaux)
- 📲 **Push notifications**

**Impact :** ⚠️ **TOUTE L'APPLICATION** peut être affectée  
**Tests requis :** 45 minutes minimum  
**Rollback :** Immédiat si problème

---

## 📋 Vue d'ensemble

### Package concerné
- **Nom :** `@supabase/supabase-js`
- **Version actuelle :** `2.75.0`
- **Version cible :** `2.89.0`
- **Type de mise à jour :** Minor (+14 versions)
- **Dépendance :** production (dependencies)

### Impact sur MyHealthPlus

**Fichiers affectés :**
- [`src/integrations/supabase/client.ts`](../../src/integrations/supabase/client.ts) - Client principal
- [`src/lib/auth-guard.ts`](../../src/lib/auth-guard.ts) - Authentification
- `src/pages/**/hooks/*.ts` - Tous les hooks DB (20+ fichiers)

**Fonctionnalités critiques :**
- ✅ Login/Logout
- ✅ Inscription
- ✅ Auth biométrique
- ✅ CRUD Traitements
- ✅ CRUD Ordonnances
- ✅ CRUD Allergies
- ✅ CRUD Pathologies
- ✅ CRUD Professionnels santé
- ✅ Upload/Download PDF
- ✅ Synchronisation données
- ✅ Push notifications

### Changements majeurs (2.75.0 → 2.88.0)

| Version | Changement notable |
|---------|-------------------|
| 2.76.0 | Amélioration refresh token |
| 2.77.0 | Fix auth session storage |
| 2.80.0 | Support PostgreSQL 15 |
| 2.82.0 | Amélioration realtime |
| 2.85.0 | Fix storage upload |
| 2.88.0 | Corrections bugs auth + storage |

**Changelog complet :** https://github.com/supabase/supabase-js/releases

---

## 🎯 Objectifs

1. ✅ Mettre à jour @supabase/supabase-js vers 2.88.0
2. ✅ Vérifier que la compilation fonctionne (TypeScript)
3. ✅ Tester **EXHAUSTIVEMENT** toutes les fonctionnalités backend
4. ✅ Documenter tout problème rencontré
5. ✅ Rollback immédiat si échec critique

---

## 🔧 Procédure détaillée

### Étape 4.1 : Sauvegarde (CRITIQUE)

```bash
# Vérifier la branche
git branch
# Doit afficher : * feature/deps-update-2025-12

# Commit de sauvegarde
git add -A
git commit -m "Checkpoint avant mise à jour @supabase/supabase-js (CRITIQUE)" --allow-empty

# Créer le tag de rollback (IMPORTANT)
git tag step-3-before-supabase-js-update

# Double vérification du tag
git tag | grep supabase-js
# Doit afficher : step-3-before-supabase-js-update
```

**⚠️ IMPORTANT :** Ne passez PAS à l'étape suivante sans avoir créé ce tag !

**⏱️ Temps :** 1 minute

---

### Étape 4.2 : Mise à jour du package

```bash
# Mettre à jour @supabase/supabase-js
npm install @supabase/supabase-js@2.89.0

# Vérifier la version installée
npm list @supabase/supabase-js
# Doit afficher : @supabase/supabase-js@2.89.0
```

**✅ Résultat attendu :**
```
changed 1 package, and audited 902 packages in 5s
```

**❌ Si erreur de dépendances :**
```bash
# Essayer avec --legacy-peer-deps
npm install @supabase/supabase-js@2.89.0 --legacy-peer-deps
```

**⏱️ Temps :** 2 minutes

---

### Étape 4.3 : Vérification compilation TypeScript

```bash
# Compiler le projet
npm run build
```

**✅ Attendu :**
```
vite v5.4.21 building for production...
✓ XXX modules transformed.
✓ built in XXXms
```

**❌ Si erreurs TypeScript :**
```bash
# Lister les erreurs
npm run build 2>&1 | grep "TS"

# Exemple d'erreurs possibles :
# - Property 'X' does not exist on type 'SupabaseClient'
# - Argument of type 'X' is not assignable to parameter of type 'Y'
```

**Solutions aux erreurs TypeScript courantes :**

1. **Erreur "Property does not exist" :**
   - Vérifier le changelog Supabase
   - Propriété peut avoir été renommée
   - Consulter la doc : https://supabase.com/docs/reference/javascript

2. **Erreur de types :**
   - Régénérer les types : `npx supabase gen types typescript`
   - Ou continuer temporairement (l'app peut fonctionner)

**⏱️ Temps :** 3 minutes

---

### Étape 4.4 : Démarrage serveur développement

```bash
# Démarrer l'app
npm run dev
```

**✅ Attendu :**
```
VITE v5.4.21  ready in XXX ms
➜  Local:   http://localhost:5173/
```

**Vérifications console initiale :**
1. Ouvrir http://localhost:5173/
2. Ouvrir DevTools (F12) → Console
3. ✅ Vérifier : Pas d'erreurs Supabase au chargement
4. ✅ Vérifier : Pas d'"AuthApiError"
5. ✅ Vérifier : Pas de "refresh_token_not_found"

**⚠️ Note :** Les erreurs refresh token peuvent être normales si masquées dans le code (voir `client.ts` ligne 11-21).

**⏱️ Temps :** 2 minutes

---

### Étape 4.5 : Tests authentification (OBLIGATOIRES)

#### Test 4.5.1 : Déconnexion (si connecté)

```
1. Si vous êtes déjà connecté :
   - Cliquer sur votre profil / Menu
   - Cliquer "Déconnexion" ou "Logout"
   
2. Vérifications :
   ✅ Redirection vers page login
   ✅ Session effacée (pas d'erreur console)
   ✅ localStorage nettoyé (F12 → Application → Local Storage)
```

**⏱️ Temps :** 1 minute

---

#### Test 4.5.2 : Connexion

```
1. Page de login affichée
2. Entrer identifiants de test :
   - Email : [votre-email-test]
   - Password : [votre-password-test]
3. Cliquer "Se connecter"

Vérifications :
✅ Loader/Spinner s'affiche
✅ Pas d'erreur console
✅ Redirection vers dashboard
✅ Utilisateur connecté (profil affiché)
✅ Token stocké dans localStorage
```

**❌ Si erreur :**
- "Invalid credentials" → Vérifier email/password
- "AuthApiError" → **PROBLÈME CRITIQUE** → Rollback
- "Network error" → Vérifier connexion internet
- "Invalid refresh token" → Effacer localStorage, réessayer

**⏱️ Temps :** 2 minutes

---

#### Test 4.5.3 : Session persistante

```
1. Connecté et sur le dashboard
2. Rafraîchir la page (F5)

Vérifications :
✅ Reste connecté (pas de redirect login)
✅ Profil toujours affiché
✅ Données chargent normalement
```

**❌ Si déconnecté après F5 :**
- **PROBLÈME CRITIQUE** avec la gestion de session
- Vérifier `client.ts` : `persistSession: true`
- Vérifier localStorage : clé `supabase.auth.token`
- → Si problème persiste : **Rollback**

**⏱️ Temps :** 1 minute

---

#### Test 4.5.4 : Auth biométrique (si configuré)

```
1. Aller dans Confidentialité / Paramètres
2. Activer "Authentification biométrique"
3. Tester le prompt biométrique

Vérifications :
✅ Prompt s'affiche (empreinte/Face ID)
✅ Authentification fonctionne
✅ Ou erreur explicite si non supporté
```

**Note :** Test optionnel si vous n'utilisez pas la biométrie.

**⏱️ Temps :** 2 minutes

---

### Étape 4.6 : Tests base de données (OBLIGATOIRES)

#### Test 4.6.1 : Lecture données (GET)

```
1. Aller dans "Traitements"
2. Observer le chargement

Vérifications :
✅ Loader s'affiche
✅ Liste des traitements charge
✅ Données affichées correctement
✅ Pas d'erreur console
✅ Pas de "Error fetching data"
```

**Répéter pour :**
- Ordonnances
- Allergies
- Pathologies
- Professionnels santé

**⏱️ Temps :** 3 minutes

---

#### Test 4.6.2 : Création données (INSERT)

```
1. Dans "Traitements" → Cliquer "Ajouter"
2. Remplir le formulaire :
   - Nom du médicament : "Test Supabase 2.88.0"
   - Dosage : "1x/jour"
   - etc.
3. Soumettre le formulaire

Vérifications :
✅ Formulaire se soumet
✅ Loader/Spinner
✅ Toast de succès ("Traitement ajouté")
✅ Nouveau traitement apparaît dans la liste
✅ Pas d'erreur console
```

**❌ Si erreur :**
- "Error inserting data" → Vérifier les requêtes dans console
- "Permission denied" → Problème RLS Supabase
- → Si persiste : **Rollback**

**⏱️ Temps :** 2 minutes

---

#### Test 4.6.3 : Modification données (UPDATE)

```
1. Sélectionner le traitement créé
2. Cliquer "Modifier"
3. Changer une information :
   - Dosage : "2x/jour"
4. Sauvegarder

Vérifications :
✅ Modification enregistrée
✅ Toast de succès
✅ Changement visible dans la liste
✅ Pas d'erreur console
```

**⏱️ Temps :** 2 minutes

---

#### Test 4.6.4 : Suppression données (DELETE)

```
1. Sélectionner le traitement test
2. Cliquer "Supprimer"
3. Confirmer la suppression

Vérifications :
✅ Dialog de confirmation s'affiche
✅ Suppression exécutée
✅ Toast de succès
✅ Traitement disparaît de la liste
✅ Pas d'erreur console
```

**⏱️ Temps :** 1 minute

---

### Étape 4.7 : Tests Storage (CRITIQUES)

#### Test 4.7.1 : Génération et upload PDF

```
1. Aller dans Profil → Export
2. Cliquer "Générer PDF"
3. Attendre la génération

Vérifications :
✅ PDF génère (loader)
✅ Upload vers Supabase réussit
✅ PDF téléchargé/ouvert
✅ Pas d'erreur console
✅ Pas d'"Storage error"
```

**❌ Si erreur storage :**
- "Failed to upload" → Vérifier buckets Supabase
- "Permission denied" → RLS storage
- → **Rollback si critique**

**⏱️ Temps :** 3 minutes

---

#### Test 4.7.2 : Téléchargement fichier (optionnel)

```
1. Si l'app permet de télécharger des PDFs stockés
2. Cliquer sur un PDF existant
3. Vérifier le téléchargement

Vérifications :
✅ Fichier se télécharge
✅ PDF s'ouvre correctement
✅ Pas d'erreur console
```

**⏱️ Temps :** 2 minutes

---

### Étape 4.8 : Tests Notifications (optionnels)

```
1. Aller dans Paramètres → Notifications
2. Vérifier les permissions

Vérifications :
✅ Paramètres s'affichent
✅ Permissions demandées (si nécessaire)
✅ Pas d'erreur console
```

**Note :** Test optionnel si non critique pour votre app.

**⏱️ Temps :** 2 minutes

---

### Étape 4.9 : Tests de charge (recommandés)

```
1. Naviguer rapidement entre plusieurs pages :
   - Dashboard → Traitements → Ordonnances → Allergies → Profil
2. Répéter 3-4 fois

Vérifications :
✅ Pas de ralentissement
✅ Pas de requêtes en double
✅ Cache fonctionne (React Query)
✅ Pas d'erreurs console accumulées
✅ Pas de fuite mémoire visible
```

**⏱️ Temps :** 3 minutes

---

### Étape 4.10 : Test déconnexion finale

```
1. Se déconnecter
2. Attendre 5 secondes
3. Se reconnecter

Vérifications :
✅ Déconnexion propre
✅ Reconnexion fonctionne
✅ Données rechargent correctement
✅ Pas d'erreur console
```

**⏱️ Temps :** 2 minutes

---

### Étape 4.11 : Validation et commit

**⚠️ SEULEMENT si TOUS les tests ci-dessus sont OK !**

```bash
# Arrêter le dev server (Ctrl+C)

# Vérifier les modifications
git status
# Doit afficher :
#   modified: package.json
#   modified: package-lock.json

# Voir les différences
git diff package.json | grep supabase-js
# Doit montrer : "@supabase/supabase-js": "^2.88.0"

# Ajouter les modifications
git add package.json package-lock.json

# Commiter avec un message détaillé
git commit -m "Update @supabase/supabase-js 2.75.0 → 2.88.0

Tested:
- ✅ Auth (login, logout, session, biometric)
- ✅ Database (CRUD operations on treatments, prescriptions, allergies)
- ✅ Storage (PDF generation and upload)
- ✅ Notifications (permissions)
- ✅ No errors in console
- ✅ Performance OK"

# Créer le tag de succès
git tag step-4-supabase-js-updated

# Vérifier
git tag | tail -5
```

**⏱️ Temps :** 2 minutes

---

## ✅ Checklist de validation COMPLÈTE

### Phase préparation
- [ ] Tag `step-3-before-supabase-js-update` créé (**VÉRIFIÉ 2x**)
- [ ] Backup complet disponible
- [ ] Compte de test prêt

### Phase mise à jour
- [ ] Commande `npm install @supabase/supabase-js@2.88.0` exécutée
- [ ] Version vérifiée : `2.88.0`
- [ ] `npm run build` réussit (pas d'erreurs TS)

### Phase tests AUTH (CRITIQUES)
- [ ] Déconnexion fonctionne
- [ ] Session effacée (localStorage)
- [ ] Login fonctionne (email/password)
- [ ] Redirection dashboard OK
- [ ] Token stocké dans localStorage
- [ ] Refresh page (F5) → Reste connecté
- [ ] Auth biométrique testée (si applicable)

### Phase tests DATABASE (CRITIQUES)
- [ ] GET : Traitements chargent
- [ ] GET : Ordonnances chargent
- [ ] GET : Allergies chargent
- [ ] GET : Pathologies chargent
- [ ] INSERT : Création traitement test OK
- [ ] Toast succès affiché
- [ ] UPDATE : Modification traitement OK
- [ ] DELETE : Suppression traitement OK
- [ ] Pas d'erreurs console DB

### Phase tests STORAGE (CRITIQUES)
- [ ] PDF génère sans erreur
- [ ] Upload vers Supabase réussit
- [ ] PDF téléchargé/ouvert
- [ ] Pas d'"Storage error"

### Phase tests NOTIFICATIONS
- [ ] Paramètres notifications accessibles
- [ ] Permissions fonctionnent (si applicable)

### Phase tests CHARGE
- [ ] Navigation rapide OK (3-4 cycles)
- [ ] Pas de ralentissement
- [ ] Pas de requêtes doublées
- [ ] Cache React Query fonctionne

### Phase tests FINAL
- [ ] Déconnexion finale OK
- [ ] Reconnexion OK
- [ ] Données rechargent
- [ ] Console propre (pas d'erreurs)

### Phase commit
- [ ] Modifications git vérifiées
- [ ] Commit créé avec message détaillé
- [ ] Tag `step-4-supabase-js-updated` créé

### Validation finale
- [ ] **Date de réalisation :** ___/___/2025
- [ ] **Réalisé par :** _______________
- [ ] **Résultat :** ✅ OK / ❌ KO
- [ ] **Durée réelle :** ___ minutes (min 30 min)
- [ ] **Tests passés :** ___/20
- [ ] **Problèmes rencontrés :** _______________
- [ ] **Rollback nécessaire :** Oui / Non

---

## 🔄 Procédure de rollback (IMPORTANT)

### Rollback immédiat si problème critique

**Problèmes critiques** :
- ❌ Login ne fonctionne plus
- ❌ Erreurs "AuthApiError" récurrentes
- ❌ Données ne chargent plus
- ❌ Storage upload échoue systématiquement

```bash
# ROLLBACK IMMÉDIAT
git reset --hard step-3-before-supabase-js-update

# Réinstaller les dépendances
npm install

# Vérifier la version
npm list @supabase/supabase-js
# Doit afficher : @supabase/supabase-js@2.75.0

# Tester que ça refonctionne
npm run dev
# → Login, navigation, CRUD doivent refonctionner
```

### Rollback après commit

Si vous découvrez un problème APRÈS avoir commité :

```bash
# Revenir au commit précédent
git reset --hard step-3-before-supabase-js-update

# Ou revenir au backup initial
git reset --hard backup-v0.0.0-before-any-update

# Réinstaller
npm install
npm run dev
```

---

## ⚠️ Problèmes courants et solutions

### Problème 1 : "Invalid Refresh Token"

**Symptôme :**
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

**Cause :** Session expirée ou corrompue

**Solution NON-BLOQUANTE :**
```bash
# 1. Effacer localStorage
# Dans DevTools (F12) → Application → Local Storage → Clear All

# 2. Rafraîchir la page (F5)

# 3. Se reconnecter

# ✅ Si ça fonctionne : Pas de rollback nécessaire
# ❌ Si ça ne fonctionne pas : ROLLBACK
```

---

### Problème 2 : Erreurs TypeScript après mise à jour

**Symptôme :**
```
TS2339: Property 'X' does not exist on type 'SupabaseClient'
```

**Cause :** API Supabase a changé

**Solution :**
```bash
# 1. Vérifier le changelog
# https://github.com/supabase/supabase-js/releases

# 2. Adapter le code si nécessaire
# Exemple : Propriété renommée ou déplacée

# 3. Ou utiliser @ts-ignore temporairement
// @ts-ignore - TODO: Fix after Supabase 2.88 update
const result = await supabase...

# Si trop d'erreurs TS : ROLLBACK et analyser
```

---

### Problème 3 : Requêtes DB échouent

**Symptôme :**
```
Error fetching data from table 'X'
```

**Cause possible :** Changement format requête

**Solution :**
```bash
# 1. Vérifier la console pour voir l'erreur exacte

# 2. Tester une requête simple :
# Dans DevTools console :
const { data, error } = await supabase.from('profiles').select('*').limit(1)
console.log(data, error)

# 3. Si error : Lire le message, adapter code
# 4. Si aucune erreur mais data vide : Vérifier RLS Supabase
```

---

### Problème 4 : Storage upload échoue

**Symptôme :**
```
Storage error: Failed to upload file
```

**Solutions :**
```bash
# 1. Vérifier les buckets Supabase (UI web)
# 2. Vérifier les RLS policies sur storage
# 3. Tester un upload simple :
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload('test.txt', new Blob(['test']))
console.log(data, error)

# Si toujours erreur : ROLLBACK
```

---

### Problème 5 : Console inondée d'erreurs

**Symptôme :**
Dizaines d'erreurs qui s'accumulent dans la console

**Action immédiate :**
```bash
# ROLLBACK IMMÉDIAT
git reset --hard step-3-before-supabase-js-update
npm install
npm run dev

# Documenter les erreurs rencontrées
# Chercher dans le changelog Supabase
# Demander support si nécessaire
```

---

## 📊 Résultats attendus

### Avant mise à jour (2.75.0)
- ✅ App fonctionne normalement
- ✅ Pas de problèmes connus

### Après mise à jour (2.88.0)
- ✅ App fonctionne normalement
- ✅ Mêmes fonctionnalités qu'avant
- ✅ Corrections bugs Supabase appliquées
- ✅ Amélioration refresh token
- ✅ Meilleure gestion session

**⚠️ Si l'app fonctionne MOINS BIEN après :** ROLLBACK

---

## 🎯 Critères de succès

Cette étape est **RÉUSSIE** si :

1. ✅ @supabase/supabase-js mis à jour vers 2.88.0
2. ✅ Build compile sans erreurs TS
3. ✅ **Login/Logout fonctionnent**
4. ✅ **Session persiste après F5**
5. ✅ **CRUD données fonctionne** (GET, INSERT, UPDATE, DELETE)
6. ✅ **Storage fonctionne** (upload PDF)
7. ✅ **Navigation fluide** sans erreurs console
8. ✅ **Tous les tests manuels passés** (20/20)
9. ✅ Commit et tag créés

**Si UN SEUL test échoue de façon critique : ROLLBACK**

---

## 📝 Notes importantes

### Pourquoi 13 versions ?

2.75.0 → 2.88.0 = 13 versions mineures  
Chaque version corrige des bugs et ajoute des fonctionnalités.

**Principales raisons de la mise à jour :**
- Corrections bugs auth (refresh token)
- Amélioration performances
- Support PostgreSQL 15
- Corrections storage
- Meilleure gestion erreurs

### Migration depuis 2.75.0

Normalement **pas de breaking changes** entre versions mineures.  
Mais avec 13 versions, il peut y avoir des ajustements mineurs.

**Changelog critique à vérifier :**
- https://github.com/supabase/supabase-js/releases/tag/v2.88.0
- https://github.com/supabase/supabase-js/releases/tag/v2.80.0
- https://github.com/supabase/supabase-js/releases/tag/v2.77.0

---

## ⏭️ Prochaine étape

**SI ET SEULEMENT SI** tous les tests sont passés :
→ **[Étape 05 : Mise à jour @tanstack/react-query](../etape-05-react-query/05-mise-a-jour-react-query.md)**

**SI UN TEST ÉCHOUE :**
→ ROLLBACK + Documentation du problème + Investigation

---

**🔥 ÉTAPE LA PLUS CRITIQUE DU PLAN - PRENEZ LE TEMPS NÉCESSAIRE ! NE PAS RUSH !**

**⏱️ Durée minimale :** 30 minutes (ne pas descendre en dessous)  
**⏱️ Durée recommandée :** 45 minutes (pour être sûr)
