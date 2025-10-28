# SPEC 04 : Restructuration Admin.tsx et Espace Admin

## 📊 État Actuel

**Fichier** : `src/pages/Admin.tsx`
**Taille** : ~115 lignes
**Complexité** : Faible (dashboard simple)

### Responsabilités actuelles
1. Affichage dashboard admin (cards d'accès rapide)
2. Vérification rôle admin (useUserRole)
3. Navigation vers sections admin
4. Protection de l'accès (redirection si non-admin)

### Interface actuelle
```typescript
// Pas d'interface spécifique, juste des cards de navigation
// Liens vers : Navigation Manager, Referentials, NotificationDebug
```

## 🎯 Structure Cible : Espace Admin Dédié

### Principe
L'espace admin sera un **sous-dossier complet** `src/pages/admin/` avec sa propre architecture modulaire. Le fichier `Admin.tsx` actuel devient `AdminDashboard.tsx` dans `admin/dashboard/`.

```
src/pages/
  ├── admin/                      # Espace admin dédié 🔐
  │   ├── dashboard/              # Point d'entrée admin (ex: Admin.tsx)
  │   │   ├── AdminDashboard.tsx  # Orchestrateur (~80 lignes)
  │   │   ├── components/
  │   │   │   ├── AdminHeader.tsx       # Header avec titre + rôle
  │   │   │   ├── QuickAccessCard.tsx   # Card navigation
  │   │   │   └── AdminStats.tsx        # Stats globales (future)
  │   │   ├── hooks/
  │   │   │   └── useAdminAccess.ts     # Vérification rôle + redirection
  │   │   └── types.ts            # AdminRoute, AdminSection
  │   │
  │   ├── users/                  # Gestion utilisateurs (FUTURE)
  │   │   ├── AdminUsers.tsx
  │   │   ├── components/
  │   │   │   ├── UserList.tsx
  │   │   │   ├── UserCard.tsx
  │   │   │   └── UserFilters.tsx
  │   │   ├── hooks/
  │   │   │   ├── useUsersList.ts
  │   │   │   └── useUserActions.ts
  │   │   └── types.ts
  │   │
  │   ├── settings/               # Settings admin (FUTURE)
  │   │   ├── AdminSettings.tsx
  │   │   ├── components/
  │   │   │   ├── SettingsSection.tsx
  │   │   │   └── SettingToggle.tsx
  │   │   ├── hooks/
  │   │   │   └── useAdminSettings.ts
  │   │   └── types.ts
  │   │
  │   ├── logs/                   # Logs système (FUTURE)
  │   │   ├── AdminLogs.tsx
  │   │   ├── components/
  │   │   │   ├── LogsTable.tsx
  │   │   │   └── LogFilters.tsx
  │   │   ├── hooks/
  │   │   │   └── useSystemLogs.ts
  │   │   └── types.ts
  │   │
  │   └── shared/                 # Composants partagés admin
  │       ├── AdminLayout.tsx     # Layout spécifique admin
  │       └── AdminBreadcrumb.tsx # Breadcrumb navigation admin
```

## 📝 Décomposition Détaillée : admin/dashboard/

### 1. types.ts

```typescript
export interface AdminRoute {
  title: string
  description: string
  icon: React.ComponentType
  path: string
  badge?: string
  disabled?: boolean
}

export interface AdminSection {
  name: string
  routes: AdminRoute[]
}
```

### 2. hooks/useAdminAccess.ts

**Responsabilité** : Vérifier rôle admin + redirection
**Returns** :
```typescript
{
  isAdmin: boolean
  role: string | null
  loading: boolean
}
```

**Logique extraite** :
- Lignes 10-30 actuelles (useUserRole + vérification)
- Redirection si non-admin

### 3. components/AdminHeader.tsx

**Props** :
```typescript
interface AdminHeaderProps {
  role: string | null
}
```

**Contenu** :
- Titre "Administration"
- Badge rôle utilisateur
- Info "Accès réservé"

**Lignes extraites** : 35-45 actuelles

### 4. components/QuickAccessCard.tsx

**Props** :
```typescript
interface QuickAccessCardProps {
  route: AdminRoute
  onClick: () => void
}
```

**Contenu** :
- Card cliquable avec icon
- Titre + description
- Badge (si présent)
- Disabled state
- ChevronRight icon

**Lignes extraites** : Pattern répété dans render actuel

### 5. components/AdminStats.tsx (FUTURE)

**Props** :
```typescript
interface AdminStatsProps {
  userCount: number
  activeUsers: number
  totalIntakes: number
}
```

**Contenu** :
- Cards de statistiques globales
- Graphiques légers
- Métriques système

**Note** : Non présent actuellement, prévu pour évolution

### 6. AdminDashboard.tsx (Orchestrateur)

**Taille cible** : ~80 lignes

**Contenu** :
```typescript
import { useNavigate } from "react-router-dom"
import { AppLayout } from "@/components/Layout/AppLayout"
import { PageHeader } from "@/components/Layout/PageHeader"
import { Navigation, Database, Bug } from "lucide-react"
import { useAdminAccess } from "./hooks/useAdminAccess"
import { AdminHeader } from "./components/AdminHeader"
import { QuickAccessCard } from "./components/QuickAccessCard"
import { adminRoutes } from "./constants"

const AdminDashboard = () => {
  const navigate = useNavigate()
  const { isAdmin, role, loading } = useAdminAccess()
  
  if (loading) return <AppLayout><Loader2 /></AppLayout>
  if (!isAdmin) return null // Redirection handled in hook
  
  return (
    <AppLayout>
      <PageHeader 
        title="Administration" 
        onBack={() => navigate("/")}
      />
      
      <AdminHeader role={role} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminRoutes.map((route) => (
          <QuickAccessCard
            key={route.path}
            route={route}
            onClick={() => navigate(route.path)}
          />
        ))}
      </div>
    </AppLayout>
  )
}

export default AdminDashboard
```

### 7. constants.ts

```typescript
import { Navigation, Database, Bug, Users, Settings, FileText } from "lucide-react"
import { AdminRoute, AdminSection } from "./types"

export const adminRoutes: AdminRoute[] = [
  {
    title: "Gestionnaire de Navigation",
    description: "Gérer les éléments de navigation de l'application",
    icon: Navigation,
    path: "/settings/navigation",
  },
  {
    title: "Référentiels",
    description: "Gérer les référentiels de l'application",
    icon: Database,
    path: "/referentials",
  },
  {
    title: "Debug Notifications",
    description: "Outils de débogage pour les notifications",
    icon: Bug,
    path: "/notifications/debug",
  },
  // FUTURE:
  // {
  //   title: "Gestion Utilisateurs",
  //   description: "Administrer les comptes utilisateurs",
  //   icon: Users,
  //   path: "/admin/users",
  //   disabled: true,
  // },
  // {
  //   title: "Paramètres Système",
  //   description: "Configuration avancée de l'application",
  //   icon: Settings,
  //   path: "/admin/settings",
  //   disabled: true,
  // },
]
```

## 🔄 Plan d'Exécution

### Phase 1 : Restructuration Admin.tsx actuel

1. ✅ Créer `src/pages/admin/dashboard/` directory
2. ✅ Créer `types.ts`
3. ✅ Créer `constants.ts` (routes)
4. ✅ Créer `hooks/useAdminAccess.ts`
5. ✅ Créer `components/AdminHeader.tsx`
6. ✅ Créer `components/QuickAccessCard.tsx`
7. ✅ Créer `AdminDashboard.tsx` (orchestrateur)
8. ✅ Supprimer ancien `src/pages/Admin.tsx`
9. ✅ Mettre à jour `src/App.tsx` : `import Admin from "./pages/admin/dashboard/AdminDashboard"`
10. ✅ Vérifier avec `get_errors`
11. ✅ Tester accès admin + redirections

### Phase 2 : Extensions futures (HORS SCOPE Phase 2)

Ces pages seront créées ultérieurement (Phase 3+ ou selon besoins) :
- `admin/users/` : Gestion utilisateurs
- `admin/settings/` : Paramètres système
- `admin/logs/` : Logs et monitoring
- `admin/shared/` : Composants partagés admin

## ⚠️ Points d'Attention

- **useUserRole** : Hook partagé existant (`@/hooks/useUserRole`)
- **Protection accès** : useAdminAccess doit rediriger si non-admin
- **Routes actuelles** : Les routes existantes (/settings/navigation, /referentials, /notifications/debug) restent inchangées pour l'instant
- **Layout** : Utilise AppLayout standard pour l'instant, AdminLayout sera créé si besoin
- **Extensions futures** : Structure prête pour ajouter users/, settings/, logs/ facilement

## ✅ Critères de Validation

- [ ] AdminDashboard.tsx < 100 lignes
- [ ] Tous les composants < 80 lignes
- [ ] Hook useAdminAccess bien testé
- [ ] 0 erreur TypeScript
- [ ] Redirection si non-admin fonctionne
- [ ] Navigation vers routes existantes OK
- [ ] Badge rôle affiché correctement
- [ ] Structure admin/ prête pour extensions futures

## 🚀 Évolution Future

Lorsque les pages admin supplémentaires seront nécessaires :

1. **admin/users/** : CRUD utilisateurs, gestion rôles
2. **admin/settings/** : Configuration app (paramètres globaux, feature flags)
3. **admin/logs/** : Logs système, audit trail, monitoring
4. **admin/shared/** : AdminLayout, AdminBreadcrumb, AdminSidebar

Chaque nouvelle page suivra la même structure :
- `[PageName].tsx` : Orchestrateur
- `components/` : Composants UI
- `hooks/` : Hooks métier
- `types.ts` : Interfaces

**Route pattern** : `/admin/[section]` (ex: `/admin/users`, `/admin/settings`)
