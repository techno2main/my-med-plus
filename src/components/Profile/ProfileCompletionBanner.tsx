import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useGettingStartedCompletion } from "@/hooks/useGettingStartedCompletion";

const WIZARD_SHOWN_PREFIX = "profileWizardShownOnce_";

export function ProfileCompletionBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const completion = useGettingStartedCompletion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user || completion.isLoading) return;

    // Ne pas afficher sur getting-started et ses pages liées
    const excludedPaths = [
      '/getting-started',
      '/profile',
      '/referentials/health-professionals',
      '/referentials/allergies'
    ];
    
    if (excludedPaths.some(path => location.pathname.startsWith(path))) {
      setIsVisible(false);
      return;
    }

    // Ne pas afficher si configuration complète (profil 100% + au moins 1 pro de santé)
    if (completion.overallPercent === 100) {
      setIsVisible(false);
      return;
    }

    // Vérifier si getting-started est complété
    const hasCompletedGettingStarted = localStorage.getItem(`gettingStartedCompleted_${user.id}`) === 'true';
    if (!hasCompletedGettingStarted) {
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

    // Réafficher le banner à chaque changement de page
    setIsVisible(true);
  }, [user, completion.isLoading, completion.overallPercent, location.pathname]);

  const handleDismiss = () => {
    // Fermer temporairement (réapparaît au prochain changement de page)
    setIsVisible(false);
  };

  const handleComplete = () => {
    // Naviguer vers getting-started pour voir toutes les étapes
    navigate('/getting-started');
  };

  if (completion.isLoading || !isVisible || completion.overallPercent === 100) {
    return null;
  }

  // Calculer le nombre total d'éléments manquants
  const totalMissingItems = completion.profileMissingFields + 
    (completion.healthProfessionals.hasMedecin ? 0 : 1) + 
    (completion.healthProfessionals.hasPharmacie ? 0 : 1);

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
                  {totalMissingItems}
                </div>
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-0.5">
                  Finalisez votre configuration
                </h4>
                <p className="text-xs opacity-90">
                  Configuration à {completion.overallPercent}%
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
