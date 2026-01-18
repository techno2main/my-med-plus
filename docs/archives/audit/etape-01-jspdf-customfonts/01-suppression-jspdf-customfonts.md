# 🔴 ÉTAPE 01 : Suppression jspdf-customfonts

**Priorité :** P0 - CRITIQUE (BLOQUANT)  
**Durée estimée :** 15 minutes  
**Risque :** 🟢 Faible (package non utilisé)  
**Type d'action :** SUPPRESSION

---

## 📋 Vue d'ensemble

### Package concerné
- **Nom :** `jspdf-customfonts`
- **Version actuelle :** `0.0.4-rc.4`
- **Statut :** ❌ Abandonné depuis 2019
- **Problème :** Incompatible avec jsPDF 3.x, **bloque toutes les autres mises à jour npm**

### Contexte critique
Ce package est installé mais **NON UTILISÉ** dans le code source. Il a été ajouté par erreur ou lors d'une phase de test.

**Preuve d'absence d'utilisation :**
```bash
# Recherche effectuée dans tout le code source
grep -rn "jspdf-customfonts" src/
# Résultat : Aucune correspondance trouvée

grep -rn "require.*jspdf" src/
# Résultat : Aucun require() de jspdf-customfonts
```

### Fichier PDF actuel
Le générateur PDF utilise uniquement :
- ✅ `jspdf@3.0.3` (moderne, compatible)
- ✅ `jspdf-autotable@5.0.2` (compatible jsPDF 3.x)
- ✅ Police `helvetica` (standard jsPDF, pas besoin de plugin)

**Fichier concerné :** [`src/pages/profile-export/utils/pdfGenerator.ts`](../../src/pages/profile-export/utils/pdfGenerator.ts)

```typescript
// Code actuel (lignes 1-26)
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// ❌ PAS d'import de jspdf-customfonts !

const doc = new jsPDF({...});
doc.setFont('helvetica'); // ✅ Police standard, pas besoin de plugin
```

### Impact de la suppression
- ✅ **Aucun impact fonctionnel** (package non utilisé)
- ✅ **Débloque npm install** (résout le conflit de dépendances)
- ✅ **Permet les autres mises à jour**
- ✅ **Réduit la taille des node_modules**

---

## 🎯 Objectifs

1. ✅ Désinstaller `jspdf-customfonts`
2. ✅ Vérifier que la génération PDF fonctionne toujours
3. ✅ Débloquer les futures mises à jour npm
4. ✅ Commiter proprement

---

## 🔧 Procédure détaillée

### Étape 1.1 : Sauvegarde initiale

```bash
# Vérifier qu'on est sur la bonne branche
git branch
# Doit afficher : * feature/deps-update-2025-12

# Vérifier l'état propre
git status
# Doit être clean (no changes)

# Créer un commit de sauvegarde
git add -A
git commit -m "Checkpoint avant suppression jspdf-customfonts"

# Créer le tag de rollback
git tag step-0-before-jspdf-removal

# Vérifier le tag
git tag
# Doit afficher le tag créé
```

**⏱️ Temps :** 2 minutes

---

### Étape 1.2 : Désinstallation du package

```bash
# Désinstaller jspdf-customfonts
npm uninstall jspdf-customfonts

# Vérifier la suppression dans package.json
cat package.json | grep jspdf
# Doit afficher UNIQUEMENT :
#   "jspdf": "^3.0.3",
#   "jspdf-autotable": "^5.0.2"
# (SANS jspdf-customfonts)
```

**✅ Résultat attendu :**
- `package.json` modifié (jspdf-customfonts supprimé)
- `package-lock.json` modifié (dépendances recalculées)
- Aucune erreur npm

**⏱️ Temps :** 1 minute

---

### Étape 1.3 : Vérification compilation

```bash
# Test 1 : Vérifier que le build compile
npm run build
```

**✅ Attendu :**
```
✓ built in XXXms
✓ XXX modules transformed
```

**❌ Si erreur :**
- Lire le message d'erreur
- Vérifier qu'il ne concerne PAS jspdf-customfonts
- Si c'est lié, passer au rollback (voir section ci-dessous)

**⏱️ Temps :** 2 minutes

---

### Étape 1.4 : Test développement

```bash
# Démarrer le serveur de développement
npm run dev
```

**✅ Attendu :**
```
VITE v5.4.19  ready in XXX ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Vérifications console :**
1. Ouvrir http://localhost:5173/
2. Ouvrir DevTools (F12) → Onglet Console
3. ✅ Vérifier : Aucune erreur liée à jsPDF
4. ✅ Vérifier : Aucune erreur de module manquant

**⏱️ Temps :** 2 minutes

---

### Étape 1.5 : Test génération PDF (CRITIQUE)

Cette étape est **OBLIGATOIRE** car c'est la seule fonctionnalité potentiellement affectée.

#### Procédure de test :

1. **Se connecter** à l'application
   - Utiliser un compte de test
   - ✅ Login doit fonctionner

2. **Naviguer vers la génération PDF**
   - Aller dans **Profil** ou **Confidentialité**
   - Chercher le bouton "Exporter en PDF" ou similaire
   - Cliquer dessus

3. **Vérifier la génération**
   - ✅ Modal/Dialog s'ouvre
   - ✅ Génération démarre (loader/spinner)
   - ✅ PDF se génère sans erreur
   - ✅ PDF s'ouvre ou se télécharge

4. **Vérifier le contenu du PDF**
   - Ouvrir le PDF généré
   - ✅ Texte lisible (police Helvetica)
   - ✅ Tableaux affichés correctement
   - ✅ Pas de caractères manquants
   - ✅ Mise en page correcte

#### Fichiers PDF générés par l'app :
- Export profil patient : [`src/pages/profile-export/utils/pdfGenerator.ts`](../../src/pages/profile-export/utils/pdfGenerator.ts)
- Potentiellement : Ordonnances, rapports médicaux

**⏱️ Temps :** 5 minutes

**✅ Test réussi si :**
- PDF génère sans erreur
- Police Helvetica s'affiche correctement
- Tableaux (via jspdf-autotable) fonctionnent

**❌ Test échoué si :**
- Erreur console lors de la génération
- PDF vide ou corrompu
- Police manquante ou illisible
→ **Passer au rollback immédiatement**

---

### Étape 1.6 : Validation et commit

```bash
# Vérifier les modifications
git status
# Doit afficher :
#   modified: package.json
#   modified: package-lock.json

# Ajouter les modifications
git add package.json package-lock.json

# Commiter avec un message explicite
git commit -m "Remove jspdf-customfonts (unused, incompatible with jsPDF 3.x)"

# Créer le tag de succès
git tag step-1-jspdf-customfonts-removed

# Vérifier les tags
git tag
# Doit afficher :
#   backup-v0.0.0-before-any-update
#   step-0-before-jspdf-removal
#   step-1-jspdf-customfonts-removed
```

**⏱️ Temps :** 2 minutes

---

## ✅ Checklist de validation

Cochez chaque item après validation :

### Phase préparation
- [ ] Branche `feature/deps-update-2025-12` créée
- [ ] Tag `step-0-before-jspdf-removal` créé
- [ ] État git propre (no changes)

### Phase désinstallation
- [ ] Commande `npm uninstall jspdf-customfonts` exécutée
- [ ] `package.json` modifié (jspdf-customfonts supprimé)
- [ ] `package-lock.json` modifié
- [ ] Aucune erreur npm

### Phase tests compilation
- [ ] `npm run build` réussit
- [ ] Aucune erreur TypeScript
- [ ] Aucun warning critique

### Phase tests développement
- [ ] `npm run dev` démarre
- [ ] http://localhost:5173/ accessible
- [ ] Console navigateur sans erreurs jsPDF
- [ ] Aucune erreur "module not found"

### Phase tests PDF (CRITIQUE)
- [ ] Navigation vers page génération PDF réussie
- [ ] Bouton "Exporter PDF" cliquable
- [ ] Génération PDF démarre
- [ ] PDF généré sans erreur console
- [ ] PDF téléchargé/ouvert
- [ ] Contenu PDF lisible (texte + tableaux)
- [ ] Police Helvetica affichée correctement
- [ ] Pas de caractères manquants

### Phase commit
- [ ] Modifications git vérifiées
- [ ] Commit créé avec message approprié
- [ ] Tag `step-1-jspdf-customfonts-removed` créé
- [ ] Tags visibles via `git tag`

### Validation finale
- [ ] **Date de réalisation :** ___/___/2025
- [ ] **Réalisé par :** _______________
- [ ] **Résultat :** ✅ OK / ❌ KO
- [ ] **Durée réelle :** ___ minutes
- [ ] **Problèmes rencontrés :** _______________

---

## 🔄 Procédure de rollback

### Si test PDF échoue (peu probable)

```bash
# Rollback immédiat au tag précédent
git reset --hard step-0-before-jspdf-removal

# Réinstaller les dépendances
npm install

# Tester que ça refonctionne
npm run dev
# → Tester génération PDF

# → Si ça refonctionne, analyser pourquoi la suppression a cassé
```

### Si problème après commit

```bash
# Rollback au tag de sauvegarde initial
git reset --hard backup-v0.0.0-before-any-update

# Réinstaller
npm install
npm run dev
```

---

## ⚠️ Problèmes courants

### Problème 1 : Erreur "Cannot find module 'jspdf-customfonts'"

**Symptôme :**
```
Error: Cannot find module 'jspdf-customfonts'
```

**Cause :** Il existe un import caché quelque part

**Solution :**
```bash
# Rechercher dans TOUS les fichiers (y compris node_modules)
grep -r "jspdf-customfonts" . --exclude-dir=node_modules

# Si trouvé dans src/, modifier le fichier pour supprimer l'import
```

### Problème 2 : PDF génère mais police manquante

**Symptôme :** PDF vide ou texte illisible

**Cause :** Code utilisait une police custom via jspdf-customfonts

**Solution :**
```typescript
// Dans pdfGenerator.ts, vérifier :
doc.setFont('helvetica'); // ✅ Police standard
// Remplacer toute police custom par helvetica, times ou courier
```

### Problème 3 : npm install échoue après désinstallation

**Symptôme :**
```
npm ERR! ERESOLVE could not resolve
```

**Cause :** Cache npm corrompu

**Solution :**
```bash
# Nettoyer le cache npm
npm cache clean --force

# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json

# Réinstaller proprement
npm install
```

---

## 📊 Résultats attendus

### Avant suppression
```json
{
  "dependencies": {
    "jspdf": "^3.0.3",
    "jspdf-autotable": "^5.0.2",
    "jspdf-customfonts": "^0.0.4-rc.4"  // ❌ Conflit
  }
}
```

**État npm install :**
```
npm ERR! ERESOLVE could not resolve
npm ERR! Conflicting peer dependency: jspdf@1.5.3
```

### Après suppression
```json
{
  "dependencies": {
    "jspdf": "^3.0.3",
    "jspdf-autotable": "^5.0.2"
    // ✅ jspdf-customfonts supprimé
  }
}
```

**État npm install :**
```
✅ added XXX packages in XXs
```

---

## 🎯 Critères de succès

Cette étape est **RÉUSSIE** si :

1. ✅ Package `jspdf-customfonts` supprimé de `package.json`
2. ✅ `npm install` fonctionne sans erreur
3. ✅ `npm run build` compile sans erreur
4. ✅ `npm run dev` démarre sans erreur
5. ✅ **Génération PDF fonctionne** (test manuel validé)
6. ✅ Commit et tag créés

---

## 📝 Notes importantes

### Pourquoi ce package était installé ?
- Probablement ajouté lors d'une phase de test
- Ou copié d'un autre projet
- Jamais supprimé car "au cas où"
- **Conclusion :** Inutile, peut être supprimé en toute sécurité

### Alternatives si on avait besoin de polices custom
Si dans le futur vous voulez ajouter des polices personnalisées :
1. jsPDF 3.x les supporte nativement via `addFont()`
2. Pas besoin de plugin externe
3. Documentation : https://github.com/parallax/jsPDF#fonts

```typescript
// Exemple avec jsPDF 3.x (si besoin futur)
import { jsPDF } from 'jspdf';

const doc = new jsPDF();

// Convertir votre .ttf en base64
const fontBase64 = '...'; // votre police en base64

// Ajouter la police
doc.addFileToVFS('MaPolice.ttf', fontBase64);
doc.addFont('MaPolice.ttf', 'MaPolice', 'normal');
doc.setFont('MaPolice');
```

---

## ⏭️ Prochaine étape

Une fois cette étape validée avec succès :
→ **[Étape 02 : Mise à jour Vite](../etape-02-vite/02-mise-a-jour-vite.md)**

---

**🎯 Étape critique pour débloquer tout le reste - Prenez le temps de bien tester la génération PDF !**
