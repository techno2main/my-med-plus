# 📋 Plan de Mise à Jour des Dépendances - MyHealthPlus

**Date de création :** 18 décembre 2025  
**Application :** MyHealthPlus (Capacitor + React + Vite + Supabase)  
**Durée estimée totale :** 3h30 - 4h

---

## 🎯 Vue d'ensemble

Ce plan détaille la mise à jour de **66 dépendances** avec une approche progressive et sécurisée garantissant un rollback total à chaque étape.

### Statistiques
- **Total dépendances :** 88
- **À mettre à jour :** 66
- **Déjà à jour :** 22
- **Vulnérabilités :** 6 (1 haute, 5 modérées)
- **Conflit bloquant :** 1 (jspdf-customfonts)

---

## 📂 Structure de la documentation

Chaque étape possède :
- ✅ Un dossier dédié (`etape-XX-nom/`)
- ✅ Un fichier markdown détaillé
- ✅ Une checklist de validation
- ✅ Une procédure de rollback
- ✅ Une estimation de durée

### Étapes

| Étape | Priorité | Dépendance | Durée | Risque | Statut |
|-------|----------|-----------|-------|--------|--------|
| [01](etape-01-jspdf-customfonts/01-suppression-jspdf-customfonts.md) | 🔴 P0 | jspdf-customfonts | 15 min | 🟢 Faible | ⏳ À faire |
| [02](etape-02-vite/02-mise-a-jour-vite.md) | 🔴 P1 | vite | 10 min | 🟢 Minimal | ⏳ À faire |
| [03](etape-03-supabase-cli/03-mise-a-jour-supabase-cli.md) | 🔴 P2 | supabase CLI | 15 min | 🟢 Minimal | ⏳ À faire |
| [04](etape-04-supabase-js/04-mise-a-jour-supabase-js.md) | 🟠 P3 | @supabase/supabase-js | 30 min | 🟡 Moyen | ⏳ À faire |
| [05](etape-05-react-query/05-mise-a-jour-react-query.md) | 🟠 P4 | @tanstack/react-query | 20 min | 🟢 Faible | ⏳ À faire |
| [06](etape-06-capacitor/06-mise-a-jour-capacitor.md) | 🟡 P5 | Capacitor (9 packages) | 20 min | 🟢 Minimal | ⏳ À faire |
| [07](etape-07-react-hook-form/07-mise-a-jour-react-hook-form.md) | 🟡 P6 | react-hook-form | 15 min | 🟢 Minimal | ⏳ À faire |
| [08](etape-08-radix-ui/08-mise-a-jour-radix-ui.md) | 🟡 P7 | Radix UI (32 packages) | 30 min | 🟢 Minimal | ⏳ À faire |
| [09](etape-09-typescript-eslint/09-mise-a-jour-typescript-eslint.md) | 🟢 P8 | TypeScript + ESLint | 15 min | 🟢 Minimal | ⏳ À faire |
| [10](etape-10-utilitaires/10-mise-a-jour-utilitaires.md) | 🟢 P9 | Utilitaires divers | 20 min | 🟢 Minimal | ⏳ À faire |

---

## 🚀 Comment utiliser cette documentation

### 1. Préparation (Phase 0)
```bash
# Créer la branche de travail
git checkout -b feature/deps-update-2025-12
git tag backup-v0.0.0-before-any-update
git push origin backup-v0.0.0-before-any-update

# Tester l'état initial
npm run dev
npm run build
```

### 2. Exécution étape par étape
Pour chaque étape :
1. ✅ Ouvrir le fichier markdown de l'étape
2. ✅ Suivre la procédure détaillée
3. ✅ Cocher les items de la checklist
4. ✅ Commiter avec le message recommandé
5. ✅ Passer à l'étape suivante

### 3. Validation finale
Après toutes les étapes :
```bash
# Tests exhaustifs
npm run build
npm run flow:build  # Build Android
npm audit

# Merge dans main
git checkout main
git merge feature/deps-update-2025-12
git push origin main
```

---

## 🔄 Stratégies d'exécution

### Option A : Conservative (RECOMMANDÉE) 🎯
```
Bloc 1 : Étapes 1-3 (déblocage + sécurité)
→ Tests + Validation + Merge
→ Pause 2-3 jours (monitoring)

Bloc 2 : Étapes 4-5 (backend critique)
→ Tests exhaustifs + Validation + Merge
→ Pause 2-3 jours

Bloc 3 : Étapes 6-10 (reste)
→ Tests + Validation + Merge
```
**Durée :** 2 semaines  
**Risque :** Minimal  
**Pour :** Production avec utilisateurs actifs

### Option B : Agressive ⚡
```
Étapes 1-10 d'un coup
→ Tests exhaustifs
→ Merge si tout OK
```
**Durée :** 1 jour  
**Risque :** Modéré  
**Pour :** Phase développement

### Option C : Hybride (BON COMPROMIS) ⚖️
```
Jour 1 AM : Étapes 1-3
Jour 1 PM : Étape 4 (tests exhaustifs)
Jour 2 AM : Étapes 5-6
Jour 2 PM : Étapes 7-10
Jour 3 : Validation finale + Merge
```
**Durée :** 2-3 jours  
**Risque :** Faible  
**Pour :** Votre cas ✅

---

## ⚠️ Points d'attention critiques

### Étape 4 (Supabase JS) - CRITIQUE
- ⚠️ **+13 versions** mineures → risque modéré
- ⚠️ **Backend complet** affecté (auth, DB, storage)
- ⚠️ **Temps de test requis :** 45 minutes minimum
- ✅ **Rollback immédiat** possible si problème

### Étape 6 (Capacitor) - BUILD REQUIS
- ⚠️ **Rebuild Android** nécessaire
- ⚠️ **Test sur appareil** fortement recommandé
- ✅ Patches mineurs uniquement (7.4.3 → 7.4.4)

---

## 📊 Matrice Risque/Impact

| Risque | Étapes concernées | Action si échec |
|--------|------------------|-----------------|
| 🟢 Minimal | 1, 2, 3, 5, 6, 7, 8, 9, 10 | Rollback immédiat via git tag |
| 🟡 Moyen | 4 (@supabase/supabase-js) | Rollback + analyse logs + report |

---

## 🛡️ Garantie de rollback

Chaque étape crée un tag Git :
```
step-0-before-jspdf-removal
step-1-jspdf-customfonts-removed
step-2-vite-updated
step-3-supabase-cli-updated
...
```

Rollback à n'importe quelle étape :
```bash
git reset --hard step-X-[nom]
npm install
npm run dev
```

Rollback total :
```bash
git reset --hard backup-v0.0.0-before-any-update
npm install
```

---

## 📝 Suivi de progression

Mettez à jour ce tableau après chaque étape :

- [ ] **Étape 01** - jspdf-customfonts supprimé - Date : ___/___/___ - OK/KO : ___
- [ ] **Étape 02** - vite mis à jour - Date : ___/___/___ - OK/KO : ___
- [ ] **Étape 03** - supabase CLI mis à jour - Date : ___/___/___ - OK/KO : ___
- [ ] **Étape 04** - @supabase/supabase-js mis à jour - Date : ___/___/___ - OK/KO : ___
- [ ] **Étape 05** - @tanstack/react-query mis à jour - Date : ___/___/___ - OK/KO : ___
- [ ] **Étape 06** - Capacitor mis à jour - Date : ___/___/___ - OK/KO : ___
- [ ] **Étape 07** - react-hook-form mis à jour - Date : ___/___/___ - OK/KO : ___
- [ ] **Étape 08** - Radix UI mis à jour - Date : ___/___/___ - OK/KO : ___
- [ ] **Étape 09** - TypeScript/ESLint mis à jour - Date : ___/___/___ - OK/KO : ___
- [ ] **Étape 10** - Utilitaires mis à jour - Date : ___/___/___ - OK/KO : ___
- [ ] **Validation finale** - Tests exhaustifs - Date : ___/___/___ - OK/KO : ___
- [ ] **Merge main** - Production déployée - Date : ___/___/___ - OK/KO : ___

---

## 📞 Support

En cas de problème :
1. ✅ Consulter la section "Problèmes courants" de l'étape
2. ✅ Vérifier les logs dans la console
3. ✅ Rollback à l'étape précédente
4. ✅ Documenter l'erreur rencontrée

---

**🎯 Prêt à commencer ? Ouvrez [Étape 01 - Suppression jspdf-customfonts](etape-01-jspdf-customfonts/01-suppression-jspdf-customfonts.md)**
