import { useState, useCallback } from 'react';

const ONBOARDING_KEY = 'hasSeenOnboarding';

export const useOnboarding = () => {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => {
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  });

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setHasSeenOnboarding(true);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_KEY);
    setHasSeenOnboarding(false);
  }, []);

  return { hasSeenOnboarding, completeOnboarding, resetOnboarding };
};
