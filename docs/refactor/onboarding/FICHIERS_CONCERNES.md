# 📂 Fichiers Concernés par la Refonte

> Liste exhaustive des fichiers à modifier pour la refonte du système d'onboarding

---

## 🗂️ Vue d'Ensemble

```
src/
├── hooks/
│   └── useOnboarding.ts          ★★★ Principal
├── components/
│   ├── ProtectedRoute.tsx        ★★★ Principal
│   └── Profile/
│       └── ProfileCompletionBanner.tsx  ★★ Secondaire
├── contexts/
│   └── ProfileCompletionContext.tsx     ★★ Secondaire
├── pages/
│   ├── onboarding/
│   │   └── Onboarding.tsx        ★★★ Principal
│   ├── profile/
│   │   ├── Profile.tsx           ★★ Secondaire
│   │   └── hooks/
│   │       └── useProfileWizard.ts      ★★★ Principal
│   ├── auth/
│   │   └── Auth.tsx              ★ Mineur
│   └── settings/
│       └── Settings.tsx          ★ Mineur (reset onboarding)
└── integrations/
    └── supabase/
        └── types.ts              ★★ (si migration DB)
```

---

## 📋 Détail par Fichier

### 1. `src/hooks/useOnboarding.ts` ⭐⭐⭐

**Rôle** : Hook principal gérant l'état d'onboarding

**État actuel** :
```typescript
// Clés localStorage
const ONBOARDING_KEY_PREFIX = 'hasSeenOnboarding_';
const FIRST_LOGIN_KEY_PREFIX = 'isFirstLogin_';

// Fonctions exposées
- hasSeenOnboarding: boolean
- isFirstLogin: boolean
- isLoading: boolean
- completeOnboarding(): Promise<boolean>
- resetOnboarding(): Promise<boolean>
- markFirstLoginHandled(): Promise<boolean>
```

**Modifications requises** :
| Type | Description |
|------|-------------|
| 🔄 Refactor | Migrer vers Supabase au lieu de localStorage |
| 🗑️ Supprimer | `isFirstLogin` et `markFirstLoginHandled` |
| ➕ Ajouter | Chargement initial depuis la DB |
| ➕ Ajouter | Gestion du cache optimiste |

**Dépendances** :
- `useAuth` (hook)
- `supabase/client` (Supabase)

---

### 2. `src/components/ProtectedRoute.tsx` ⭐⭐⭐

**Rôle** : Gardien des routes protégées, gère les redirections

**État actuel** :
```typescript
// Fonctions utilitaires (lignes 16-29)
- checkOnboardingStatus(userId): boolean
- checkFirstLoginStatus(userId): boolean
- markFirstLoginAsHandled(userId): void

// Logique de redirection (lignes 141-154)
- Redirection vers /onboarding si !hasSeenOnboarding
- Redirection vers /profile si isFirstLogin
```

**Modifications requises** :
| Type | Description |
|------|-------------|
| 🗑️ Supprimer | `checkFirstLoginStatus` et `markFirstLoginAsHandled` |
| 🔄 Refactor | Utiliser le hook `useOnboarding` au lieu de localStorage direct |
| ✂️ Simplifier | Réduire à 2 conditions de redirection |

**Dépendances** :
- `useAuth` (hook)
- `useOnboarding` (hook)
- `react-router-dom` (Navigate, useLocation)

---

### 3. `src/pages/onboarding/Onboarding.tsx` ⭐⭐⭐

**Rôle** : Page du carousel d'onboarding

**État actuel** :
```typescript
// Complétion (lignes 71-80)
const handleComplete = async () => {
  const success = await completeOnboarding();
  if (success) {
    setTimeout(() => navigate("/profile"), 100);
  }
};
```

**Modifications requises** :
| Type | Description |
|------|-------------|
| 🗑️ Supprimer | `setTimeout` workaround |
| 🔄 Refactor | Navigation directe après succès DB |
| ➕ Ajouter | Gestion d'erreur avec toast |

**Dépendances** :
- `useOnboarding` (hook)
- `useNavigate` (react-router-dom)

---

### 4. `src/pages/profile/hooks/useProfileWizard.ts` ⭐⭐⭐

**Rôle** : Gère l'affichage automatique du wizard profil

**État actuel** :
```typescript
// Clés localStorage
const WIZARD_SHOWN_PREFIX = "profileWizardShownOnce_";
const ONBOARDING_KEY_PREFIX = "hasSeenOnboarding_";

// Condition d'affichage (lignes 28-31)
if (hasSeenOnboarding && !hasShownWizard && !isComplete) {
  setTimeout(() => setShowWizard(true), 800);
}
```

**Modifications requises** :
| Type | Description |
|------|-------------|
| 🔄 Refactor | Utiliser `useOnboarding` au lieu de lire localStorage |
| 🔄 Optionnel | Migrer `wizardShown` vers DB |
| 🗑️ Supprimer | Référence à `ONBOARDING_KEY_PREFIX` |

**Dépendances** :
- `useAuth` (hook)
- `useProfileCompletion` (context)
- `useOnboarding` (hook) - à ajouter

---

### 5. `src/components/Profile/ProfileCompletionBanner.tsx` ⭐⭐

**Rôle** : Bannière incitant à compléter le profil

**État actuel** :
```typescript
// Vérification wizard (lignes 29-35)
const wizardShownKey = `${WIZARD_SHOWN_PREFIX}${user.id}`;
const hasShownWizard = localStorage.getItem(wizardShownKey) === 'true';
if (!hasShownWizard) {
  setIsVisible(false);
}
```

**Modifications requises** :
| Type | Description |
|------|-------------|
| 🔄 Optionnel | Utiliser un hook centralisé pour `wizardShown` |
| ✂️ Simplifier | Déléguer la logique au hook |

---

### 6. `src/contexts/ProfileCompletionContext.tsx` ⭐⭐

**Rôle** : Contexte global pour l'état de complétion du profil

**Modifications requises** :
| Type | Description |
|------|-------------|
| ➕ Optionnel | Inclure l'état d'onboarding dans le contexte |
| 🔄 Optionnel | Fusionner avec un nouveau `OnboardingContext` |

---

### 7. `src/pages/auth/Auth.tsx` ⭐

**Rôle** : Page d'authentification

**Modifications requises** :
| Type | Description |
|------|-------------|
| 🔍 Vérifier | Aucune logique onboarding ne devrait être ici |
| ➕ Optionnel | Nettoyer localStorage obsolète au logout |

---

### 8. `src/pages/settings/Settings.tsx` ⭐

**Rôle** : Page des paramètres

**État actuel** :
```typescript
// Bouton "Revoir l'onboarding" utilise resetOnboarding()
```

**Modifications requises** :
| Type | Description |
|------|-------------|
| 🔄 Aucune | Continuera à utiliser `resetOnboarding()` du hook |

---

## 🔗 Graphe des Dépendances

```
                    ┌─────────────────┐
                    │   useAuth       │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────────┐ ┌─────────┐ ┌─────────────────┐
    │ useOnboarding   │ │Supabase │ │useProfileWizard │
    └────────┬────────┘ └────┬────┘ └────────┬────────┘
             │               │               │
             │    ┌──────────┴──────────┐    │
             │    │                     │    │
             ▼    ▼                     ▼    ▼
    ┌─────────────────┐           ┌─────────────────┐
    │ ProtectedRoute  │           │    Profile      │
    └────────┬────────┘           └────────┬────────┘
             │                             │
             ▼                             ▼
    ┌─────────────────┐           ┌─────────────────┐
    │   Onboarding    │           │ ProfileWizard   │
    └─────────────────┘           └─────────────────┘
```

---

## 📝 Ordre de Refactoring Recommandé

### Phase 1 : Préparation DB (si migration choisie)
1. ⬜ Créer la migration SQL (colonnes dans `profiles`)
2. ⬜ Mettre à jour les types Supabase

### Phase 2 : Refactoring Hook Principal
3. ⬜ Refactorer `useOnboarding.ts`
4. ⬜ Ajouter les tests unitaires

### Phase 3 : Mise à Jour des Composants
5. ⬜ Refactorer `ProtectedRoute.tsx`
6. ⬜ Refactorer `Onboarding.tsx`
7. ⬜ Refactorer `useProfileWizard.ts`

### Phase 4 : Nettoyage
8. ⬜ Mettre à jour `ProfileCompletionBanner.tsx`
9. ⬜ Tester tous les scénarios
10. ⬜ Nettoyer les anciennes clés localStorage

---

## ✅ Checklist de Validation

| Test | Scénario | Résultat attendu |
|------|----------|------------------|
| ⬜ | Nouvelle inscription | Carousel → Profile → Wizard |
| ⬜ | Connexion nouvel appareil | Pas de carousel si déjà fait |
| ⬜ | Utilisateur récurrent | Accès direct |
| ⬜ | Reset onboarding | Carousel réapparaît |
| ⬜ | Vidage cache | Pas d'impact (si migration DB) |
| ⬜ | Mode hors-ligne | Comportement dégradé acceptable |
