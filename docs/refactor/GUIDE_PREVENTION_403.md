# Guide : Prévention des Erreurs 403 d'Authentification

**Date**: 3 novembre 2025  
**Priorité**: 🔴 CRITIQUE  
**Objectif**: Établir des bonnes pratiques pour éviter les erreurs 403 récurrentes

---

## 🚨 Problème Récurrent

### Symptôme
Erreur 403 dans la console au chargement de l'application, avant même que l'utilisateur ne se connecte :
```
Failed to load resource: the server responded with a status of 403
```

### Cause Racine
Des hooks ou composants React appellent l'API Supabase (notamment `supabase.auth.getUser()` ou `supabase.from()`) **avant** de vérifier si l'utilisateur est authentifié.

### Occurrences Identifiées
1. **useAuth.tsx** (corrigé le 03/11/2025)
2. **useAutoRegenerateIntakes.tsx** (corrigé le 03/11/2025)
3. **53 autres appels potentiellement non protégés** identifiés dans le code

---

## ✅ Solution : Utilitaire AuthGuard

### Outil Créé
**Fichier**: `src/lib/auth-guard.ts`

Fournit des fonctions helper pour sécuriser tous les appels API :

```typescript
import { getAuthenticatedUser, withAuth, isAuthenticated } from '@/lib/auth-guard';

// ❌ AVANT (non sécurisé)
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  // faire quelque chose
}

// ✅ APRÈS (sécurisé)
const { data: user, error } = await getAuthenticatedUser();
if (error || !user) return;
// faire quelque chose
```

### Fonctions Disponibles

#### 1. `isAuthenticated()`
Vérifie rapidement si une session existe.
```typescript
const isAuth = await isAuthenticated();
if (!isAuth) {
  console.log('Utilisateur non connecté');
  return;
}
```

#### 2. `getAuthenticatedUser()`
Récupère l'utilisateur de manière sécurisée.
```typescript
const { data: user, error } = await getAuthenticatedUser();

if (error) {
  console.warn('Pas d\'utilisateur:', error.message);
  return;
}

// Utiliser user en toute sécurité
console.log(user.id);
```

#### 3. `withAuth(callback)`
Exécute une fonction uniquement si authentifié.
```typescript
const result = await withAuth(async (user) => {
  // Cette fonction ne s'exécute QUE si user est authentifié
  return await doSomethingWithUser(user);
});

if (!result) {
  console.log('Action bloquée : utilisateur non authentifié');
}
```

#### 4. `checkAuthStatus()`
Pour une vérification synchrone dans un useEffect.
```typescript
const [isAuth, setIsAuth] = useState(false);

useEffect(() => {
  checkAuthStatus().then(setIsAuth);
}, []);

if (!isAuth) return null;
```

---

## 📋 Checklist de Migration

### Hooks à Auditer en Priorité

- [ ] `src/pages/profile-export/hooks/useExportConfig.ts` (2 appels)
- [ ] `src/pages/profile-export/hooks/useExportData.ts` (1 appel)
- [ ] `src/pages/prescriptions/hooks/usePrescriptions.ts` (1 appel)
- [ ] `src/pages/privacy/hooks/usePrivacySettings.ts` (1 appel)
- [ ] `src/pages/privacy/hooks/usePasswordManagement.ts` (4 appels)
- [ ] `src/pages/privacy/hooks/useBiometricSettings.ts` (2 appels)
- [ ] `src/pages/privacy/hooks/useAccountActions.ts` (4 appels)
- [ ] `src/pages/pathologies/hooks/usePathologies.ts` (1 appel)
- [ ] `src/pages/medication-catalog/hooks/useMedicationCatalog.ts` (2 appels)
- [ ] `src/pages/health-professionals/hooks/useHealthProfessionals.ts` (1 appel)
- [ ] `src/pages/allergies/hooks/useAllergies.ts` (1 appel)
- [ ] `src/components/TreatmentWizard/TreatmentWizard.tsx` (1 appel)
- [ ] `src/hooks/useSettingsSectionOrder.tsx` (2 appels)
- [ ] `src/hooks/useMedicationNotificationScheduler.tsx` (1 appel)
- [ ] `src/hooks/generic/useEntityCrud.ts` (1 appel)
- [ ] `src/components/Layout/AppHeader.tsx` (1 appel)

**Total**: 25+ fichiers nécessitant une révision

---

## 🎯 Pattern à Appliquer

### Pour les Hooks qui Lisent des Données

```typescript
import { getAuthenticatedUser } from '@/lib/auth-guard';

export function useMyData() {
  const fetchData = async () => {
    // 1. Vérifier l'authentification D'ABORD
    const { data: user, error } = await getAuthenticatedUser();
    
    if (error || !user) {
      console.warn('[useMyData] Pas d\'utilisateur authentifié');
      return;
    }

    // 2. ENSUITE faire l'appel API
    const { data, error: dataError } = await supabase
      .from('ma_table')
      .select('*')
      .eq('user_id', user.id);

    // ... traiter les données
  };

  return { fetchData };
}
```

### Pour les Hooks Globaux (Démarrage App)

```typescript
import { checkAuthStatus } from '@/lib/auth-guard';

export function useGlobalHook() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Vérifier l'auth au montage
  useEffect(() => {
    checkAuthStatus().then(setIsAuthenticated);

    // Écouter les changements
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Ne rien faire si pas authentifié
  useEffect(() => {
    if (!isAuthenticated) return;

    // Faire les actions qui nécessitent l'authentification
    doSomething();
  }, [isAuthenticated]);
}
```

---

## ⚠️ Pièges à Éviter

### 1. Appels Directs dans le Corps du Composant
```typescript
// ❌ MAUVAIS : S'exécute à chaque render
const { data: { user } } = await supabase.auth.getUser();

// ✅ BON : Dans un useEffect ou fonction
useEffect(() => {
  const fetchUser = async () => {
    const { data: user } = await getAuthenticatedUser();
  };
  fetchUser();
}, []);
```

### 2. Appels au Niveau Top du Module
```typescript
// ❌ MAUVAIS : S'exécute à l'import du fichier
const { data: { user } } = await supabase.auth.getUser();

export function MyComponent() { ... }
```

### 3. Hooks Sans Protection
```typescript
// ❌ MAUVAIS
export function useMyHook() {
  useEffect(() => {
    // S'exécute même si pas authentifié
    supabase.from('table').select();
  }, []);
}

// ✅ BON
export function useMyHook() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    checkAuthStatus().then(setIsAuth);
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    supabase.from('table').select();
  }, [isAuth]);
}
```

---

## 🔍 Testing Checklist

Après chaque modification, vérifier :

1. ✅ Aucune erreur 403 dans la console au chargement de `/auth`
2. ✅ Connexion fonctionne normalement
3. ✅ Déconnexion ne génère pas d'erreur
4. ✅ Refresh de la page ne génère pas d'erreur
5. ✅ Les fonctionnalités authentifiées fonctionnent après connexion

---

## 📚 Ressources

- **Fichier AuthGuard**: `src/lib/auth-guard.ts`
- **Exemple corrigé**: `src/hooks/useAutoRegenerateIntakes.tsx`
- **Documentation Supabase**: https://supabase.com/docs/guides/auth

---

## 🚀 Prochaines Étapes

1. **Phase 1** : Migrer les 5 hooks prioritaires (useExportConfig, useExportData, etc.)
2. **Phase 2** : Auditer tous les `supabase.auth.getUser()` restants
3. **Phase 3** : Créer des tests automatisés pour détecter les appels non protégés
4. **Phase 4** : Ajouter une règle ESLint custom pour forcer l'utilisation d'AuthGuard

---

**Responsable**: À définir  
**Deadline**: Phase 1 avant mise en production  
**Statut**: 🟡 En cours (2/27 fichiers corrigés)
