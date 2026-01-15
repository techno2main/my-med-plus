# 🟡 ÉTAPE 06 : Mise à jour Capacitor (9 packages)

**Priorité :** P5 - MOYENNE  
**Durée estimée :** 20-30 minutes  
**Risque :** � Moyen (MAJOR 7.x → 8.0.0)  
**Type d'action :** MAJOR + SYNC Android

---

## 📋 Vue d'ensemble

### Packages concernés (9)
```
@capacitor/core: 7.4.3 → 8.0.0
@capacitor/android: 7.4.3 → 8.0.0
@capacitor/ios: 7.4.3 → 8.0.0
@capacitor/cli: 7.4.3 → 8.0.0
@capacitor/app: 7.1.0 → 8.0.0
@capacitor/filesystem: 7.1.4 → 8.0.0
@capacitor/local-notifications: 7.0.3 → 8.0.0
@capacitor/push-notifications: 7.0.3 → 7.0.4
@capacitor/status-bar: 7.0.3 → 7.0.4
```

### Impact
- Plugins mobile (PDF, notifications, biométrie)
- **⚠️ Nécessite rebuild Android**

---

## 🔧 Procédure

### 6.1 : Sauvegarde
```bash
git add -A
git commit -m "Checkpoint avant Capacitor" --allow-empty
git tag step-5-before-capacitor-update
```

### 6.2 : Mise à jour Core
```bash
npm install @capacitor/core@7.4.4 \
  @capacitor/android@7.4.4 \
  @capacitor/ios@7.4.4
npm install -D @capacitor/cli@7.4.4
```

### 6.3 : Mise à jour Plugins
```bash
npm install @capacitor/app@7.1.1 \
  @capacitor/filesystem@7.1.6 \
  @capacitor/local-notifications@7.0.4 \
  @capacitor/push-notifications@7.0.4 \
  @capacitor/status-bar@7.0.4
```

### 6.4 : Synchronisation Android
```bash
npx cap sync android
# ✅ Doit afficher : "Sync complete"
```

### 6.5 : Tests Web
```bash
npm run dev
# Tester navigation, PDF, formulaires
```

### 6.6 : Build Android (CRITIQUE)
```bash
npm run flow:build
# OU
npm run build
npx cap sync android
npx cap open android
# → Build APK dans Android Studio
```

**Tests sur appareil/émulateur :**
1. ✅ Génération PDF + sauvegarde (Filesystem)
2. ✅ Ouverture PDF (FileOpener)
3. ✅ Notifications locales (ajouter traitement)
4. ✅ Auth biométrique (si configuré)
5. ✅ Navigation fluide

### 6.7 : Commit
```bash
git add package.json package-lock.json android/
git commit -m "Update Capacitor 7.4.3 → 7.4.4 + plugins (tested Android)"
git tag step-6-capacitor-updated
```

---

## ✅ Checklist

- [ ] Tag créé
- [ ] Core Capacitor mis à jour (7.4.4)
- [ ] Plugins mis à jour
- [ ] `npx cap sync android` réussit
- [ ] App web démarre
- [ ] Build Android réussit
- [ ] APK installable
- [ ] PDF génère + sauvegarde
- [ ] Notifications fonctionnent
- [ ] Biométrie OK (si applicable)
- [ ] Commit créé
- [ ] **Date :** ___/___/2025
- [ ] **Résultat :** ✅ OK / ❌ KO

---

## ⚠️ Problèmes courants

### Erreur "Gradle build failed"
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Plugins non reconnus
```bash
npx cap sync android --force
```

---

## 🔄 Rollback
```bash
git reset --hard step-5-before-capacitor-update
npm install
npx cap sync android
```

---

## ⏭️ Prochaine étape
→ **[Étape 07 : react-hook-form](../etape-07-react-hook-form/07-mise-a-jour-react-hook-form.md)**
