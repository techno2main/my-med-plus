# 🔴 ÉTAPE 02 : Mise à jour Vite

**Priorité :** P1 - HAUTE (SÉCURITÉ)  
**Durée estimée :** 10 minutes  
**Risque :** 🟢 Minimal  
**Type d'action :** PATCH (5.4.19 → 5.4.21)

---

## 📋 Vue d'ensemble

### Package concerné
- **Nom :** `vite`
- **Version actuelle :** `5.4.19`
- **Version cible :** `5.4.21`
- **Type de mise à jour :** Patch (corrections bugs + sécurité)
- **Dépendance :** devDependencies (build tool)

### Vulnérabilités corrigées

| CVE | Sévérité | Description | Impact |
|-----|----------|-------------|--------|
| GHSA-g4jq-h2w9-997c | 🟡 Low | Middleware file serving | Accès fichiers non autorisés |
| GHSA-jqfw-vq24-v9c3 | 🟡 Low | server.fs settings HTML | Lecture fichiers système |
| GHSA-93m4-6634-74q7 | 🟠 Moderate | Windows backslash bypass | Path traversal Windows |

**Total :** 3 vulnérabilités corrigées

### Impact sur MyHealthPlus

**Vite est utilisé pour :**
- ✅ Build de production (`npm run build`)
- ✅ Serveur de développement (`npm run dev`)
- ✅ Hot Module Replacement (HMR)
- ✅ Optimisation des assets
- ✅ Transpilation TypeScript

**Fichiers de configuration :**
- [`vite.config.ts`](../../vite.config.ts)
- [`tsconfig.json`](../../tsconfig.json)

---

## 🎯 Objectifs

1. ✅ Mettre à jour Vite vers 5.4.21
2. ✅ Corriger les vulnérabilités de sécurité
3. ✅ Vérifier que le build fonctionne
4. ✅ Vérifier que le dev server fonctionne
5. ✅ Vérifier le HMR (Hot Module Replacement)

---

## 🔧 Procédure détaillée

### Étape 2.1 : Sauvegarde

```bash
# Vérifier qu'on est sur la bonne branche
git branch
# Doit afficher : * feature/deps-update-2025-12

# Vérifier l'état
git status
# Doit afficher uniquement les modifications de l'étape 1 (déjà commitées)

# Créer un commit de sauvegarde (au cas où)
git add -A
git commit -m "Checkpoint avant mise à jour Vite" --allow-empty

# Créer le tag de rollback
git tag step-1-before-vite-update

# Vérifier
git tag | grep step
```

**⏱️ Temps :** 1 minute

---

### Étape 2.2 : Mise à jour Vite

```bash
# Mettre à jour Vite
npm install vite@5.4.21

# Vérifier la version installée
npm list vite
# Doit afficher : vite@5.4.21
```

**✅ Résultat attendu :**
```
changed 1 package, and audited 902 packages in 3s
```

**❌ Si erreur :**
- Lire le message d'erreur
- Vérifier la connexion internet
- Si problème de dépendances, essayer `npm install vite@5.4.21 --legacy-peer-deps`

**⏱️ Temps :** 1 minute

---

### Étape 2.3 : Vérification build production

```bash
# Lancer le build
npm run build
```

**✅ Attendu :**
```
vite v5.4.21 building for production...
✓ XXX modules transformed.
dist/index.html                   X.XX kB │ gzip: X.XX kB
dist/assets/index-XXXXX.js        XXX.XX kB │ gzip: XXX.XX kB
✓ built in XXXms
```

**Points de vérification :**
- ✅ Version affichée : `vite v5.4.21`
- ✅ Build se termine sans erreur
- ✅ Dossier `dist/` créé
- ✅ Fichiers générés (index.html, assets/*.js, assets/*.css)

**❌ Si erreur :**
```bash
# Vérifier les logs complets
npm run build 2>&1 | tee build-error.log

# Lire build-error.log pour identifier le problème
```

**⏱️ Temps :** 2 minutes

---

### Étape 2.4 : Vérification dev server

```bash
# Démarrer le serveur de développement
npm run dev
```

**✅ Attendu :**
```
  VITE v5.4.21  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Points de vérification :**
1. ✅ Version affichée : `VITE v5.4.21`
2. ✅ Serveur démarre sans erreur
3. ✅ Port 5173 accessible
4. ✅ Ouvrir http://localhost:5173/ dans le navigateur
5. ✅ Application charge correctement
6. ✅ Console navigateur (F12) sans erreurs

**⏱️ Temps :** 2 minutes

---

### Étape 2.5 : Test Hot Module Replacement (HMR)

Le HMR permet de voir les modifications en temps réel sans recharger la page.

**Procédure de test :**

1. **Gardez `npm run dev` actif** dans le terminal
2. **Ouvrez l'app** dans le navigateur (http://localhost:5173/)
3. **Ouvrez un fichier source** (ex: `src/App.tsx`)
4. **Modifiez du texte visible** :
   ```tsx
   // Avant
   <h1>MyHealthPlus</h1>
   
   // Après (test)
   <h1>MyHealthPlus - TEST HMR</h1>
   ```
5. **Sauvegardez le fichier** (Ctrl+S)

**✅ Résultat attendu :**
- Terminal affiche : `[vite] hmr update /src/App.tsx`
- Navigateur se met à jour **SANS recharger la page**
- Le texte modifié apparaît instantanément

**❌ Si problème :**
- HMR ne fonctionne pas → Vérifier `vite.config.ts`
- Page recharge complètement → Normal pour certains fichiers (.tsx racine)

6. **Annuler la modification de test** :
   ```tsx
   // Remettre comme avant
   <h1>MyHealthPlus</h1>
   ```
7. **Sauvegarder** → HMR doit re-mettre à jour

**⏱️ Temps :** 2 minutes

---

### Étape 2.6 : Vérification des vulnérabilités

```bash
# Vérifier que les vulnérabilités Vite sont corrigées
npm audit | grep -i vite
```

**✅ Attendu :**
- Aucune ligne contenant "vite" avec vulnérabilité
- OU : Vulnérabilités réduites par rapport à avant

**Comparer avec l'audit initial :**
```bash
# Nombre de vulnérabilités avant (référence)
# - esbuild: moderate
# - vite: 3 issues (2 low, 1 moderate)

# Après mise à jour Vite 5.4.21 :
# - Les 3 vulnérabilités Vite doivent être résolues
```

**⏱️ Temps :** 1 minute

---

### Étape 2.7 : Validation et commit

```bash
# Arrêter le dev server (Ctrl+C si actif)

# Vérifier les modifications
git status
# Doit afficher :
#   modified: package.json
#   modified: package-lock.json

# Voir les différences
git diff package.json | grep vite
# Doit montrer : "vite": "^5.4.21"

# Ajouter les modifications
git add package.json package-lock.json

# Commiter avec un message explicite
git commit -m "Update vite 5.4.19 → 5.4.21 (fix 3 security vulnerabilities)"

# Créer le tag de succès
git tag step-2-vite-updated

# Vérifier les tags
git tag | tail -3
# Doit afficher les 3 derniers tags
```

**⏱️ Temps :** 1 minute

---

## ✅ Checklist de validation

### Phase préparation
- [ ] Tag `step-1-before-vite-update` créé
- [ ] État git propre

### Phase mise à jour
- [ ] Commande `npm install vite@5.4.21` exécutée
- [ ] Version vérifiée avec `npm list vite`
- [ ] Version affichée : `vite@5.4.21`

### Phase tests build
- [ ] `npm run build` réussit
- [ ] Version affichée : `vite v5.4.21`
- [ ] Dossier `dist/` créé
- [ ] Fichiers générés (HTML, JS, CSS)
- [ ] Aucune erreur de compilation

### Phase tests dev server
- [ ] `npm run dev` démarre
- [ ] Version affichée : `VITE v5.4.21`
- [ ] http://localhost:5173/ accessible
- [ ] Application charge correctement
- [ ] Console navigateur sans erreurs

### Phase tests HMR
- [ ] Modification d'un fichier .tsx détectée
- [ ] Terminal affiche "hmr update"
- [ ] Navigateur se met à jour (sans full reload)
- [ ] Modification annulée et HMR refonctionne

### Phase sécurité
- [ ] `npm audit` exécuté
- [ ] Vulnérabilités Vite réduites/supprimées
- [ ] Pas de nouvelles vulnérabilités introduites

### Phase commit
- [ ] Modifications git vérifiées
- [ ] Commit créé avec message approprié
- [ ] Tag `step-2-vite-updated` créé

### Validation finale
- [ ] **Date de réalisation :** ___/___/2025
- [ ] **Réalisé par :** _______________
- [ ] **Résultat :** ✅ OK / ❌ KO
- [ ] **Durée réelle :** ___ minutes
- [ ] **Vulnérabilités corrigées :** ___/3
- [ ] **Problèmes rencontrés :** _______________

---

## 🔄 Procédure de rollback

### Si build échoue

```bash
# Rollback au tag précédent
git reset --hard step-1-before-vite-update

# Réinstaller les dépendances
npm install

# Tester que ça refonctionne
npm run build
npm run dev
```

### Si dev server ne démarre pas

```bash
# Vérifier les processus Node en cours
netstat -ano | findstr :5173  # Windows
# Ou
lsof -i :5173  # Linux/Mac

# Tuer le processus si nécessaire
# Puis relancer npm run dev
```

### Si HMR ne fonctionne pas (non bloquant)

Le HMR qui ne fonctionne pas n'est **pas bloquant** pour la mise à jour. Vous pouvez continuer et investiguer plus tard.

Vérifications possibles :
```typescript
// Dans vite.config.ts, vérifier :
export default defineConfig({
  server: {
    hmr: true, // Doit être true ou omis
  },
});
```

---

## ⚠️ Problèmes courants

### Problème 1 : Erreur "Failed to resolve entry"

**Symptôme :**
```
Error: Failed to resolve entry for package "X"
```

**Cause :** Cache Vite corrompu

**Solution :**
```bash
# Supprimer le cache Vite
rm -rf node_modules/.vite

# Relancer
npm run dev
```

### Problème 2 : Port 5173 déjà utilisé

**Symptôme :**
```
Port 5173 is in use, trying another one...
```

**Cause :** Autre instance Vite active

**Solution :**
```bash
# Arrêter toutes les instances Node
taskkill /F /IM node.exe  # Windows
# Ou
pkill -9 node  # Linux/Mac

# Relancer
npm run dev
```

### Problème 3 : Build lent ou freeze

**Symptôme :** Build prend > 5 minutes

**Solution :**
```bash
# Nettoyer et rebuild
npm run build -- --force

# Si toujours lent, vérifier les ressources système
```

### Problème 4 : Nouvelles erreurs TypeScript

**Symptôme :** Erreurs TypeScript qui n'existaient pas avant

**Cause :** Vite 5.4.21 peut avoir une vérification plus stricte

**Solution :**
```bash
# Lister les erreurs
npm run build 2>&1 | grep "TS"

# Corriger les erreurs TypeScript
# Ou ajouter des @ts-ignore si nécessaire (temporaire)
```

---

## 📊 Changements apportés

### Dans package.json
```diff
{
  "devDependencies": {
-   "vite": "^5.4.19",
+   "vite": "^5.4.21"
  }
}
```

### Dans package-lock.json
```
"node_modules/vite": {
  "version": "5.4.21",
  "resolved": "...",
  "integrity": "sha512-..."
}
```

---

## 📈 Bénéfices de cette mise à jour

### Sécurité
- ✅ 3 vulnérabilités corrigées
- ✅ Protection contre path traversal
- ✅ Meilleure isolation server.fs

### Performance
- ✅ Optimisations build
- ✅ HMR plus rapide
- ✅ Cache amélioré

### Compatibilité
- ✅ Meilleur support esbuild
- ✅ Corrections bugs TypeScript
- ✅ Support Node.js récent

---

## 🎯 Critères de succès

Cette étape est **RÉUSSIE** si :

1. ✅ Vite mis à jour vers 5.4.21
2. ✅ `npm run build` fonctionne
3. ✅ `npm run dev` démarre
4. ✅ Application accessible dans le navigateur
5. ✅ HMR fonctionne (test manuel validé)
6. ✅ Vulnérabilités Vite corrigées
7. ✅ Commit et tag créés

---

## 📝 Notes techniques

### Vite 5.x vs 6.x
- **5.4.21 :** Version stable, utilisée ici (patch)
- **6.x :** Nouvelle version majeure avec breaking changes
- **⚠️ Ne PAS passer en 6.x pour l'instant** (hors scope)

### Différences 5.4.19 → 5.4.21
- Fix: Windows path traversal (GHSA-93m4-6634-74q7)
- Fix: server.fs.deny bypass
- Fix: Middleware file serving
- Améliorations HMR
- Corrections bugs mineurs

### Configuration Vite actuelle
```typescript
// vite.config.ts (extrait)
export default defineConfig({
  plugins: [react(), /* ... */],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
  },
});
```

---

## ⏭️ Prochaine étape

Une fois cette étape validée avec succès :
→ **[Étape 03 : Mise à jour Supabase CLI](../etape-03-supabase-cli/03-mise-a-jour-supabase-cli.md)**

---

**🔒 Étape de sécurité importante - Les vulnérabilités path traversal sont critiques sur Windows !**
