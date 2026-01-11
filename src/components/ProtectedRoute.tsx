import { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { AppLockScreen } from './AppLockScreen';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { isFilePickerActive } from '@/hooks/useFilePicker';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Fonction utilitaire pour vérifier l'onboarding directement depuis localStorage
const checkOnboardingStatus = (userId: string): boolean => {
  return localStorage.getItem(`hasSeenOnboarding_${userId}`) === 'true';
};

const checkFirstLoginStatus = (userId: string): boolean => {
  const hasSeenOnboarding = localStorage.getItem(`hasSeenOnboarding_${userId}`) === 'true';
  const firstLoginHandled = localStorage.getItem(`isFirstLogin_${userId}`) === 'true';
  return !hasSeenOnboarding && !firstLoginHandled;
};

const markFirstLoginAsHandled = (userId: string): void => {
  localStorage.setItem(`isFirstLogin_${userId}`, 'true');
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
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
      // Ne pas verrouiller si on vient juste de déverrouiller ou si un file picker est ouvert
      if (isActive && requireAuthOnOpen && !justUnlockedRef.current && !isFilePickerActive()) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // CRITIQUE: Rediriger vers /auth si l'utilisateur n'est pas connecté
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Attendre le chargement des préférences de verrouillage après avoir vérifié l'utilisateur
  if (lockLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // LECTURE DIRECTE depuis localStorage pour éviter les problèmes de synchronisation React
  const hasSeenOnboarding = checkOnboardingStatus(user.id);
  const isFirstLogin = checkFirstLoginStatus(user.id);

  // Rediriger vers l'onboarding si c'est la première visite de cet utilisateur
  if (!hasSeenOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Après l'onboarding, rediriger les nouveaux utilisateurs vers leur profil
  if (isFirstLogin && location.pathname !== '/profile' && location.pathname !== '/onboarding') {
    markFirstLoginAsHandled(user.id);
    return <Navigate to="/profile" replace />;
  }

  if (isLocked && requireAuthOnOpen) {
    return <AppLockScreen onUnlock={handleUnlock} biometricEnabled={biometricEnabled} />;
  }

  return <>{children}</>;
}
