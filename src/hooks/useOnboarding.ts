import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

const ONBOARDING_KEY_PREFIX = 'hasSeenOnboarding_';
const FIRST_LOGIN_KEY_PREFIX = 'isFirstLogin_';

export const useOnboarding = () => {
  const { user } = useAuth();
  
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => {
    // Au démarrage, on ne peut pas savoir sans le user
    return false;
  });

  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mettre à jour l'état quand l'utilisateur change
  useEffect(() => {
    if (user) {
      const key = `${ONBOARDING_KEY_PREFIX}${user.id}`;
      const firstLoginKey = `${FIRST_LOGIN_KEY_PREFIX}${user.id}`;
      
      const seen = localStorage.getItem(key) === 'true';
      setHasSeenOnboarding(seen);
      
      // Vérifier si c'est la première connexion
      const firstLoginHandled = localStorage.getItem(firstLoginKey) === 'true';
      setIsFirstLogin(!seen && !firstLoginHandled);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Fonction robuste qui récupère l'user ID directement depuis Supabase
  const completeOnboarding = useCallback(async (): Promise<boolean> => {
    try {
      // Récupérer l'user ID directement depuis la session Supabase (pas le state React)
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        console.error('❌ completeOnboarding: Pas de user ID disponible');
        return false;
      }
      
      const key = `${ONBOARDING_KEY_PREFIX}${userId}`;
      const firstLoginKey = `${FIRST_LOGIN_KEY_PREFIX}${userId}`;
      
      // Sauvegarder IMMÉDIATEMENT dans localStorage
      localStorage.setItem(key, 'true');
      localStorage.setItem(firstLoginKey, 'true');
      
      // Mettre à jour le state React
      setHasSeenOnboarding(true);
      setIsFirstLogin(false);
      
      console.log('✅ Onboarding complété pour user:', userId);
      return true;
    } catch (error) {
      console.error('❌ Erreur completeOnboarding:', error);
      return false;
    }
  }, []);

  const resetOnboarding = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        return false;
      }
      
      const key = `${ONBOARDING_KEY_PREFIX}${userId}`;
      const firstLoginKey = `${FIRST_LOGIN_KEY_PREFIX}${userId}`;
      
      localStorage.removeItem(key);
      localStorage.removeItem(firstLoginKey);
      setHasSeenOnboarding(false);
      setIsFirstLogin(true);
      
      return true;
    } catch (error) {
      console.error('❌ Erreur resetOnboarding:', error);
      return false;
    }
  }, []);

  const markFirstLoginHandled = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        return false;
      }
      
      const firstLoginKey = `${FIRST_LOGIN_KEY_PREFIX}${userId}`;
      localStorage.setItem(firstLoginKey, 'true');
      setIsFirstLogin(false);
      
      return true;
    } catch (error) {
      console.error('❌ Erreur markFirstLoginHandled:', error);
      return false;
    }
  }, []);

  return { 
    hasSeenOnboarding, 
    isFirstLogin,
    isLoading,
    completeOnboarding, 
    resetOnboarding,
    markFirstLoginHandled 
  };
};
