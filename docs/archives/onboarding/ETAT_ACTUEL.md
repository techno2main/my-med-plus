# 📊 État Actuel du Système d'Onboarding

> Analyse détaillée des différents scénarios utilisateur

---

## 🎭 Scénarios Utilisateur

### Scénario 1 : Nouvelle Inscription + Première Connexion

**Contexte** : Un utilisateur qui n'a jamais eu de compte MyHealth+

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARCOURS NOUVEL UTILISATEUR                   │
└─────────────────────────────────────────────────────────────────┘

1. Utilisateur arrive sur /auth
   └─▶ Remplit le formulaire d'inscription (email/password ou Google)
   
2. Supabase crée l'utilisateur
   └─▶ Trigger DB crée automatiquement un profil vide dans `profiles`
   
3. Redirection automatique vers ProtectedRoute
   └─▶ Vérifie : localStorage.getItem('hasSeenOnboarding_[userId]')
   └─▶ Résultat : null (jamais vu)
   
4. Redirection vers /onboarding
   └─▶ Affiche le carousel 5 écrans
   └─▶ Bouton "Passer" ou "Commencer"
   
5. Complétion de l'onboarding
   └─▶ useOnboarding.completeOnboarding()
   └─▶ localStorage.setItem('hasSeenOnboarding_[userId]', 'true')
   └─▶ localStorage.setItem('isFirstLogin_[userId]', 'true')
   └─▶ setTimeout 100ms → navigate('/profile')
   
6. Arrivée sur /profile
   └─▶ useProfileWizard vérifie :
       • hasSeenOnboarding = true ✅
       • profileWizardShownOnce = false ✅
       • isComplete = false ✅
   └─▶ Affiche ProfileWizardDialog après 800ms
   
7. Complétion du wizard profil
   └─▶ localStorage.setItem('profileWizardShownOnce_[userId]', 'true')
   └─▶ Données sauvegardées en DB
   └─▶ Accès normal à l'application
```

**État localStorage après ce scénario** :
```javascript
{
  "hasSeenOnboarding_abc123": "true",
  "isFirstLogin_abc123": "true",
  "profileWizardShownOnce_abc123": "true"
}
```

---

### Scénario 2 : Utilisateur Inscrit mais Jamais Connecté (Nouvel Appareil)

**Contexte** : Un utilisateur existant qui se connecte depuis un nouvel appareil/navigateur

```
┌─────────────────────────────────────────────────────────────────┐
│              PARCOURS UTILISATEUR EXISTANT - NOUVEL APPAREIL     │
└─────────────────────────────────────────────────────────────────┘

1. Utilisateur arrive sur /auth
   └─▶ Se connecte avec ses identifiants existants
   
2. Supabase authentifie l'utilisateur
   └─▶ Profil existe déjà en DB (peut être complet ou non)
   
3. Redirection automatique vers ProtectedRoute
   └─▶ Vérifie : localStorage.getItem('hasSeenOnboarding_[userId]')
   └─▶ Résultat : null (localStorage vide sur ce navigateur)
   
4. ⚠️ PROBLÈME : Redirection vers /onboarding
   └─▶ L'utilisateur DOIT revoir le carousel même s'il l'a déjà vu
   └─▶ Pas de moyen de savoir qu'il est un utilisateur existant
   
5. Après l'onboarding
   └─▶ Redirection vers /profile
   └─▶ Si profil déjà complet → wizard ne s'affiche pas
   └─▶ Si profil incomplet → wizard s'affiche à nouveau
```

**Problèmes identifiés** :
- ❌ L'utilisateur revoit l'onboarding à chaque nouvel appareil
- ❌ Impossible de distinguer "vrai" nouvel utilisateur vs utilisateur existant
- ❌ Expérience utilisateur dégradée

---

### Scénario 3 : Utilisateur Inscrit et Déjà Connecté

**Contexte** : Un utilisateur récurrent sur le même appareil

```
┌─────────────────────────────────────────────────────────────────┐
│                    PARCOURS UTILISATEUR RÉCURRENT                │
└─────────────────────────────────────────────────────────────────┘

1. Utilisateur arrive sur /auth ou directement sur une page protégée
   └─▶ Session Supabase valide détectée
   
2. ProtectedRoute vérifie
   └─▶ hasSeenOnboarding_[userId] = 'true' ✅
   └─▶ isFirstLogin_[userId] = 'true' ✅
   
3. Accès direct à la page demandée
   └─▶ Pas de redirection vers /onboarding
   └─▶ Pas de redirection vers /profile (sauf si isFirstLogin)
   
4. Affichage normal de l'application
   └─▶ ProfileCompletionBanner si profil < 100%
   └─▶ Badge sur avatar si champs manquants
```

**Comportement attendu** : ✅ Fonctionne correctement

---

## 🔍 Analyse du Code Actuel

### Hook `useOnboarding.ts`

```typescript
// Clés localStorage par utilisateur
const ONBOARDING_KEY_PREFIX = 'hasSeenOnboarding_';
const FIRST_LOGIN_KEY_PREFIX = 'isFirstLogin_';

// ⚠️ PROBLÈME : isFirstLogin calculé incorrectement
const firstLoginHandled = localStorage.getItem(firstLoginKey) === 'true';
setIsFirstLogin(!seen && !firstLoginHandled);
// Si seen=false ET firstLoginHandled=false → isFirstLogin=true
// Mais cela ne distingue pas nouvel utilisateur vs utilisateur existant

// ⚠️ PROBLÈME : completeOnboarding met AUSSI isFirstLogin à true
localStorage.setItem(firstLoginKey, 'true');
// Cela rend la logique confuse
```

### Composant `ProtectedRoute.tsx`

```typescript
// Fonctions utilitaires (bonnes pratiques)
const checkOnboardingStatus = (userId: string): boolean => {
  return localStorage.getItem(`hasSeenOnboarding_${userId}`) === 'true';
};

const checkFirstLoginStatus = (userId: string): boolean => {
  const hasSeenOnboarding = localStorage.getItem(`hasSeenOnboarding_${userId}`) === 'true';
  const firstLoginHandled = localStorage.getItem(`isFirstLogin_${userId}`) === 'true';
  return !hasSeenOnboarding && !firstLoginHandled;
};

// Logique de redirection
if (!hasSeenOnboarding && location.pathname !== '/onboarding') {
  return <Navigate to="/onboarding" replace />;
}

if (isFirstLogin && location.pathname !== '/profile' && location.pathname !== '/onboarding') {
  markFirstLoginAsHandled(user.id);
  return <Navigate to="/profile" replace />;
}
```

### Page `Onboarding.tsx`

```typescript
const handleComplete = async () => {
  setIsCompleting(true);
  const success = await completeOnboarding();
  
  if (success) {
    // ⚠️ Délai workaround pour synchronisation localStorage
    setTimeout(() => {
      navigate("/profile", { replace: true });
    }, 100);
  }
};
```

---

## 📋 Tableau Récapitulatif des États

| Scénario | hasSeenOnboarding | isFirstLogin | wizardShown | Comportement |
|----------|-------------------|--------------|-------------|--------------|
| Nouvelle inscription | `null` → `true` | `null` → `true` | `null` → `true` | Carousel → Profile → Wizard |
| Nouvel appareil | `null` → `true` | `null` → `true` | `null` → ? | ⚠️ Carousel à nouveau |
| Utilisateur récurrent | `true` | `true` | `true` | Accès direct |
| Après reset onboarding | `null` | `null` | `true` | Carousel → Profile (pas wizard) |

---

## ⚠️ Problèmes Détaillés

### 1. Dépendance au localStorage

**Gravité** : 🔴 Critique

```
Problème : L'état d'onboarding est stocké UNIQUEMENT dans localStorage
Impact : 
  - Changement de navigateur → onboarding recommence
  - Vidage du cache → onboarding recommence  
  - Mode privé → onboarding à chaque session
  - Multi-appareils → onboarding sur chaque appareil
```

### 2. Logique `isFirstLogin` incohérente

**Gravité** : 🟠 Élevé

```
Problème : isFirstLogin est calculé comme !hasSeenOnboarding && !firstLoginHandled
Impact :
  - Ne distingue pas inscription vs connexion existante
  - completeOnboarding() met firstLoginHandled=true (confusion)
  - La vraie "première connexion" n'est pas trackée
```

### 3. Pas de synchronisation avec la DB

**Gravité** : 🟠 Élevé

```
Problème : Aucune donnée d'onboarding en Supabase
Impact :
  - Impossible de savoir côté serveur si l'utilisateur a fait l'onboarding
  - Analytics impossibles sur le parcours d'onboarding
  - Pas de cohérence multi-plateforme
```

### 4. Délais de synchronisation

**Gravité** : 🟢 Faible

```
Problème : setTimeout(100ms) après completeOnboarding()
Impact :
  - Workaround fragile
  - Peut échouer sur connexions lentes
  - Code plus difficile à maintenir
```

---

## 📈 Métriques Actuelles

| Métrique | Valeur | Idéal |
|----------|--------|-------|
| Clés localStorage utilisées | 3 par utilisateur | 0-1 (persisté en DB) |
| Fichiers impliqués | 8+ | Centralisé |
| Conditions de redirection | 4+ | 2-3 max |
| Tests automatisés | 0 | Couverture complète |
