# Audit Application MyHealth+ - 03/01/2026

## 1. Résumé des erreurs détectées

| Fichier | Erreur | Cause | Action |
|---------|--------|-------|--------|
| `calendar.tsx:45-46` | `IconLeft`/`IconRight` n'existent pas | react-day-picker v9 breaking change | Remplacer par `Chevron` |
| `advanced-calendar.tsx:17` | `selected` n'existe pas sur le type | Props union non gérée correctement | Extraire selected avec vérification de type |
| `chart.tsx:106,111` | `payload`/`label` n'existent pas | recharts v3 types plus stricts | Ajouter types explicites |
| `chart.tsx:233` | `Pick<LegendProps, ...>` invalide | recharts v3 breaking change | Interface personnalisée |
| `chart.tsx:240,249` | `length`/`map` sur `unknown` | payload typé comme unknown | Assertion de type |
| `CalendarView.tsx:268` | `DayContent` n'existe pas | react-day-picker v9 breaking change | Remplacer par formatters ou custom render |

---

## 2. Analyse détaillée

### 2.1 react-day-picker v9 - Breaking Changes

**Composants supprimés :**
- `IconLeft` → Remplacé par `Chevron` avec prop `orientation`
- `IconRight` → Remplacé par `Chevron` avec prop `orientation`
- `DayContent` → Supprimé, utiliser `formatters.formatDay` ou custom `DayButton`

**classNames renommés :**
| v8 | v9 |
|----|-----|
| `caption` | `month_caption` |
| `caption_label` | `caption_label` (inchangé) |
| `nav_button` | `button_previous` / `button_next` |
| `table` | `month_grid` |
| `head_row` | `weekdays` |
| `head_cell` | `weekday` |
| `row` | `week` |
| `cell` | `day` |
| `day` | `day_button` |
| `day_selected` | `selected` |
| `day_today` | `today` |
| `day_outside` | `outside` |
| `day_disabled` | `disabled` |
| `day_range_middle` | `range_middle` |
| `day_hidden` | `hidden` |

### 2.2 recharts v3 - Breaking Changes

**Types plus stricts :**
- `TooltipProps` ne contient plus directement `payload` et `label`
- `LegendProps.payload` est typé comme `unknown`
- Nécessite des interfaces locales pour le typage

---

## 3. Corrections appliquées

### 3.1 `src/components/ui/calendar.tsx`

**Avant :**
```tsx
components={{
  IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
  IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
}}
```

**Après :**
```tsx
components={{
  Chevron: ({ orientation }) => 
    orientation === "left" 
      ? <ChevronLeft className="h-4 w-4" />
      : <ChevronRight className="h-4 w-4" />,
}}
```

**+ Mise à jour de tous les classNames vers API v9**

### 3.2 `src/components/ui/advanced-calendar.tsx`

**Avant (ligne 17) :**
```tsx
const [month, setMonth] = React.useState<Date>(props.selected as Date || new Date())
```

**Après :**
```tsx
const getInitialMonth = (): Date => {
  if ('selected' in props && props.selected instanceof Date) {
    return props.selected;
  }
  return new Date();
};
const [month, setMonth] = React.useState<Date>(getInitialMonth())
```

**+ Mise à jour classNames v9**

### 3.3 `src/components/ui/chart.tsx`

**Ajout interfaces locales :**
```tsx
interface ChartTooltipPayloadItem {
  dataKey?: string;
  name?: string;
  value?: number | string;
  color?: string;
  fill?: string;
  payload?: Record<string, unknown>;
}

interface ChartLegendPayloadItem {
  value?: string;
  dataKey?: string;
  color?: string;
}
```

**Correction ChartTooltipContent :**
- Extraction explicite de `payload` et `label` depuis les props
- Typage avec `ChartTooltipPayloadItem[]`

**Correction ChartLegendContent :**
- Remplacement de `Pick<LegendProps, ...>` par interface custom
- Typage explicite de `payload` avec `ChartLegendPayloadItem[]`

### 3.4 `src/pages/calendar/components/CalendarView.tsx`

**Avant :**
```tsx
components={{
  DayContent: ({ date }) => (...)
}}
```

**Après :**
- Utilisation de `formatters.formatDay` pour afficher le numéro du jour
- Passage du contenu personnalisé via les modifiers et styles
- Approche alternative : rendu conditionnel basé sur les modifiers existants

---

## 4. Validation post-correction

- [ ] Build TypeScript sans erreurs
- [ ] Calendrier principal fonctionnel
- [ ] Sélection de dates opérationnelle
- [ ] Navigation mois/année fonctionnelle
- [ ] Graphiques affichés correctement
- [ ] Tooltips des graphiques fonctionnels
- [ ] Légende des graphiques fonctionnelle

---

## 5. Notes techniques

1. **react-day-picker v9** a introduit une refonte complète de l'API
   - Plus de séparation entre "cell" et "day"
   - Composants de navigation unifiés

2. **recharts v3** renforce le typage TypeScript
   - `unknown` au lieu de `any` pour les payloads
   - Assertions explicites nécessaires

3. Ces corrections maintiennent la compatibilité visuelle existante

---

*Audit réalisé le 03/01/2026*
