import { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { AppLockScreen } from './AppLockScreen';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { useOnboarding } from '@/hooks/useOnboarding';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { hasSeenOnboarding } = useOnboarding();
  const [isLocked, setIsLocked] = useState(false);
  const [lockLoading, setLockLoading] = useState(true);
  const [requireAuthOnOpen, setRequireAuthOnOpen] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [inactivityTimeoutMinutes, setInactivityTimeoutMinutes] = useState(5);
  
  // Ref to track if initial lock has been set (prevents re-locking after unlock)
  const initialLockSetRef = useRef(false);
  // Ref to prevent re-locking immediately after manual unlock
  const justUnlockedRef = useRef(false);

  const loadLockPreferences = useCallback(async () => {
    if (!user) {
      setLockLoading(false);
      return;
    }

    try {
      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("biometric_enabled, require_auth_on_open, inactivity_timeout_minutes")
        .eq("user_id", user.id)
        .maybeSingle();

      if (preferences) {
        const prefs = preferences as { 
          biometric_enabled?: boolean; 
          require_auth_on_open?: boolean;
          inactivity_timeout_minutes?: number;
        };
        setBiometricEnabled(prefs.biometric_enabled ?? false);
        setRequireAuthOnOpen(prefs.require_auth_on_open ?? false);
        setInactivityTimeoutMinutes(prefs.inactivity_timeout_minutes ?? 5);
        
        // Verrouiller UNIQUEMENT au premier chargement si l'option est activée
        // ET si on n'a pas déjà déverrouillé manuellement
        const shouldLockOnOpen = prefs.require_auth_on_open && !initialLockSetRef.current && !justUnlockedRef.current;
        if (shouldLockOnOpen) {
          initialLockSetRef.current = true;
          setIsLocked(true);
        }
      }
    } catch (error) {
      console.error("Erreur chargement préférences de verrouillage:", error);
    } finally {
      setLockLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadLockPreferences();
  }, [loadLockPreferences]);

  // Écouter quand l'app revient au premier plan
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !requireAuthOnOpen) return;

    const listener = App.addListener("appStateChange", async ({ isActive }) => {
      // Ne pas verrouiller si on vient juste de déverrouiller
      if (isActive && requireAuthOnOpen && !justUnlockedRef.current) {
        setIsLocked(true);
      }
    });

    return () => {
      listener.then(l => l.remove()).catch(console.error);
    };
  }, [requireAuthOnOpen]);

  const handleUnlock = useCallback(() => {
    justUnlockedRef.current = true;
    setIsLocked(false);
    
    // Réinitialiser le flag après un délai pour permettre le re-verrouillage futur
    setTimeout(() => {
      justUnlockedRef.current = false;
    }, 2000);
  }, []);

  // Hook de déconnexion automatique après inactivité
  useInactivityTimeout({
    timeoutMinutes: inactivityTimeoutMinutes,
    enabled: !!user && !isLocked && !loading && !lockLoading,
  });

  if (loading || lockLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Rediriger vers l'onboarding si c'est la première visite (sauf si on est déjà sur /onboarding)
  if (!hasSeenOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (isLocked && requireAuthOnOpen) {
    return <AppLockScreen onUnlock={handleUnlock} biometricEnabled={biometricEnabled} />;
  }

  return <>{children}</>;
}
