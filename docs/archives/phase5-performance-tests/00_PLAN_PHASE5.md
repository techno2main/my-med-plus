# PHASE 5 : PERFORMANCE & TESTS

## 📋 OBJECTIF

Optimiser les performances de l'application et mettre en place une suite de tests complète pour garantir la fiabilité et la maintenabilité du code.

## 🎯 PÉRIMÈTRE

### 1. Optimisation des performances

- Analyse des performances actuelles
- Optimisation du rendu React
- Optimisation des requêtes Supabase
- Lazy loading et code splitting
- Optimisation des assets

### 2. Tests unitaires

- Tests des hooks personnalisés
- Tests des composants UI
- Tests des utilitaires

### 3. Tests d'intégration

- Tests des flows utilisateur complets
- Tests des interactions avec Supabase
- Tests des notifications

### 4. Tests E2E (optionnel)

- Tests des parcours critiques
- Tests sur devices Android (Capacitor)

## 🚀 PARTIE 1 : PERFORMANCE

### Analyse préliminaire

#### Métriques cibles (Lighthouse)

- **Performance** : > 90
- **Accessibility** : > 95
- **Best Practices** : > 90
- **SEO** : > 90

#### Outils d'analyse

- [ ] React DevTools Profiler
- [ ] Lighthouse (Chrome DevTools)
- [ ] Bundle Analyzer (Vite)
- [ ] Supabase Query Performance

### Optimisations React

#### 1. Mémoïsation

```typescript
// Identifier les composants à mémoïser
- Listes longues (Stock, Pathologies, etc.)
- Composants de cards (rendus multiples)
- Formulaires complexes

// Outils
- React.memo() pour les composants
- useMemo() pour les calculs coûteux
- useCallback() pour les fonctions passées en props
```

**Actions** :

- [ ] Audit des re-renders inutiles avec React DevTools
- [ ] Mémoïser les composants de liste
- [ ] Mémoïser les callbacks dans les hooks
- [ ] Éviter les inline functions dans le JSX

#### 2. Lazy Loading

```typescript
// Pages à lazy loader
- Pages admin (NavigationManager, NotificationDebug)
- Pages peu visitées (About, Referentials, Privacy)
- Composants lourds (Calendar, graphiques si ajoutés)

// Stratégie
const Stock = lazy(() => import('./pages/stock/Stock'));
<Suspense fallback={<LoadingSpinner />}>
  <Stock />
</Suspense>
```

**Actions** :

- [ ] Implémenter React.lazy() pour les pages
- [ ] Code splitting par routes
- [ ] Suspense boundaries appropriés
- [ ] Précharger les routes critiques

#### 3. Virtualisation (si nécessaire)

```typescript
// Pour les longues listes
- Liste des médicaments (si > 100 items)
- Historique des prises (si > 50 items)
- Liste des professionnels de santé

// Outils
- react-window ou react-virtual
```

**Actions** :

- [ ] Mesurer les performances des listes actuelles
- [ ] Implémenter la virtualisation si nécessaire
- [ ] Tester sur devices Android bas de gamme

### Optimisations Supabase

#### 1. Requêtes optimisées

**Actions** :

- [ ] Audit de toutes les requêtes
- [ ] Utiliser `.select()` avec champs spécifiques (éviter `*`)
- [ ] Indexes sur les colonnes fréquemment filtrées
- [ ] Pagination pour les grandes listes
- [ ] Cache côté client (React Query ou SWR)

#### 2. Real-time optimisé

**Actions** :

- [ ] Limiter les subscriptions real-time au strict nécessaire
- [ ] Unsubscribe proper dans les useEffect cleanups
- [ ] Debounce les updates real-time si nécessaire

#### 3. RLS Performance

**Actions** :

- [ ] Vérifier les performances des RLS policies
- [ ] Simplifier les policies complexes si possible
- [ ] Utiliser les indexes appropriés

### Optimisations Assets

**Actions** :

- [ ] Compresser les images (si présentes)
- [ ] Utiliser des formats modernes (WebP, AVIF)
- [ ] Lazy loading des images
- [ ] SVG optimisés pour les icônes
- [ ] Tree-shaking des librairies (Lucide React, etc.)

### Build & Bundle

**Actions** :

- [ ] Analyser le bundle avec `vite-bundle-visualizer`
- [ ] Identifier les dépendances lourdes
- [ ] Code splitting agressif
- [ ] Minification optimale
- [ ] Compression gzip/brotli (production)

## 🧪 PARTIE 2 : TESTS

### Stack de tests proposée

```json
{
  "vitest": "^1.0.0", // Test runner (compatible Vite)
  "@testing-library/react": "*", // Tests de composants
  "@testing-library/jest-dom": "*", // Matchers supplémentaires
  "@testing-library/user-event": "*", // Simulations d'interactions
  "msw": "^2.0.0" // Mock Service Worker (API mocks)
}
```

### Tests unitaires

#### 1. Tests des hooks

**Hooks prioritaires** :

- [ ] `useTakeIntake` (logique critique)
- [ ] `useNotificationSystem` (complexe)
- [ ] `useRattrapageActions` (logique métier)
- [ ] Hooks génériques de Phase 3 (useEntityData, useDialog, etc.)

**Exemple** :

```typescript
// hooks/__tests__/useTakeIntake.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { useTakeIntake } from "../useTakeIntake";

describe("useTakeIntake", () => {
  it("should mark intake as taken and update stock", async () => {
    const { result } = renderHook(() => useTakeIntake());

    await act(async () => {
      await result.current.markAsTaken(intakeId, medicationId);
    });

    expect(result.current.success).toBe(true);
    // Vérifier la mise à jour du stock
  });
});
```

#### 2. Tests des composants

**Composants prioritaires** :

- [ ] Composants atomiques (Phase 4)
- [ ] Composants de formulaires
- [ ] Composants avec logique conditionnelle
- [ ] EmptyState, LoadingSpinner, etc.

**Exemple** :

```typescript
// components/__tests__/StockCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { StockCard } from '../StockCard';

describe('StockCard', () => {
  it('should display medication name and stock level', () => {
    render(<StockCard medication={mockMedication} />);

    expect(screen.getByText('Doliprane')).toBeInTheDocument();
    expect(screen.getByText('15 comprimés')).toBeInTheDocument();
  });

  it('should show low stock alert when stock < 10', () => {
    render(<StockCard medication={{ ...mockMedication, stock: 5 }} />);

    expect(screen.getByText(/stock faible/i)).toBeInTheDocument();
  });
});
```

#### 3. Tests des utilitaires

**Utilitaires prioritaires** :

- [ ] `dateUtils.ts` (convertFrenchToUTC, formatToFrenchTime)
- [ ] `medicationUtils.ts`
- [ ] Fonctions de validation
- [ ] Formatters

**Exemple** :

```typescript
// lib/__tests__/dateUtils.test.ts
import { convertFrenchToUTC, formatToFrenchTime } from "../dateUtils";

describe("dateUtils", () => {
  it("should convert French time to UTC correctly", () => {
    const french = new Date("2025-10-27T14:30:00"); // 14h30 Paris
    const utc = convertFrenchToUTC(french);

    expect(utc.getUTCHours()).toBe(12); // UTC-2 en été
  });
});
```

### Tests d'intégration

#### 1. Flows utilisateur complets

**Scénarios prioritaires** :

- [ ] Ajout d'un médicament au stock
- [ ] Prise d'un médicament (intake)
- [ ] Rattrapage d'une prise manquée
- [ ] Modification des paramètres de notification
- [ ] Connexion/Déconnexion

**Exemple** :

```typescript
// __tests__/integration/medication-intake.test.tsx
describe('Medication Intake Flow', () => {
  it('should allow user to take medication and update stock', async () => {
    // Setup MSW pour mocker Supabase
    server.use(
      rest.post('/supabase/medication_intakes', (req, res, ctx) => {
        return res(ctx.json({ data: mockIntake }));
      })
    );

    render(<App />);

    // Navigation vers Index
    fireEvent.click(screen.getByText(/aujourd'hui/i));

    // Marquer comme pris
    fireEvent.click(screen.getByText(/marquer comme pris/i));

    // Vérifications
    await waitFor(() => {
      expect(screen.getByText(/prise enregistrée/i)).toBeInTheDocument();
    });
  });
});
```

#### 2. Mocking Supabase

**Stratégie** :

- [ ] Utiliser MSW (Mock Service Worker) pour les API calls
- [ ] Créer des fixtures de données (mock data)
- [ ] Simuler les erreurs réseau
- [ ] Tester les états de chargement

### Tests E2E (optionnel avec Playwright)

**Scénarios critiques** :

- [ ] Parcours complet : Login → Ajout médicament → Prise → Logout
- [ ] Test sur Android Emulator
- [ ] Test des notifications push
- [ ] Test offline (PWA)

## 📊 MÉTRIQUES & MONITORING

### Performance monitoring

- [ ] Lighthouse CI dans le pipeline
- [ ] Web Vitals (LCP, FID, CLS)
- [ ] Bundle size tracking
- [ ] Supabase query performance

### Test coverage

- [ ] Cible : > 70% de couverture globale
- [ ] Cible : > 90% pour les hooks critiques
- [ ] Cible : > 80% pour les composants UI
- [ ] Rapport de coverage dans CI/CD

## 🔧 PLAN D'EXÉCUTION

### Étape 1 : Setup tests (2 jours)

- [ ] Installer Vitest + Testing Library
- [ ] Configurer MSW pour mocking Supabase
- [ ] Créer les fixtures de données
- [ ] Setup CI/CD pour les tests

### Étape 2 : Tests critiques (3 jours)

- [ ] Tests des hooks métier critiques
- [ ] Tests des utilitaires (dateUtils, etc.)
- [ ] Tests des composants de formulaire
- [ ] Atteindre 50% de couverture

### Étape 3 : Performance audit (2 jours)

- [ ] Lighthouse audit complet
- [ ] React Profiler sur toutes les pages
- [ ] Bundle analysis
- [ ] Identifier les bottlenecks

### Étape 4 : Optimisations (3 jours)

- [ ] Implémenter lazy loading
- [ ] Mémoïsation des composants critiques
- [ ] Optimiser les requêtes Supabase
- [ ] Code splitting

### Étape 5 : Tests complets (3 jours)

- [ ] Tests d'intégration des flows principaux
- [ ] Augmenter la couverture à 70%+
- [ ] Tests des composants atomiques (Phase 4)
- [ ] Documentation des tests

### Étape 6 : Monitoring & CI/CD (2 jours)

- [ ] Lighthouse CI
- [ ] Test automation dans GitHub Actions
- [ ] Performance budgets
- [ ] Alertes sur régression

## 🚀 LIVRABLES

1. **Suite de tests complète**
   - Tests unitaires des hooks
   - Tests des composants UI
   - Tests d'intégration
   - > 70% de couverture

2. **Application optimisée**
   - Score Lighthouse > 90
   - Lazy loading implémenté
   - Bundle optimisé
   - Requêtes Supabase optimisées

3. **Documentation**
   - Guide d'écriture des tests
   - Performance best practices
   - Rapport d'optimisation

4. **CI/CD**
   - Tests automatisés
   - Lighthouse CI
   - Coverage reports

## ⚠️ POINTS D'ATTENTION

- **Ne pas sur-optimiser** : Optimiser uniquement ce qui est mesuré comme lent
- **Tests pragmatiques** : Tester les comportements, pas l'implémentation
- **Mobile-first** : Tester sur devices Android bas de gamme
- **Régression** : Ne pas casser les fonctionnalités existantes
- **Coverage vs Qualité** : Privilégier des tests utiles vs 100% de coverage

## 🔗 DÉPENDANCES

- Phase 1 ✅ Complétée
- Phase 2 ✅ Complétée
- Phase 3 ⏳ À compléter
- Phase 4 ⏳ À compléter
- Phase 5 📋 **FINALE**

---

**Status** : 📋 Planifié
**Branche** : `phase5/performance-tests` (à créer)
**Estimation** : 10-15 jours de travail
**Priorité** : Haute (qualité & fiabilité)
