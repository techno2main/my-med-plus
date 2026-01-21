import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useGettingStartedCompletion } from "@/hooks/useGettingStartedCompletion";
import { supabase } from "@/integrations/supabase/client";

const WIZARD_SHOWN_PREFIX = "profileWizardShownOnce_";

export function ProfileCompletionBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const completion = useGettingStartedCompletion();
  const [isDismissed, setIsDismissed] = useState(false);
  const [completionPercent, setCompletionPercent] = useState<number | null>(null);

  // Charger le % depuis la base
  useEffect(() => {
    if (!user) return;

    const loadCompletion = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('completion_percent')
        .eq('id', user.id)
        .single();
      
      setCompletionPercent((data?.completion_percent as number) ?? 0);
    };

    loadCompletion();
  }, [user, location.pathname]);

  // Réinitialiser le dismiss à chaque changement de page
  useEffect(() => {
    setIsDismissed(false);
  }, [location.pathname]);

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleComplete = () => {
    navigate('/getting-started');
  };

  // ATTENDRE que le % soit chargé
  if (completionPercent === null || !user) {
    return null;
  }

  // SI = 100% → NE JAMAIS AFFICHER
  if (completionPercent === 100) {
    return null;
  }

  // Ne pas afficher sur certaines pages
  const excludedPaths = [
    '/getting-started',
    '/profile',
    '/referentials/health-professionals',
    '/referentials/allergies'
  ];
  
  if (excludedPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  // Ne pas afficher si getting-started pas encore complété
  const hasCompletedGettingStarted = localStorage.getItem(`gettingStartedCompleted_${user.id}`) === 'true';
  if (!hasCompletedGettingStarted) {
    return null;
  }

  // Ne pas afficher si wizard jamais montré
  const wizardShownKey = `${WIZARD_SHOWN_PREFIX}${user.id}`;
  const hasShownWizard = localStorage.getItem(wizardShownKey) === 'true';
  if (!hasShownWizard) {
    return null;
  }

  // Ne pas afficher si l'utilisateur a cliqué sur "Plus tard"
  if (isDismissed) {
    return null;
  }

  // Calculer le nombre total d'éléments manquants
  const totalMissingItems = completion.profileMissingFields + 
    (completion.healthProfessionals.hasMedecin ? 0 : 1) + 
    (completion.healthProfessionals.hasPharmacie ? 0 : 1);

  return (
    <AnimatePresence>
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
                  Configuration à {completionPercent}%
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
    </AnimatePresence>
  );
}
