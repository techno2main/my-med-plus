# 🟡 ÉTAPE 07 : Mise à jour react-hook-form

**Priorité :** P6 - BASSE  
**Durée estimée :** 15 minutes  
**Risque :** 🟢 Minimal (patches)  
**Type d'action :** PATCH (7.61.1 → 7.68.0)

---

## 📋 Vue d'ensemble

### Package concerné
- **Nom :** `react-hook-form`
- **Version actuelle :** `7.61.1`
- **Version cible :** `7.68.0`
- **Impact :** Tous les formulaires de l'app

---

## 🔧 Procédure

### 7.1 : Sauvegarde
```bash
git add -A
git commit -m "Checkpoint avant react-hook-form" --allow-empty
git tag step-6-before-react-hook-form-update
```

### 7.2 : Mise à jour
```bash
npm install react-hook-form@7.68.0
npm list react-hook-form
```

### 7.3 : Tests formulaires
```bash
npm run dev
```

**Tests :**
1. ✅ Traitement : Ajouter
2. ✅ Validation champs requis
3. ✅ Allergie : Modifier
4. ✅ Profil : Sauvegarder
5. ✅ Auth : Login/Signup

### 7.4 : Commit
```bash
git add package.json package-lock.json
git commit -m "Update react-hook-form 7.61.1 → 7.68.0"
git tag step-7-react-hook-form-updated
```

---

## ✅ Checklist

- [ ] Tag créé
- [ ] Package mis à jour (7.68.0)
- [ ] Build compile
- [ ] Formulaire traitement OK
- [ ] Validation fonctionne
- [ ] Formulaire allergie OK
- [ ] Formulaire profil OK
- [ ] Login fonctionne
- [ ] Commit créé
- [ ] **Date :** ___/___/2025
- [ ] **Résultat :** ✅ OK / ❌ KO

---

## 🔄 Rollback
```bash
git reset --hard step-6-before-react-hook-form-update
npm install
```

---

## ⏭️ Prochaine étape
→ **[Étape 08 : Radix UI](../etape-08-radix-ui/08-mise-a-jour-radix-ui.md)**
