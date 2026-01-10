import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

const WIZARD_COMPLETED_PREFIX = "profileWizardCompleted_";

export const useProfileWizard = () => {
  const { user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (user && !hasChecked) {
      const key = `${WIZARD_COMPLETED_PREFIX}${user.id}`;
      const isCompleted = localStorage.getItem(key) === 'true';
      
      // Vérifier si c'est la première connexion (on utilise le flag existant)
      const isFirstLogin = localStorage.getItem(`isFirstLogin_${user.id}`) !== 'true';
      
      // Afficher le wizard si jamais complété ET première connexion
      if (!isCompleted && isFirstLogin) {
        // Petit délai pour laisser la page se charger
        setTimeout(() => {
          setShowWizard(true);
        }, 500);
      }
      
      setHasChecked(true);
    }
  }, [user, hasChecked]);

  const completeWizard = useCallback(() => {
    if (user) {
      const key = `${WIZARD_COMPLETED_PREFIX}${user.id}`;
      localStorage.setItem(key, 'true');
      setShowWizard(false);
    }
  }, [user]);

  const resetWizard = useCallback(() => {
    if (user) {
      const key = `${WIZARD_COMPLETED_PREFIX}${user.id}`;
      localStorage.removeItem(key);
    }
  }, [user]);

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
    resetWizard,
  };
};
