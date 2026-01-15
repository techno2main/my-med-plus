# Didacticiel Interactif - Spécifications

> Document de référence pour l'implémentation du tutoriel guidé de l'application.

## Décision technique

### Option retenue : Driver.js (Option B)
- **Bibliothèque** : driver.js (~15kb gzipped)
- **Principe** : Tour guidé avec spotlight sur les vrais éléments de l'interface
- **Complexité** : Moyenne
- **Effort estimé** : ~3h30

### Alternatives écartées
| Option | Description | Raison d'exclusion |
|--------|-------------|-------------------|
| Option A - Carousel | Slides explicatifs dans une modale | Pas assez interactif, déconnecté de l'UI réelle |
| Option C - Custom Radix | Solution sur-mesure avec Radix UI | Trop complexe à maintenir, réinvente la roue |

---

## Stratégie pour les listes vides

### Approche retenue : "Guided First Action"
Guider l'utilisateur à créer ses **vraies données** plutôt que des données fictives.

### Pourquoi cette approche ?

| Critère | Données fictives | Guided First Action ✅ |
|---------|-----------------|----------------------|
| Valeur immédiate | ❌ Données à supprimer | ✅ Données utiles |
| Confusion utilisateur | ⚠️ Risque élevé | ✅ Aucune |
| Taux de rétention | ⚠️ Moyen | ✅ Élevé |
| Réutilisation code | ❌ Nouveau système | ✅ EmptyState existants |

### Principe
- Si des données existent → Tour des fonctionnalités avec spotlight
- Si liste vide → Wizard de création guidée étape par étape

---

## Architecture proposée

### Fichiers à créer

```
src/
├── contexts/TutorialContext.tsx      # État global du tutoriel
├── hooks/useTutorial.ts              # Hook d'accès au contexte
├── components/tutorial/
│   ├── TutorialProvider.tsx          # Provider avec Driver.js
│   ├── TutorialButton.tsx            # Bouton flottant "?" d'aide
│   ├── TutorialProgress.tsx          # Barre de progression
│   └── tourSteps/
│       ├── dashboardSteps.ts         # Étapes Dashboard
│       ├── treatmentsSteps.ts        # Étapes Traitements
│       ├── stocksSteps.ts            # Étapes Stocks
│       ├── calendarSteps.ts          # Étapes Calendrier
│       ├── historySteps.ts           # Étapes Historique
│       └── settingsSteps.ts          # Étapes Paramètres
```

### Intégration dans les composants existants

Ajouter des attributs `data-tour` aux éléments clés :

```tsx
// Exemple Dashboard
<ActiveTreatmentsCard data-tour="active-treatments" />
<TodayIntakesCard data-tour="today-intakes" />
<QuickActionsCard data-tour="quick-actions" />

// Exemple Navigation
<BottomNavigation data-tour="navigation" />
```

### État du tutoriel (localStorage)

```typescript
interface TutorialState {
  hasCompletedOnboarding: boolean;
  completedTours: string[];        // ['dashboard', 'treatments', ...]
  currentTourStep: number | null;
  lastVisitedScreen: string | null;
}
```

---

## Comportement par écran

| Écran | Si données présentes | Si liste vide |
|-------|---------------------|---------------|
| **Dashboard** | Tour des widgets (prises du jour, traitements actifs, actions rapides) | Redirection vers création premier traitement |
| **Traitements** | Tour liste + filtres + actions (pause, modifier, archiver) | Wizard "Créer mon premier traitement" |
| **Stocks** | Tour alertes stock bas + ajout manuel | Guide "Ajouter premier stock" |
| **Calendrier** | Tour navigation jour/semaine/mois + interactions | Animation explicative + explication du remplissage auto |
| **Historique** | Tour filtres + export PDF | Explication : "Vos prises apparaîtront ici" |
| **Paramètres** | Tour complet de toutes les sections | Tour complet (toujours du contenu) |

### Détail des étapes par écran

#### Dashboard (5 étapes)
1. Bienvenue + vue d'ensemble
2. Widget "Prises du jour" - validation des médicaments
3. Widget "Traitements actifs" - accès rapide
4. Actions rapides - créer traitement, ajouter pro santé
5. Navigation - accès aux autres écrans

#### Traitements (6 étapes)
1. Liste des traitements actifs
2. Carte traitement - informations affichées
3. Actions : Pause / Reprendre
4. Actions : Modifier / Supprimer
5. Filtres et recherche
6. Bouton création nouveau traitement

#### Stocks (4 étapes)
1. Vue d'ensemble des stocks
2. Alertes stock bas (seuil configurable)
3. Ajout/modification de stock
4. Date d'expiration

#### Calendrier (4 étapes)
1. Navigation entre les vues (jour/semaine/mois)
2. Prises programmées vs prises validées
3. Interaction : valider une prise
4. Historique des jours passés

---

## Principes UX anti-abandon

### 1. Progression visible
```tsx
// Barre de progression en haut
<TutorialProgress current={2} total={5} />
// Affiche : "Étape 2/5 - Prises du jour"
```

### 2. Sortie facile
- Bouton "Passer" toujours visible
- Clic en dehors du spotlight = pause (pas fermeture)
- Possibilité de reprendre plus tard

### 3. Sauvegarde automatique
- Progression sauvée dans localStorage
- Au retour : "Reprendre le tutoriel ?" ou "Recommencer"

### 4. Encouragements contextuels
- Messages positifs à chaque étape complétée
- Ton amical et non condescendant
- Exemples concrets liés à la santé

### 5. Durée estimée
- Affichée au démarrage : "~2 minutes"
- Mise à jour dynamique : "Plus que 3 étapes !"

### 6. Récompense finale
- Message de félicitations
- Récapitulatif des fonctionnalités découvertes
- Call-to-action vers l'action principale

---

## Déclenchement du tutoriel

### Automatique
- Après l'onboarding initial (première connexion)
- Condition : `!hasCompletedOnboarding`

### Manuel
- Bouton "?" flottant (coin inférieur droit, au-dessus de la navigation)
- Menu Paramètres > Aide > "Revoir le tutoriel"

### Contextuel
- Sur chaque `EmptyState`, bouton "Voir comment faire"
- Déclenche le mini-tutoriel spécifique à cet écran

---

## Configuration Driver.js

### Installation
```bash
npm install driver.js
```

### Configuration de base
```typescript
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

const driverObj = driver({
  showProgress: true,
  animate: true,
  smoothScroll: true,
  allowClose: true,
  overlayClickNext: false,
  stagePadding: 10,
  popoverClass: 'tutorial-popover',
  progressText: 'Étape {{current}} sur {{total}}',
  nextBtnText: 'Suivant',
  prevBtnText: 'Précédent',
  doneBtnText: 'Terminer',
});
```

### Personnalisation du style
```css
/* Intégration avec le design system */
.tutorial-popover {
  background: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}

.tutorial-popover .driver-popover-title {
  color: hsl(var(--primary));
  font-weight: 600;
}
```

---

## Exemple d'implémentation

### Définition des étapes (dashboardSteps.ts)
```typescript
import { DriveStep } from 'driver.js';

export const getDashboardSteps = (hasData: boolean): DriveStep[] => {
  if (!hasData) {
    return [
      {
        element: '[data-tour="empty-state"]',
        popover: {
          title: 'Bienvenue ! 👋',
          description: 'Commençons par créer votre premier traitement pour profiter de toutes les fonctionnalités.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="create-treatment-btn"]',
        popover: {
          title: 'Créer un traitement',
          description: 'Cliquez ici pour ajouter votre premier traitement médical.',
          side: 'top',
        },
      },
    ];
  }

  return [
    {
      element: '[data-tour="today-intakes"]',
      popover: {
        title: 'Vos prises du jour',
        description: 'Retrouvez ici tous les médicaments à prendre aujourd\'hui. Cochez-les une fois pris !',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="active-treatments"]',
      popover: {
        title: 'Traitements actifs',
        description: 'Vue d\'ensemble de vos traitements en cours avec leur progression.',
        side: 'bottom',
      },
    },
    // ... autres étapes
  ];
};
```

### Utilisation dans un composant
```tsx
import { useTutorial } from '@/hooks/useTutorial';

export function Dashboard() {
  const { startTour, isActive } = useTutorial();
  const { data: treatments } = useTreatments();

  useEffect(() => {
    // Démarrage automatique si premier accès
    if (shouldShowTutorial('dashboard')) {
      startTour('dashboard', treatments.length > 0);
    }
  }, []);

  return (
    <div>
      <TodayIntakesCard data-tour="today-intakes" />
      <ActiveTreatmentsCard data-tour="active-treatments" />
    </div>
  );
}
```

---

## Prochaines étapes d'implémentation

1. ✅ Créer ce document de spécifications
2. ⬜ Installer driver.js
3. ⬜ Créer TutorialContext et TutorialProvider
4. ⬜ Définir les étapes pour chaque écran
5. ⬜ Ajouter les attributs `data-tour` aux composants
6. ⬜ Intégrer le bouton flottant d'aide
7. ⬜ Personnaliser le style Driver.js
8. ⬜ Tester sur mobile et desktop
9. ⬜ Ajouter les analytics de progression

---

## Notes additionnelles

### Accessibilité
- Driver.js gère le focus automatiquement
- Ajouter `aria-describedby` pour les lecteurs d'écran
- Tester avec navigation clavier

### Performance
- Charger Driver.js en lazy loading
- Ne pas bloquer le rendu initial
- Précharger les étapes du prochain écran

### Analytics (optionnel)
- Tracker le taux de complétion
- Identifier les étapes d'abandon
- Mesurer le temps par étape
