# 🎯 Plan de Refonte Onboarding - Version Finale

> **Auteur** : Analyse GitHub Copilot  
> **Date** : 14 janvier 2026  
> **Statut** : Plan d'action détaillé prêt à implémenter  
> **Basé sur** : Analyse Lovable + Expertise technique approfondie

---

## 📋 Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Analyse comparative Lovable vs Plan Final](#analyse-comparative)
3. [Architecture proposée](#architecture-proposée)
4. [Phases d'implémentation](#phases-dimplémentation)
5. [Guide d'implémentation détaillé](#guide-dimplémentation)
6. [Tests et validation](#tests-et-validation)

---

## 🎯 Vue d'ensemble

### Objectifs

✅ **Résoudre** les problèmes de synchronisation multi-appareils  
✅ **Améliorer** la distinction inscription vs connexion existante  
✅ **Optimiser** les performances avec caching intelligent  
✅ **Garantir** le support offline avec fallback localStorage  
✅ **Tracer** le parcours utilisateur pour analytics  

### Principe directeur

> "Un système d'onboarding robuste doit fonctionner partout (multi-device), tout le temps (offline), et nous informer (analytics)."

---

## 📊 Analyse Comparative

### Ce que Lovable a bien identifié ✅

| Point | Évaluation |
|-------|------------|
| Diagnostic des problèmes | ⭐⭐⭐⭐⭐ Excellent |
| Documentation des flux | ⭐⭐⭐⭐⭐ Très claire |
| Identification des fichiers | ⭐⭐⭐⭐⭐ Exhaustive |
| Ordre de refactoring | ⭐⭐⭐⭐ Bien pensé |

### Où Lovable est incomplet ⚠️

| Aspect | Problème | Solution proposée |
|--------|----------|-------------------|
| **Schéma DB** | Trop simple, manque versioning, tracking, analytics | Table `onboarding_history` avec événements |
| **isFirstLogin** | Veut le supprimer complètement | Le garder avec calcul intelligent |
| **Gestion erreurs** | Basique (if error return false) | Fallback localStorage + sync queue |
| **Performance** | Pas de cache, requête à chaque render | React Query avec staleTime 5min |
| **Offline** | Non géré | localStorage fallback + sync automatique |
| **Analytics** | Non prévu | Tracking complet du funnel |

---

## 🏗️ Architecture Proposée

### Schéma Base de Données

```sql
-- ==========================================
-- TABLE PRINCIPALE : HISTORIQUE D'ONBOARDING
-- ==========================================

CREATE TABLE public.onboarding_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type d'événement (enum strict)
  event_type TEXT NOT NULL CHECK (event_type IN (
    'signup',              -- Première inscription
    'first_login',         -- Première connexion (après signup)
    'carousel_started',    -- Début du carousel
    'carousel_completed',  -- Fin du carousel
    'wizard_started',      -- Début du wizard profil
    'wizard_completed',    -- Fin du wizard profil
    'wizard_skipped'       -- Wizard sauté volontairement
  )),
  
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Versioning de l'onboarding (pour futures maj de contenu)
  onboarding_version INTEGER NOT NULL DEFAULT 1,
  
  -- Informations du device (pour multi-device tracking)
  device_info JSONB DEFAULT jsonb_build_object(
    'platform', 'unknown',
    'user_agent', '',
    'is_mobile', false
  ),
  
  -- Métadonnées spécifiques par type d'événement
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Exemples de metadata selon event_type :
  -- carousel_completed: { "screens_viewed": [1,2,3,4,5], "time_spent_seconds": 45, "skipped_screens": [] }
  -- wizard_completed: { "fields_filled": ["first_name", "last_name", "birth_date"], "completion_rate": 0.8 }
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances optimales
CREATE INDEX idx_onboarding_user_events ON onboarding_history(user_id, event_type, event_timestamp DESC);
CREATE INDEX idx_onboarding_signup ON onboarding_history(user_id, event_type) WHERE event_type = 'signup';
CREATE INDEX idx_onboarding_carousel ON onboarding_history(user_id, event_type) WHERE event_type = 'carousel_completed';
CREATE INDEX idx_onboarding_wizard ON onboarding_history(user_id, event_type) WHERE event_type IN ('wizard_completed', 'wizard_skipped');

-- ==========================================
-- TABLE VERSIONING (pour maj futures)
-- ==========================================

CREATE TABLE public.onboarding_versions (
  version INTEGER PRIMARY KEY,
  description TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  screens_count INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Version initiale
INSERT INTO onboarding_versions (version, description, is_active, screens_count)
VALUES (1, 'Version initiale - 5 écrans carousel', TRUE, 5);

-- ==========================================
-- FONCTIONS UTILITAIRES
-- ==========================================

-- Vérifier si un utilisateur a complété la version actuelle de l'onboarding
CREATE OR REPLACE FUNCTION has_completed_current_onboarding(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM onboarding_history oh
    INNER JOIN onboarding_versions ov ON oh.onboarding_version = ov.version
    WHERE oh.user_id = p_user_id
      AND oh.event_type = 'carousel_completed'
      AND ov.is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Vérifier si un utilisateur a complété ou sauté le wizard
CREATE OR REPLACE FUNCTION has_handled_profile_wizard(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM onboarding_history
    WHERE user_id = p_user_id
      AND event_type IN ('wizard_completed', 'wizard_skipped')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Obtenir le dernier événement d'onboarding
CREATE OR REPLACE FUNCTION get_onboarding_status(p_user_id UUID)
RETURNS TABLE (
  has_completed_carousel BOOLEAN,
  has_completed_wizard BOOLEAN,
  is_new_user BOOLEAN,
  last_event_type TEXT,
  last_event_timestamp TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    has_completed_current_onboarding(p_user_id),
    has_handled_profile_wizard(p_user_id),
    EXISTS (
      SELECT 1 FROM onboarding_history 
      WHERE user_id = p_user_id AND event_type = 'signup'
    ),
    (SELECT event_type FROM onboarding_history WHERE user_id = p_user_id ORDER BY event_timestamp DESC LIMIT 1),
    (SELECT event_timestamp FROM onboarding_history WHERE user_id = p_user_id ORDER BY event_timestamp DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- RLS (ROW LEVEL SECURITY)
-- ==========================================

ALTER TABLE onboarding_history ENABLE ROW LEVEL SECURITY;

-- Policy : Utilisateur peut voir son propre historique
CREATE POLICY "Users can view own onboarding history"
  ON onboarding_history FOR SELECT
  USING (auth.uid() = user_id);

-- Policy : Utilisateur peut insérer dans son propre historique
CREATE POLICY "Users can insert own onboarding events"
  ON onboarding_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- MIGRATION DES DONNÉES EXISTANTES
-- ==========================================

-- Marquer tous les utilisateurs existants comme ayant complété l'onboarding
-- (car ils utilisent déjà l'app)
INSERT INTO onboarding_history (user_id, event_type, onboarding_version, event_timestamp)
SELECT 
  id,
  'carousel_completed',
  1,
  created_at
FROM profiles
WHERE created_at < NOW() - INTERVAL '1 day'
ON CONFLICT DO NOTHING;

-- Marquer les profils complets comme ayant fait le wizard
INSERT INTO onboarding_history (user_id, event_type, onboarding_version, event_timestamp)
SELECT 
  p.id,
  'wizard_completed',
  1,
  p.updated_at
FROM profiles p
WHERE p.first_name IS NOT NULL 
  AND p.last_name IS NOT NULL
  AND created_at < NOW() - INTERVAL '1 day'
ON CONFLICT DO NOTHING;
```

### Architecture React

```
┌─────────────────────────────────────────────────────────────────┐
│                    NOUVELLE ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Couche API (React Query)                                       │
│  └─▶ useOnboardingStatus() - Cache 5min, fallback localStorage │
│                                                                 │
│  Couche Logique Métier                                          │
│  ├─▶ useOnboarding() - Lecture + Actions                       │
│  ├─▶ useOnboardingTracker() - Tracking événements              │
│  └─▶ useOnboardingSync() - Sync offline → online               │
│                                                                 │
│  Couche UI                                                      │
│  ├─▶ ProtectedRoute - Garde simplifié                          │
│  ├─▶ Onboarding - Carousel + tracking                          │
│  └─▶ ProfileWizard - Wizard + tracking                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📅 Phases d'Implémentation

### PHASE 1 : Quick Wins (1-2 jours) 🟢

**Objectif** : Améliorer l'existant sans migration DB

#### 1.1 Fusionner les clés localStorage

**Avant** :
```typescript
localStorage.setItem('hasSeenOnboarding_abc123', 'true');
localStorage.setItem('isFirstLogin_abc123', 'true');
localStorage.setItem('profileWizardShownOnce_abc123', 'true');
```

**Après** :
```typescript
localStorage.setItem('onboarding_abc123', JSON.stringify({
  version: 1,
  carouselCompletedAt: '2026-01-14T10:00:00Z',
  wizardHandledAt: '2026-01-14T10:05:00Z',
  lastDevice: 'web',
  needsSync: false // Flag pour sync DB ultérieur
}));
```

**Fichiers à modifier** :
- `src/hooks/useOnboarding.ts`
- `src/components/ProtectedRoute.tsx`
- `src/pages/profile/hooks/useProfileWizard.ts`

#### 1.2 Améliorer la gestion d'erreur

```typescript
// Ajouter dans useOnboarding.ts
const completeOnboarding = useCallback(async (): Promise<boolean> => {
  try {
    const userId = user?.id || session?.user?.id;
    if (!userId) {
      toast.error('Impossible de sauvegarder', {
        description: 'Session utilisateur non trouvée'
      });
      return false;
    }

    // Sauvegarder en localStorage d'abord (optimistic)
    const onboardingData = {
      version: 1,
      carouselCompletedAt: new Date().toISOString(),
      lastDevice: 'web',
      needsSync: false
    };
    
    localStorage.setItem(`onboarding_${userId}`, JSON.stringify(onboardingData));
    setHasSeenOnboarding(true);
    
    return true;
  } catch (error) {
    console.error('Erreur completeOnboarding:', error);
    toast.error('Erreur de sauvegarde', {
      description: 'Vos données sont sauvegardées localement'
    });
    return false;
  }
}, [user, session]);
```

#### 1.3 Corriger la logique isFirstLogin

```typescript
// Nouveau calcul intelligent
const calculateIsFirstSession = useCallback(() => {
  if (!user) return false;
  
  const onboardingKey = `onboarding_${user.id}`;
  const stored = localStorage.getItem(onboardingKey);
  
  if (!stored) return false; // Pas encore fait l'onboarding
  
  try {
    const data = JSON.parse(stored);
    
    // C'est une première session si :
    // 1. Carousel complété
    // 2. Wizard PAS encore géré
    // 3. ET profil pas encore complété (vérification en DB)
    return !!(
      data.carouselCompletedAt && 
      !data.wizardHandledAt
    );
  } catch {
    return false;
  }
}, [user]);
```

**Estimation** : 1-2 jours  
**Risque** : Faible  
**Impact** : Moyen (UX améliorée, moins de bugs)

---

### PHASE 2 : Migration DB (3-5 jours) 🟡

**Objectif** : Persister l'onboarding en base de données

#### 2.1 Créer la migration Supabase

**Fichier** : `supabase/migrations/YYYYMMDDHHMMSS_create_onboarding_system.sql`

Contenu : Le schéma SQL complet fourni plus haut.

#### 2.2 Mettre à jour les types TypeScript

```typescript
// src/integrations/supabase/types.ts
export interface OnboardingEvent {
  id: string;
  user_id: string;
  event_type: 'signup' | 'first_login' | 'carousel_started' | 'carousel_completed' | 'wizard_started' | 'wizard_completed' | 'wizard_skipped';
  event_timestamp: string;
  onboarding_version: number;
  device_info: {
    platform: string;
    user_agent: string;
    is_mobile: boolean;
  };
  metadata: Record<string, any>;
  created_at: string;
}

export interface OnboardingStatus {
  has_completed_carousel: boolean;
  has_completed_wizard: boolean;
  is_new_user: boolean;
  last_event_type: string | null;
  last_event_timestamp: string | null;
}
```

#### 2.3 Créer le hook React Query

**Fichier** : `src/hooks/useOnboardingStatus.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { OnboardingEvent, OnboardingStatus } from '@/integrations/supabase/types';

// Hook pour récupérer le statut (avec cache)
export const useOnboardingStatus = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['onboarding', 'status', user?.id],
    queryFn: async (): Promise<OnboardingStatus> => {
      if (!user) throw new Error('No user');
      
      const { data, error } = await supabase
        .rpc('get_onboarding_status', { p_user_id: user.id });
      
      if (error) throw error;
      
      return data[0];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
    gcTime: 30 * 60 * 1000, // Garde en mémoire 30 minutes
  });
};

// Hook pour tracker un événement
export const useTrackOnboardingEvent = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      eventType,
      metadata = {}
    }: {
      eventType: OnboardingEvent['event_type'];
      metadata?: Record<string, any>;
    }) => {
      if (!user) throw new Error('No user');
      
      // Device info
      const deviceInfo = {
        platform: navigator.platform,
        user_agent: navigator.userAgent,
        is_mobile: /Mobile|Android|iPhone/i.test(navigator.userAgent)
      };
      
      const { data, error } = await supabase
        .from('onboarding_history')
        .insert({
          user_id: user.id,
          event_type: eventType,
          onboarding_version: 1,
          device_info: deviceInfo,
          metadata
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalider le cache pour recharger le statut
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'status', user?.id] });
    }
  });
};
```

#### 2.4 Refactorer useOnboarding avec fallback

**Fichier** : `src/hooks/useOnboarding.ts` (nouvelle version)

```typescript
import { useCallback } from 'react';
import { useOnboardingStatus, useTrackOnboardingEvent } from './useOnboardingStatus';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export const useOnboarding = () => {
  const { user } = useAuth();
  const { data: status, isLoading } = useOnboardingStatus();
  const trackEvent = useTrackOnboardingEvent();
  
  // Fallback localStorage pour support offline
  const fallbackToLocalStorage = useCallback((eventType: string) => {
    if (!user) return;
    
    const key = `onboarding_${user.id}`;
    const stored = localStorage.getItem(key);
    const data = stored ? JSON.parse(stored) : {};
    
    const updates: Record<string, any> = { ...data, needsSync: true };
    
    if (eventType === 'carousel_completed') {
      updates.carouselCompletedAt = new Date().toISOString();
    } else if (eventType.includes('wizard')) {
      updates.wizardHandledAt = new Date().toISOString();
    }
    
    localStorage.setItem(key, JSON.stringify(updates));
    
    // Ajouter à la queue de sync
    addToSyncQueue(user.id, eventType);
  }, [user]);
  
  const completeOnboarding = useCallback(async (metadata?: Record<string, any>): Promise<boolean> => {
    try {
      await trackEvent.mutateAsync({
        eventType: 'carousel_completed',
        metadata: metadata || {}
      });
      
      toast.success('Onboarding complété !');
      return true;
    } catch (error) {
      console.error('Erreur DB, fallback localStorage:', error);
      fallbackToLocalStorage('carousel_completed');
      toast.success('Onboarding complété (sauvegarde locale)');
      return true;
    }
  }, [trackEvent, fallbackToLocalStorage]);
  
  const completeWizard = useCallback(async (): Promise<boolean> => {
    try {
      await trackEvent.mutateAsync({ eventType: 'wizard_completed' });
      return true;
    } catch (error) {
      fallbackToLocalStorage('wizard_completed');
      return true;
    }
  }, [trackEvent, fallbackToLocalStorage]);
  
  const skipWizard = useCallback(async (): Promise<boolean> => {
    try {
      await trackEvent.mutateAsync({ eventType: 'wizard_skipped' });
      return true;
    } catch (error) {
      fallbackToLocalStorage('wizard_skipped');
      return true;
    }
  }, [trackEvent, fallbackToLocalStorage]);
  
  return {
    hasCompletedOnboarding: status?.has_completed_carousel ?? false,
    hasCompletedWizard: status?.has_completed_wizard ?? false,
    isNewUser: status?.is_new_user ?? false,
    isLoading,
    completeOnboarding,
    completeWizard,
    skipWizard,
  };
};

// Fonction pour ajouter à la queue de synchronisation
const addToSyncQueue = (userId: string, eventType: string) => {
  const queueKey = 'onboarding_sync_queue';
  const queue = JSON.parse(localStorage.getItem(queueKey) || '[]');
  
  queue.push({
    userId,
    eventType,
    timestamp: Date.now()
  });
  
  localStorage.setItem(queueKey, JSON.stringify(queue));
};
```

#### 2.5 Implémenter le service de synchronisation

**Fichier** : `src/services/onboardingSyncService.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';

interface SyncQueueItem {
  userId: string;
  eventType: string;
  timestamp: number;
}

export class OnboardingSyncService {
  private static QUEUE_KEY = 'onboarding_sync_queue';
  private static syncInProgress = false;
  
  // Démarrer la synchronisation périodique
  static startPeriodicSync() {
    // Sync immédiatement
    this.syncQueue();
    
    // Puis toutes les 5 minutes
    setInterval(() => {
      this.syncQueue();
    }, 5 * 60 * 1000);
    
    // Sync quand on revient online
    window.addEventListener('online', () => {
      console.log('📡 Connection rétablie, sync onboarding...');
      this.syncQueue();
    });
  }
  
  // Synchroniser la queue
  static async syncQueue() {
    if (this.syncInProgress) return;
    if (!navigator.onLine) return;
    
    this.syncInProgress = true;
    
    try {
      const queue = this.getQueue();
      if (queue.length === 0) return;
      
      console.log(`🔄 Synchronisation de ${queue.length} événements onboarding...`);
      
      for (const item of queue) {
        try {
          await this.syncItem(item);
          this.removeFromQueue(item);
        } catch (error) {
          console.error('Erreur sync item:', error);
          // Continue avec les autres items
        }
      }
      
      console.log('✅ Sync onboarding terminée');
    } finally {
      this.syncInProgress = false;
    }
  }
  
  private static async syncItem(item: SyncQueueItem) {
    const deviceInfo = {
      platform: navigator.platform,
      user_agent: navigator.userAgent,
      is_mobile: /Mobile|Android|iPhone/i.test(navigator.userAgent)
    };
    
    const { error } = await supabase
      .from('onboarding_history')
      .insert({
        user_id: item.userId,
        event_type: item.eventType,
        event_timestamp: new Date(item.timestamp).toISOString(),
        onboarding_version: 1,
        device_info: deviceInfo
      });
    
    if (error) throw error;
  }
  
  private static getQueue(): SyncQueueItem[] {
    const stored = localStorage.getItem(this.QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  }
  
  private static removeFromQueue(item: SyncQueueItem) {
    const queue = this.getQueue();
    const filtered = queue.filter(q => 
      q.userId !== item.userId || 
      q.eventType !== item.eventType || 
      q.timestamp !== item.timestamp
    );
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(filtered));
  }
}
```

#### 2.6 Simplifier ProtectedRoute

**Fichier** : `src/components/ProtectedRoute.tsx`

```typescript
// Remplacer la logique localStorage par le hook
const { hasCompletedOnboarding, isNewUser, isLoading: onboardingLoading } = useOnboarding();

// Redirection simplifiée
if (!onboardingLoading && !hasCompletedOnboarding && location.pathname !== '/onboarding') {
  return <Navigate to="/onboarding" replace />;
}

// Calculer isFirstSession de manière intelligente
const isFirstSession = hasCompletedOnboarding && !hasCompletedWizard && isNewUser;

if (isFirstSession && location.pathname !== '/profile' && location.pathname !== '/onboarding') {
  return <Navigate to="/profile" replace />;
}
```

#### 2.7 Initialiser le sync au démarrage

**Fichier** : `src/main.tsx`

```typescript
import { OnboardingSyncService } from '@/services/onboardingSyncService';

// Après le render
OnboardingSyncService.startPeriodicSync();
```

**Estimation** : 3-5 jours  
**Risque** : Moyen  
**Impact** : Élevé (Multi-device, analytics, robustesse)

---

### PHASE 3 : Améliorations UX (Optionnel) 🔵

#### 3.1 Intégrer Driver.js (tutoriel interactif)

Voir le fichier existant : `docs/DIDACTICIEL_INTERACTIF.md` pour les specs complètes.

#### 3.2 Analytics Dashboard

**Fichier** : `src/pages/admin/OnboardingAnalytics.tsx` (nouveau)

```typescript
// Dashboard admin pour voir les stats d'onboarding
const OnboardingAnalytics = () => {
  const { data } = useQuery({
    queryKey: ['onboarding', 'analytics'],
    queryFn: async () => {
      const { data } = await supabase
        .from('onboarding_history')
        .select('event_type, event_timestamp, metadata')
        .order('event_timestamp', { ascending: false })
        .limit(1000);
      
      return analyzeOnboardingData(data);
    }
  });
  
  return (
    <div>
      <h1>Analytics Onboarding</h1>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>Taux de complétion</CardHeader>
          <CardContent>{data?.completionRate}%</CardContent>
        </Card>
        <Card>
          <CardHeader>Temps moyen</CardHeader>
          <CardContent>{data?.avgTime}s</CardContent>
        </Card>
        <Card>
          <CardHeader>Abandons</CardHeader>
          <CardContent>{data?.dropoffRate}%</CardContent>
        </Card>
      </div>
      {/* Graphiques avec recharts */}
    </div>
  );
};
```

#### 3.3 A/B Testing du contenu

```typescript
// Versioning automatique du carousel
const ONBOARDING_VARIANTS = {
  v1: { screens: 5, style: 'classic' },
  v2: { screens: 3, style: 'minimal' }, // Test avec moins d'écrans
  v3: { screens: 5, style: 'interactive' } // Avec animations
};

// Dans Onboarding.tsx
const variant = getABTestVariant(user.id); // Hash-based assignment
```

**Estimation** : 3-5 jours  
**Risque** : Faible  
**Impact** : Moyen (UX optimisée, insights)

---

## 🛠️ Guide d'Implémentation Détaillé

### Étape par étape - PHASE 1

#### Jour 1 Matin : Fusionner localStorage

1. **Créer un nouveau type**
   ```typescript
   // src/types/onboarding.ts
   export interface OnboardingLocalData {
     version: number;
     carouselCompletedAt: string | null;
     wizardHandledAt: string | null;
     lastDevice: 'web' | 'mobile';
     needsSync: boolean;
   }
   ```

2. **Créer des helpers**
   ```typescript
   // src/utils/onboardingStorage.ts
   export const getOnboardingData = (userId: string): OnboardingLocalData | null => {
     const key = `onboarding_${userId}`;
     const stored = localStorage.getItem(key);
     if (!stored) return null;
     
     try {
       return JSON.parse(stored);
     } catch {
       return null;
     }
   };
   
   export const setOnboardingData = (userId: string, data: Partial<OnboardingLocalData>) => {
     const key = `onboarding_${userId}`;
     const existing = getOnboardingData(userId) || {
       version: 1,
       carouselCompletedAt: null,
       wizardHandledAt: null,
       lastDevice: 'web',
       needsSync: false
     };
     
     const updated = { ...existing, ...data };
     localStorage.setItem(key, JSON.stringify(updated));
   };
   
   // Migration depuis ancien format
   export const migrateOldFormat = (userId: string) => {
     const oldKeys = [
       `hasSeenOnboarding_${userId}`,
       `isFirstLogin_${userId}`,
       `profileWizardShownOnce_${userId}`
     ];
     
     const hasOldOnboarding = localStorage.getItem(oldKeys[0]) === 'true';
     const hasOldWizard = localStorage.getItem(oldKeys[2]) === 'true';
     
     if (hasOldOnboarding) {
       setOnboardingData(userId, {
         carouselCompletedAt: new Date().toISOString(),
         wizardHandledAt: hasOldWizard ? new Date().toISOString() : null
       });
       
       // Nettoyer anciennes clés
       oldKeys.forEach(k => localStorage.removeItem(k));
     }
   };
   ```

3. **Mettre à jour useOnboarding.ts**
   ```typescript
   import { getOnboardingData, setOnboardingData, migrateOldFormat } from '@/utils/onboardingStorage';
   
   useEffect(() => {
     if (user) {
       // Migration automatique
       migrateOldFormat(user.id);
       
       const data = getOnboardingData(user.id);
       setHasSeenOnboarding(!!data?.carouselCompletedAt);
       setIsLoading(false);
     }
   }, [user]);
   ```

4. **Tester la migration**
   - Créer un utilisateur test avec ancien format
   - Vérifier la migration automatique
   - Confirmer que les anciennes clés sont supprimées

#### Jour 1 Après-midi : Améliorer gestion d'erreur

1. **Ajouter toast notifications**
2. **Implémenter try/catch robustes**
3. **Tester scénarios d'erreur** (offline, timeout, etc.)

#### Jour 2 : Corriger isFirstLogin

1. **Implémenter nouveau calcul**
2. **Tester tous les scénarios** :
   - Nouvelle inscription complète
   - Utilisateur revient sans finir le wizard
   - Utilisateur avec profil déjà complet
3. **Valider les redirections**

---

### Checklist de validation - PHASE 1

- [ ] Migration localStorage fonctionne
- [ ] Anciennes clés sont nettoyées
- [ ] Erreurs gérées avec toasts
- [ ] isFirstLogin calculé correctement
- [ ] Scénario 1 : Nouvelle inscription → OK
- [ ] Scénario 2 : Nouvel appareil → OK (amélioration limitée sans DB)
- [ ] Scénario 3 : Utilisateur récurrent → OK

---

### Checklist de validation - PHASE 2

- [ ] Migration SQL exécutée sans erreur
- [ ] Types TypeScript à jour
- [ ] React Query configuré
- [ ] Hook useOnboardingStatus fonctionne
- [ ] Tracking événements fonctionne
- [ ] Fallback localStorage fonctionne offline
- [ ] Sync automatique fonctionne au retour online
- [ ] ProtectedRoute simplifié et fonctionnel
- [ ] Multi-device : appareil 1 → appareil 2 → pas de re-onboarding
- [ ] Offline → Online : events synchronisés
- [ ] Performance : pas de lag au chargement

---

## 📊 Tests et Validation

### Tests Unitaires

```typescript
// src/hooks/__tests__/useOnboarding.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useOnboarding } from '../useOnboarding';

describe('useOnboarding', () => {
  it('should load onboarding status from DB', async () => {
    const { result } = renderHook(() => useOnboarding());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.hasCompletedOnboarding).toBeDefined();
  });
  
  it('should fallback to localStorage when offline', async () => {
    // Mock offline
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    
    const { result } = renderHook(() => useOnboarding());
    
    await result.current.completeOnboarding();
    
    // Vérifier localStorage
    const stored = localStorage.getItem(`onboarding_${mockUserId}`);
    expect(JSON.parse(stored)).toHaveProperty('needsSync', true);
  });
});
```

### Tests E2E (Playwright)

```typescript
// e2e/onboarding.spec.ts
test('complete onboarding flow for new user', async ({ page }) => {
  // 1. Inscription
  await page.goto('/auth');
  await page.fill('[name="email"]', 'newuser@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // 2. Doit être redirigé vers /onboarding
  await page.waitForURL('/onboarding');
  
  // 3. Compléter le carousel
  for (let i = 0; i < 5; i++) {
    await page.click('button:has-text("Suivant")');
  }
  await page.click('button:has-text("Commencer")');
  
  // 4. Doit être redirigé vers /profile
  await page.waitForURL('/profile');
  
  // 5. Le wizard doit apparaître
  await page.waitForSelector('[data-testid="profile-wizard"]');
  
  // 6. Compléter le wizard
  await page.fill('[name="firstName"]', 'John');
  await page.fill('[name="lastName"]', 'Doe');
  await page.click('button:has-text("Enregistrer")');
  
  // 7. Vérifier que l'événement est en DB
  const events = await getOnboardingEventsForUser('newuser@test.com');
  expect(events).toContainEqual(
    expect.objectContaining({ event_type: 'carousel_completed' })
  );
  expect(events).toContainEqual(
    expect.objectContaining({ event_type: 'wizard_completed' })
  );
});
```

---

## 📈 Métriques de Succès

| Métrique | Avant | Après (Cible) |
|----------|-------|---------------|
| **Taux de complétion onboarding** | ? | > 85% |
| **Temps moyen carousel** | ? | < 60s |
| **Taux d'abandon** | ? | < 15% |
| **Re-onboarding sur nouvel appareil** | 100% | 0% |
| **Erreurs localStorage** | Fréquent | < 1% |
| **Performance (temps de chargement)** | ? | < 200ms (avec cache) |

---

## 🎯 Recommandation Finale

### Priorisation

1. **FAIRE IMMÉDIATEMENT** (Phase 1)
   - Fusionner localStorage (impact rapide, risque faible)
   - Améliorer gestion d'erreur (stabilité)

2. **PLANIFIER SOUS 2 SEMAINES** (Phase 2)
   - Migration DB (solution pérenne)
   - Sync service (robustesse offline)

3. **ROADMAP 1-2 MOIS** (Phase 3)
   - Driver.js (UX++)
   - Analytics dashboard (insights)

### Points de vigilance

⚠️ **Tester la migration localStorage** sur des vrais comptes avant déploiement  
⚠️ **Backup de la DB** avant la migration SQL  
⚠️ **Monitoring Sentry** pour tracker les erreurs post-déploiement  
⚠️ **Feature flag** pour rollback rapide si problème  

---

## 📚 Ressources

- [Documentation Lovable](./README.md)
- [État actuel](./ETAT_ACTUEL.md)
- [Axes amélioration Lovable](./AXES_AMELIORATION.md)
- [Fichiers concernés](./FICHIERS_CONCERNES.md)
- [Driver.js Tutorial](../DIDACTICIEL_INTERACTIF.md)

---

**Ce plan est prêt à être mis en œuvre. Bonne chance ! 🚀**
