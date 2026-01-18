# 🟢 ÉTAPE 09 : Mise à jour TypeScript + ESLint

**Priorité :** P8 - BASSE  
**Durée estimée :** 15 minutes  
**Risque :** 🟢 Minimal (dev tools)  
**Type d'action :** MINOR (outils de développement)

---

## 📋 Vue d'ensemble

### Packages concernés
```
typescript: 5.8.3 → 5.9.3
typescript-eslint: 8.38.0 → 8.50.0
eslint: 9.32.0 → 9.39.2
@eslint/js: 9.32.0 → 9.39.2
eslint-plugin-react-refresh: 0.4.20 → 0.4.26
```

### Impact
- Build, typage, linting
- Aucun impact runtime

---

## 🔧 Procédure

### 9.1 : Sauvegarde
```bash
git add -A
git commit -m "Checkpoint avant TypeScript/ESLint" --allow-empty
git tag step-8-before-ts-eslint-update
```

### 9.2 : Mise à jour TypeScript
```bash
npm install -D typescript@5.9.3 typescript-eslint@8.50.0
npm run build  # ✅ Build doit réussir
```

### 9.3 : Mise à jour ESLint
```bash
npm install -D eslint@9.39.2 @eslint/js@9.39.2 \
  eslint-plugin-react-refresh@0.4.26
npm run lint  # ✅ Pas de nouvelles erreurs critiques
```

### 9.4 : Tests
```bash
npm run build  # ✅ Compilation OK
npm run dev    # ✅ App démarre
```

### 9.5 : Commit
```bash
git add package.json package-lock.json
git commit -m "Update TypeScript 5.8.3 → 5.9.3 + ESLint tools"
git tag step-9-ts-eslint-updated
```

---

## ✅ Checklist

- [ ] Tag créé
- [ ] TypeScript mis à jour (5.9.3)
- [ ] TypeScript-ESLint mis à jour (8.50.0)
- [ ] ESLint mis à jour (9.39.2)
- [ ] Plugins ESLint mis à jour
- [ ] `npm run build` réussit
- [ ] `npm run lint` passe (ou warnings acceptables)
- [ ] `npm run dev` démarre
- [ ] App fonctionne
- [ ] Commit créé
- [ ] **Date :** ___/___/2025
- [ ] **Résultat :** ✅ OK / ❌ KO

---

## 🔄 Rollback
```bash
git reset --hard step-8-before-ts-eslint-update
npm install
```

---

## ⏭️ Prochaine étape
→ **[Étape 10 : Utilitaires](../etape-10-utilitaires/10-mise-a-jour-utilitaires.md)**
