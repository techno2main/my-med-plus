import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

const ONBOARDING_KEY_PREFIX = 'hasSeenOnboarding_';
const FIRST_LOGIN_KEY_PREFIX = 'isFirstLogin_';

export const useOnboarding = () => {
  const { user } = useAuth();
  
  // Générer une clé unique par utilisateur
  const getOnboardingKey = useCallback(() => {
    return user ? `${ONBOARDING_KEY_PREFIX}${user.id}` : null;
  }, [user]);

  const getFirstLoginKey = useCallback(() => {
    return user ? `${FIRST_LOGIN_KEY_PREFIX}${user.id}` : null;
  }, [user]);

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => {
    // Au démarrage, on ne peut pas savoir sans le user
    return false;
  });

  const [isFirstLogin, setIsFirstLogin] = useState<boolean>(false);

  // Mettre à jour l'état quand l'utilisateur change
  useEffect(() => {
    if (user) {
      const key = `${ONBOARDING_KEY_PREFIX}${user.id}`;
      const firstLoginKey = `${FIRST_LOGIN_KEY_PREFIX}${user.id}`;
      
      const seen = localStorage.getItem(key) === 'true';
      setHasSeenOnboarding(seen);
      
      // Vérifier si c'est la première connexion (jamais vu onboarding ET pas encore marqué comme premier login traité)
      const firstLoginHandled = localStorage.getItem(firstLoginKey) === 'true';
      setIsFirstLogin(!seen && !firstLoginHandled);
    }
  }, [user]);

  const completeOnboarding = useCallback(() => {
    const key = getOnboardingKey();
    const firstLoginKey = getFirstLoginKey();
    
    if (key && firstLoginKey) {
      localStorage.setItem(key, 'true');
      localStorage.setItem(firstLoginKey, 'true');
      setHasSeenOnboarding(true);
      setIsFirstLogin(false);
    }
  }, [getOnboardingKey, getFirstLoginKey]);

  const resetOnboarding = useCallback(() => {
    const key = getOnboardingKey();
    const firstLoginKey = getFirstLoginKey();
    
    if (key && firstLoginKey) {
      localStorage.removeItem(key);
      localStorage.removeItem(firstLoginKey);
      setHasSeenOnboarding(false);
      setIsFirstLogin(true);
    }
  }, [getOnboardingKey, getFirstLoginKey]);

  // Marquer la première connexion comme traitée (après avoir été redirigé vers le profil)
  const markFirstLoginHandled = useCallback(() => {
    const firstLoginKey = getFirstLoginKey();
    if (firstLoginKey) {
      localStorage.setItem(firstLoginKey, 'true');
      setIsFirstLogin(false);
    }
  }, [getFirstLoginKey]);

  return { 
    hasSeenOnboarding, 
    isFirstLogin,
    completeOnboarding, 
    resetOnboarding,
    markFirstLoginHandled 
  };
};
