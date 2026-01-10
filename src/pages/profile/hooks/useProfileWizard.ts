import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

const WIZARD_SHOWN_PREFIX = "profileWizardShownOnce_";

export const useProfileWizard = () => {
  const { user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [hasCheckedFirstTime, setHasCheckedFirstTime] = useState(false);

  // Vérifier si c'est la première connexion pour afficher le wizard automatiquement
  useEffect(() => {
    if (user && !hasCheckedFirstTime) {
      const wizardShownKey = `${WIZARD_SHOWN_PREFIX}${user.id}`;
      const hasShownWizard = localStorage.getItem(wizardShownKey) === 'true';
      
      // Afficher le wizard uniquement à la première connexion
      if (!hasShownWizard) {
        setTimeout(() => {
          setShowWizard(true);
        }, 800); // Petit délai pour laisser la page se charger
      }
      
      setHasCheckedFirstTime(true);
    }
  }, [user, hasCheckedFirstTime]);

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
