# 🟠 ÉTAPE 05 : Mise à jour @tanstack/react-query

**Priorité :** P4 - MOYENNE  
**Durée estimée :** 20 minutes  
**Risque :** 🟢 Faible (patches)  
**Type d'action :** PATCH (5.83.0 → 5.90.12)

---

## 📋 Vue d'ensemble

### Package concerné
- **Nom :** `@tanstack/react-query`
- **Version actuelle :** `5.83.0`
- **Version cible :** `5.90.12`
- **Type :** Patches (+7 versions)

### Impact
- Gestion du cache des requêtes Supabase
- Utilisé dans tous les hooks `useQuery` de l'app
- Invalidation cache après mutations

---

## 🔧 Procédure

### 5.1 : Sauvegarde
```bash
git add -A
git commit -m "Checkpoint avant React Query" --allow-empty
git tag step-4-before-react-query-update
```

### 5.2 : Mise à jour
```bash
npm install @tanstack/react-query@5.90.12
npm list @tanstack/react-query
```

### 5.3 : Tests
```bash
npm run build  # ✅ Build réussit
npm run dev
```

**Tests manuels :**
1. Aller dans Traitements → Ajouter un traitement
2. ✅ Liste se rafraîchit automatiquement
3. Naviguer rapidement entre pages
4. ✅ Pas de doublons de requêtes
5. ✅ Cache fonctionne

### 5.4 : Commit
```bash
git add package.json package-lock.json
git commit -m "Update @tanstack/react-query 5.83.0 → 5.90.12"
git tag step-5-react-query-updated
```

---

## ✅ Checklist

- [ ] Tag `step-4-before-react-query-update` créé
- [ ] Package mis à jour (5.90.12)
- [ ] Build compile
- [ ] App démarre
- [ ] Cache invalidation fonctionne
- [ ] CRUD traitement OK
- [ ] Navigation rapide OK
- [ ] Commit créé
- [ ] **Date :** ___/___/2025
- [ ] **Résultat :** ✅ OK / ❌ KO

---

## 🔄 Rollback
```bash
git reset --hard step-4-before-react-query-update
npm install
```

---

## ⏭️ Prochaine étape
→ **[Étape 06 : Capacitor](../etape-06-capacitor/06-mise-a-jour-capacitor.md)**
