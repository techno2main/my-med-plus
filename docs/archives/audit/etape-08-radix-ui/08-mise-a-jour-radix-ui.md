# 🟡 ÉTAPE 08 : Mise à jour Radix UI (32 packages)

**Priorité :** P7 - BASSE  
**Durée estimée :** 30 minutes  
**Risque :** 🟢 Minimal (patches)  
**Type d'action :** PATCH (versions mineures)

---

## 📋 Vue d'ensemble

### 32 packages Radix UI
Dialogs, menus, selects, tooltips, accordions, etc.

### Stratégie
Mise à jour par lots fonctionnels pour faciliter les tests.

---

## 🔧 Procédure

### 8.1 : Sauvegarde
```bash
git add -A
git commit -m "Checkpoint avant Radix UI" --allow-empty
git tag step-7-before-radix-ui-update
```

### 8.2 : LOT 1 - Dialogs & Overlays
```bash
npm install @radix-ui/react-dialog@latest \
  @radix-ui/react-alert-dialog@latest \
  @radix-ui/react-popover@latest \
  @radix-ui/react-hover-card@latest \
  @radix-ui/react-toast@latest \
  @radix-ui/react-tooltip@latest
```

**Test :** Dialogs (Ajouter traitement), Toasts, Tooltips

### 8.3 : LOT 2 - Forms & Inputs
```bash
npm install @radix-ui/react-select@latest \
  @radix-ui/react-checkbox@latest \
  @radix-ui/react-radio-group@latest \
  @radix-ui/react-switch@latest \
  @radix-ui/react-slider@latest
```

**Test :** Selects, Checkboxes, Switches dans formulaires

### 8.4 : LOT 3 - Navigation
```bash
npm install @radix-ui/react-dropdown-menu@latest \
  @radix-ui/react-context-menu@latest \
  @radix-ui/react-menubar@latest \
  @radix-ui/react-navigation-menu@latest
```

**Test :** Menus dropdown, Navigation

### 8.5 : LOT 4 - Reste
```bash
npm install @radix-ui/react-accordion@latest \
  @radix-ui/react-aspect-ratio@latest \
  @radix-ui/react-avatar@latest \
  @radix-ui/react-collapsible@latest \
  @radix-ui/react-label@latest \
  @radix-ui/react-progress@latest \
  @radix-ui/react-scroll-area@latest \
  @radix-ui/react-separator@latest \
  @radix-ui/react-slot@latest \
  @radix-ui/react-tabs@latest \
  @radix-ui/react-toggle@latest \
  @radix-ui/react-toggle-group@latest
```

### 8.6 : Test visuel complet
```bash
npm run dev
```

**Parcourir toutes les pages principales :**
- Dashboard
- Traitements
- Ordonnances
- Allergies
- Profil
- Paramètres

✅ Vérifier : Pas de bugs visuels, animations OK, pas d'erreurs console

### 8.7 : Commit
```bash
git add package.json package-lock.json
git commit -m "Update Radix UI (32 packages) - all components tested"
git tag step-8-radix-ui-updated
```

---

## ✅ Checklist

- [ ] Tag créé
- [ ] LOT 1 mis à jour (dialogs)
- [ ] Test dialogs OK
- [ ] LOT 2 mis à jour (forms)
- [ ] Test selects/checkboxes OK
- [ ] LOT 3 mis à jour (navigation)
- [ ] Test menus OK
- [ ] LOT 4 mis à jour (reste)
- [ ] Test visuel complet (toutes pages)
- [ ] Pas de bugs visuels
- [ ] Animations fluides
- [ ] Console propre
- [ ] Commit créé
- [ ] **Date :** ___/___/2025
- [ ] **Résultat :** ✅ OK / ❌ KO

---

## 🔄 Rollback
```bash
git reset --hard step-7-before-radix-ui-update
npm install
```

---

## ⏭️ Prochaine étape
→ **[Étape 09 : TypeScript/ESLint](../etape-09-typescript-eslint/09-mise-a-jour-typescript-eslint.md)**
