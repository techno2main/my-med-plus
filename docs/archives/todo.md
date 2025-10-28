# TODO - Gestion des mises à jour et du cache

**Date**: 20 octobre 2025  
**Branche**: `fix/pwa-cache-refresh`  
**Statut**: En pause - À reprendre

---

## 🎯 Objectif

Garantir que les mises à jour (textes, styles, code) apparaissent **automatiquement** sur tous les supports après déploiement sur Hostinger.

**Supports**: PWA (navigateur + installée), App Android native

---

## ✅ Solution simple en 3 étapes

### ÉTAPE 1 : Améliorer la config PWA (5 min)

**Modification dans `vite.config.ts`** :

```typescript
VitePWA({
  registerType: 'autoUpdate',  // ← Changement ici (au lieu de 'prompt')
  workbox: {
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,  // ← Ajouter cette ligne
    // ... reste identique
  }
})
```

**Effet** : L'app se met à jour automatiquement dès qu'une nouvelle version est détectée, sans demander à l'utilisateur.

---

### ÉTAPE 2 : Ajouter un indicateur visuel simple

**Créer un composant `UpdateNotification.tsx`** qui :
- Vérifie `version.json` toutes les 5 minutes
- Affiche un **petit badge discret** en bas à droite si nouvelle version
- Au clic : recharge l'app
- **Pas de console.log**, juste un badge visuel !

**Code minimal** (≈ 30 lignes) :
```typescript
// Badge visible uniquement si mise à jour disponible
// Style : petit rond vert avec icône refresh
// Clic → window.location.reload()
```

---

### ÉTAPE 3 : Test ultra-simple

1. **Modifier un texte** (ex: "Tout voir" → "Historique")
2. **Build** : `npm run build`
3. **Upload** sur Hostinger
4. **Ouvrir l'app sur mobile** (PWA ou Android)
5. **Attendre 10 secondes max** → badge apparaît
6. **Cliquer sur le badge** → texte mis à jour ✅

**Pas besoin de console, pas de DevTools, juste un test visuel !**

---

## 🚫 Ce qu'on NE fait PAS

- ❌ Pas de modification des headers HTTP (risqué sur Hostinger)
- ❌ Pas de tests complexes multi-navigateurs
- ❌ Pas de logs console à analyser
- ❌ Pas de stratégies de cache avancées
- ❌ Pas de LiveUpdates Capacitor (payant et complexe)

---

## 📱 Pour l'app Android native

**C'est automatique !** Capacitor sync intègre le nouveau build → l'app Android aura la même mise à jour automatique que la PWA.

**Procédure** :
1. `npm run build`
2. `npx cap sync android`
3. Rebuild dans Android Studio
4. → Même comportement que la PWA

---

## ✅ Checklist finale

- [ ] Modifier `vite.config.ts` (registerType: 'autoUpdate' + cleanupOutdatedCaches)
- [ ] Créer composant `UpdateNotification.tsx` (badge discret)
- [ ] Tester avec une modif de texte simple
- [ ] Vérifier sur mobile PWA → badge apparaît + clic = mise à jour
- [ ] Vérifier sur app Android → même comportement

**Temps estimé** : 30 minutes max  
**Risque** : Très faible (juste un changement de mode PWA)

---

**Status**: 🟡 En pause

**À la reprise** : Commencer par l'étape 1 (modifier vite.config.ts)
