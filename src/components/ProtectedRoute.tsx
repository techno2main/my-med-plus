import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { AppLockScreen } from './AppLockScreen';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [lockLoading, setLockLoading] = useState(true);
  const [requireAuthOnOpen, setRequireAuthOnOpen] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [inactivityTimeoutMinutes, setInactivityTimeoutMinutes] = useState(5);

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
        
        // Verrouiller au premier chargement si l'option est activée
        if (prefs.require_auth_on_open) {
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
      if (isActive && requireAuthOnOpen) {
        setIsLocked(true);
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [requireAuthOnOpen]);

  const handleUnlock = useCallback(() => {
    setIsLocked(false);
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

  if (isLocked && requireAuthOnOpen) {
    return <AppLockScreen onUnlock={handleUnlock} biometricEnabled={biometricEnabled} />;
  }

  return <>{children}</>;
}
