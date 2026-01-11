import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfileCompletion } from "@/contexts/ProfileCompletionContext";

const WIZARD_SHOWN_PREFIX = "profileWizardShownOnce_";
const ONBOARDING_KEY_PREFIX = "hasSeenOnboarding_";

export const useProfileWizard = () => {
  const { user } = useAuth();
  const { isComplete, isLoading: profileLoading } = useProfileCompletion();
  const [showWizard, setShowWizard] = useState(false);
  const [hasCheckedFirstTime, setHasCheckedFirstTime] = useState(false);

  // Vérifier si c'est la première connexion pour afficher le wizard automatiquement
  // MAIS seulement si le profil n'est pas déjà complet ET si l'onboarding a été vu
  useEffect(() => {
    if (user && !hasCheckedFirstTime && !profileLoading) {
      const wizardShownKey = `${WIZARD_SHOWN_PREFIX}${user.id}`;
      const onboardingKey = `${ONBOARDING_KEY_PREFIX}${user.id}`;
      
      const hasShownWizard = localStorage.getItem(wizardShownKey) === 'true';
      const hasSeenOnboarding = localStorage.getItem(onboardingKey) === 'true';
      
      // Afficher le wizard uniquement si:
      // 1. L'onboarding a été complété
      // 2. Le wizard n'a jamais été montré
      // 3. Le profil n'est PAS encore complet
      if (hasSeenOnboarding && !hasShownWizard && !isComplete) {
        setTimeout(() => {
          setShowWizard(true);
        }, 800); // Petit délai pour laisser la page se charger
      }
      
      setHasCheckedFirstTime(true);
    }
  }, [user, hasCheckedFirstTime, profileLoading, isComplete]);

  const completeWizard = useCallback(() => {
    if (user) {
      const wizardShownKey = `${WIZARD_SHOWN_PREFIX}${user.id}`;
      localStorage.setItem(wizardShownKey, 'true');
      setShowWizard(false);
    }
  }, [user]);

  const skipWizard = useCallback(() => {
    if (user) {
      const wizardShownKey = `${WIZARD_SHOWN_PREFIX}${user.id}`;
      localStorage.setItem(wizardShownKey, 'true');
      setShowWizard(false);
    }
  }, [user]);

  const resetWizard = useCallback(() => {
    if (user) {
      const wizardShownKey = `${WIZARD_SHOWN_PREFIX}${user.id}`;
      localStorage.removeItem(wizardShownKey);
    }
  }, [user]);

  // Ouvrir manuellement le wizard
  const openWizard = useCallback(() => {
    setShowWizard(true);
  }, []);

  const closeWizard = useCallback(() => {
    setShowWizard(false);
  }, []);

  return {
    showWizard,
    openWizard,
    closeWizard,
    completeWizard,
    skipWizard,
    resetWizard,
  };
};
