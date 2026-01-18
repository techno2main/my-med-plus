# 🔴 ÉTAPE 03 : Mise à jour Supabase CLI

**Priorité :** P2 - HAUTE  
**Durée estimée :** 15 minutes  
**Risque :** 🟢 Minimal (outil dev uniquement)  
**Type d'action :** MINOR (2.54.11 → 2.70.5)

---

## 📋 Vue d'ensemble

### Package concerné
- **Nom :** `supabase` (CLI)
- **Version actuelle :** `2.54.11`
- **Version cible :** `2.70.5`
- **Type de mise à jour :** Minor (+16 versions)
- **Dépendance :** devDependencies (outil CLI)

### Contexte

Le Supabase CLI est un **outil de développement** qui permet de :
- ✅ Gérer les migrations de base de données
- ✅ Générer les types TypeScript depuis le schéma DB
- ✅ Lancer Supabase en local (optionnel)
- ✅ Déployer les fonctions serverless

**⚠️ Important :** Cette mise à jour **N'AFFECTE PAS** le code de l'application.  
Elle met à jour uniquement l'outil CLI utilisé en développement.

### Différence CLI vs Client JS

| Package | Usage | Impact app |
|---------|-------|------------|
| `supabase` (CLI) | Outil dev, migrations, types | ❌ Aucun |
| `@supabase/supabase-js` (Client) | Code app, requêtes DB | ✅ Direct |

**Cette étape :** Met à jour le CLI uniquement  
**Étape suivante :** Mettra à jour le client JS (critique)

---

## 🎯 Objectifs

1. ✅ Mettre à jour Supabase CLI vers 2.67.2
2. ✅ Vérifier que la commande `supabase` fonctionne
3. ✅ Vérifier que l'application n'est pas affectée
4. ✅ (Optionnel) Tester les commandes CLI utilisées

---

## 🔧 Procédure détaillée

### Étape 3.1 : Sauvegarde

```bash
# Vérifier la branche
git branch
# Doit afficher : * feature/deps-update-2025-12

# Créer un commit de sauvegarde
git add -A
git commit -m "Checkpoint avant mise à jour Supabase CLI" --allow-empty

# Créer le tag de rollback
git tag step-2-before-supabase-cli-update

# Vérifier
git tag | tail -3
```

**⏱️ Temps :** 1 minute

---

### Étape 3.2 : Vérification version actuelle

```bash
# Voir la version actuellement installée
npx supabase --version
```

**✅ Attendu :**
```
2.54.11
```

**⏱️ Temps :** 30 secondes

---

### Étape 3.3 : Mise à jour Supabase CLI

```bash
# Mettre à jour le CLI
npm install -D supabase@latest

# Vérifier la nouvelle version
npx supabase --version
```

**✅ Attendu :**
```
2.67.2
```

**❌ Si version inférieure :**
```bash
# Forcer la version spécifique
npm install -D supabase@2.67.2

# Revérifier
npx supabase --version
```

**⏱️ Temps :** 2 minutes

---

### Étape 3.4 : Test commandes CLI de base

```bash
# Test 1 : Aide générale
npx supabase help
```

**✅ Attendu :**
```
Supabase CLI 2.67.2

USAGE
  supabase [command]

AVAILABLE COMMANDS
  db          Manage Postgres databases
  functions   Manage Supabase Edge Functions
  gen         Run code generation tools
  init        Initialize a local project
  login       Authenticate with Supabase
  migration   Manage database migrations
  ...
```

**Points de vérification :**
- ✅ Version affichée : `2.67.2`
- ✅ Commandes listées sans erreur
- ✅ Pas de message d'erreur

**⏱️ Temps :** 1 minute

---

### Étape 3.5 : Test statut projet (optionnel)

```bash
# Test 2 : Vérifier le statut du projet
npx supabase status
```

**✅ Si projet configuré :**
```
Service           Status
supabase          running
postgres          running
...
```

**✅ Si projet non configuré (normal) :**
```
Error: Cannot find config.toml in supabase directory
or
Error: Not logged in
```

**Note :** Cette erreur est **NORMALE** si vous n'avez pas de projet Supabase local.  
Le CLI fonctionne, c'est juste qu'il n'y a pas de projet à afficher.

**⏱️ Temps :** 1 minute

---

### Étape 3.6 : Test génération types (optionnel)

Si votre projet utilise la génération de types TypeScript depuis Supabase :

```bash
# Test 3 : Générer les types (si configuré)
npx supabase gen types typescript --project-id rozkooglygxyaaedvebn
```

**✅ Si configuré :**
```typescript
export type Json = ...
export interface Database {
  public: {
    Tables: {
      profiles: { ... }
      medications: { ... }
    }
  }
}
```

**❌ Si non configuré :**
```
Error: No project ID specified
```

**Note :** Cette commande est optionnelle. Elle génère les types TypeScript depuis votre schéma Supabase.

**⏱️ Temps :** 2 minutes

---

### Étape 3.7 : Vérification que l'app n'est pas affectée

**Important :** Le CLI n'affecte PAS le code de l'app, mais vérifions quand même.

```bash
# Test build
npm run build
```

**✅ Attendu :**
- Build réussit sans erreur
- Aucun changement dans la taille du bundle

```bash
# Test dev
npm run dev
```

**✅ Attendu :**
- App démarre normalement
- Login/Logout fonctionnent
- Requêtes Supabase fonctionnent

**Procédure de test rapide :**
1. Ouvrir http://localhost:5173/
2. Se connecter
3. Naviguer dans 2-3 pages (Traitements, Profil)
4. ✅ Vérifier : Données chargent correctement

**⏱️ Temps :** 3 minutes

---

### Étape 3.8 : Validation et commit

```bash
# Arrêter le dev server (Ctrl+C)

# Vérifier les modifications
git status
# Doit afficher :
#   modified: package.json
#   modified: package-lock.json

# Voir les différences
git diff package.json | grep supabase
# Doit montrer : "supabase": "^2.67.2"

# Ajouter les modifications
git add package.json package-lock.json

# Commiter
git commit -m "Update supabase CLI 2.54.11 → 2.67.2"

# Créer le tag de succès
git tag step-3-supabase-cli-updated

# Vérifier
git tag | tail -4
```

**⏱️ Temps :** 1 minute

---

## ✅ Checklist de validation

### Phase préparation
- [ ] Tag `step-2-before-supabase-cli-update` créé
- [ ] État git propre

### Phase mise à jour
- [ ] Version actuelle vérifiée : `2.54.11`
- [ ] Commande `npm install -D supabase@latest` exécutée
- [ ] Nouvelle version vérifiée : `2.67.2`

### Phase tests CLI
- [ ] `npx supabase --version` affiche `2.67.2`
- [ ] `npx supabase help` fonctionne
- [ ] Liste des commandes affichée
- [ ] Aucune erreur CLI

### Phase tests optionnels
- [ ] `npx supabase status` exécuté (résultat noté)
- [ ] `npx supabase gen types` testé (si applicable)

### Phase tests app
- [ ] `npm run build` réussit
- [ ] Taille bundle inchangée
- [ ] `npm run dev` démarre
- [ ] Application fonctionne (login, navigation)
- [ ] Requêtes Supabase fonctionnent

### Phase commit
- [ ] Modifications git vérifiées
- [ ] Commit créé avec message approprié
- [ ] Tag `step-3-supabase-cli-updated` créé

### Validation finale
- [ ] **Date de réalisation :** ___/___/2025
- [ ] **Réalisé par :** _______________
- [ ] **Résultat :** ✅ OK / ❌ KO
- [ ] **Durée réelle :** ___ minutes
- [ ] **App affectée :** Oui / Non
- [ ] **Problèmes rencontrés :** _______________

---

## 🔄 Procédure de rollback

### Rollback simple

```bash
# Revenir au tag précédent
git reset --hard step-2-before-supabase-cli-update

# Réinstaller
npm install

# Vérifier la version CLI
npx supabase --version
# Doit afficher : 2.54.11
```

### Rollback si app cassée (improbable)

```bash
# Rollback complet
git reset --hard backup-v0.0.0-before-any-update
npm install
npm run dev
```

---

## ⚠️ Problèmes courants

### Problème 1 : CLI ne se met pas à jour

**Symptôme :**
```bash
npx supabase --version
# Affiche toujours 2.54.11
```

**Cause :** Cache npm

**Solution :**
```bash
# Nettoyer le cache npm
npm cache clean --force

# Supprimer le package
rm -rf node_modules/supabase

# Réinstaller
npm install -D supabase@2.67.2

# Vérifier
npx supabase --version
```

### Problème 2 : Commande "supabase" non trouvée

**Symptôme :**
```
'supabase' is not recognized as an internal or external command
```

**Cause :** Package non installé ou PATH incorrect

**Solution :**
```bash
# Utiliser npx
npx supabase --version

# Ou installer globalement (optionnel)
npm install -g supabase@2.67.2
```

### Problème 3 : Erreur "Not logged in"

**Symptôme :**
```
Error: You are not logged in
```

**Cause :** Commande nécessite authentification

**Solution :**
```bash
# Se connecter (optionnel)
npx supabase login

# Ou ignorer cette erreur si vous n'utilisez pas le CLI en ligne
```

### Problème 4 : Types TypeScript non générés

**Symptôme :**
```
Error: Failed to generate types
```

**Cause :** Projet non configuré ou credentials manquants

**Solution :**
- Cette étape est **optionnelle**
- Les types sont générés automatiquement par Lovable
- Vous pouvez ignorer cette erreur

---

## 📊 Changements apportés

### Dans package.json
```diff
{
  "devDependencies": {
-   "supabase": "^2.54.11",
+   "supabase": "^2.67.2"
  }
}
```

### Aucun changement dans le code source
- ✅ Aucun fichier `.ts` ou `.tsx` modifié
- ✅ Aucun changement dans `src/`
- ✅ CLI uniquement

---

## 📈 Nouveautés CLI 2.67.2

### Améliorations principales (2.54.11 → 2.67.2)

1. **Commandes DB :**
   - Amélioration `supabase db diff`
   - Meilleure détection des changements de schéma
   - Support PostgreSQL 15

2. **Génération de types :**
   - Types TypeScript plus précis
   - Support des types custom PostgreSQL
   - Meilleure gestion des ENUM

3. **Edge Functions :**
   - Déploiement plus rapide
   - Meilleurs logs
   - Support Deno 1.38+

4. **Migrations :**
   - Meilleure gestion des conflits
   - Rollback amélioré
   - Support des seeds

### Changelog complet
https://github.com/supabase/cli/releases

---

## 🎯 Critères de succès

Cette étape est **RÉUSSIE** si :

1. ✅ CLI mis à jour vers 2.67.2
2. ✅ `npx supabase --version` affiche `2.67.2`
3. ✅ `npx supabase help` fonctionne
4. ✅ Application non affectée (build + dev + navigation)
5. ✅ Commit et tag créés

---

## 📝 Notes importantes

### CLI vs Client JS

**À retenir :**
- ✅ **CLI (cette étape) :** Outil dev, pas d'impact app
- ⚠️ **Client JS (étape suivante) :** Code app, impact critique

### Utilisation du CLI dans MyHealthPlus

Le CLI Supabase peut être utilisé pour :

1. **Générer les types TypeScript :**
   ```bash
   npx supabase gen types typescript --project-id rozkooglygxyaaedvebn > src/integrations/supabase/types.ts
   ```

2. **Créer des migrations :**
   ```bash
   npx supabase migration new add_new_table
   ```

3. **Déployer des migrations :**
   ```bash
   npx supabase db push
   ```

**Note :** Ces commandes sont optionnelles. Votre projet peut fonctionner sans elles.

### Supabase en local (optionnel)

Si vous voulez tester Supabase en local :
```bash
# Démarrer Supabase local (nécessite Docker)
npx supabase start

# Arrêter
npx supabase stop
```

**⚠️ Attention :** Cela nécessite Docker installé et lancé.

---

## ⏭️ Prochaine étape

Une fois cette étape validée avec succès :
→ **[Étape 04 : Mise à jour @supabase/supabase-js](../etape-04-supabase-js/04-mise-a-jour-supabase-js.md)**

**⚠️ ATTENTION :** L'étape suivante est **CRITIQUE** (backend complet). Prenez le temps nécessaire.

---

**🛠️ Étape simple mais importante - Le CLI mis à jour facilitera les futures migrations DB !**
