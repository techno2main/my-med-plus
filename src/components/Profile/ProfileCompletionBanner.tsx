import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";

const DISMISSED_KEY_PREFIX = "profileBannerDismissed_";
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 heures
const WIZARD_SHOWN_PREFIX = "profileWizardShownOnce_";

export function ProfileCompletionBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLoading, completionPercent, missingFieldsCount, isComplete } = useProfileCompletion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user || isLoading) return;

    // Ne pas afficher si profil complet
    if (isComplete) {
      setIsVisible(false);
      return;
    }

    // Vérifier si c'est la première connexion (wizard géré séparément)
    const wizardShownKey = `${WIZARD_SHOWN_PREFIX}${user.id}`;
    const hasShownWizard = localStorage.getItem(wizardShownKey) === 'true';

    // Ne pas afficher le banner si le wizard n'a jamais été montré (il va s'afficher)
    if (!hasShownWizard) {
      setIsVisible(false);
      return;
    }

    // Vérifier si le banner a été dismiss récemment
    const dismissKey = `${DISMISSED_KEY_PREFIX}${user.id}`;
    const dismissedAt = localStorage.getItem(dismissKey);
    const shouldShow = !dismissedAt || Date.now() - parseInt(dismissedAt) > DISMISS_DURATION;

    setIsVisible(shouldShow);
  }, [user, isLoading, isComplete]);

  const handleDismiss = () => {
    if (user) {
      const dismissKey = `${DISMISSED_KEY_PREFIX}${user.id}`;
      localStorage.setItem(dismissKey, Date.now().toString());
    }
    setIsVisible(false);
  };

  const handleComplete = () => {
    navigate("/profile");
  };

  if (isLoading || !isVisible || isComplete) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-24 left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-xs"
        >
          <div className="relative bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-4 shadow-2xl">
            {/* Bouton fermer */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              {/* Icône avec badge */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 bg-white text-primary rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                  {missingFieldsCount}
                </div>
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-0.5">
                  Complétez votre profil
                </h4>
                <p className="text-xs opacity-90">
                  {missingFieldsCount} champ{missingFieldsCount > 1 ? 's' : ''} restant{missingFieldsCount > 1 ? 's' : ''} ({completionPercent}%)
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                onClick={handleComplete}
                size="sm"
                variant="secondary"
                className="flex-1 h-9 text-xs bg-white text-primary hover:bg-white/90"
              >
                Compléter
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="h-9 text-xs hover:bg-white/20"
              >
                Plus tard
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
