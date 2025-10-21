import { useEffect, useRef } from "react";
import { useMedicationNotificationScheduler } from "@/hooks/useMedicationNotificationScheduler";
import { useAuth } from "@/hooks/useAuth";

// Mode debug pour les logs (false en production)
const DEBUG_SCHEDULER = false;

/**
 * Composant invisible qui active automatiquement la planification 
 * des notifications de rappel de prise pour les utilisateurs connectés
 */
export const NotificationSchedulerProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { rescheduleAll } = useMedicationNotificationScheduler();
  const hasScheduledRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur a changé
    const userChanged = user?.id !== userIdRef.current;
    
    if (user && (!hasScheduledRef.current || userChanged)) {
      if (DEBUG_SCHEDULER) {
        console.log("👤 Utilisateur connecté, démarrage du planificateur de notifications");
      }
      userIdRef.current = user.id;
      
      // Petite attente pour laisser l'app se charger complètement
      const timer = setTimeout(() => {
        // Appel SILENCIEUX (pas de toasts) au démarrage
        rescheduleAll(false);
        hasScheduledRef.current = true;
      }, 2000);

      return () => {
        clearTimeout(timer);
      };
    } else if (!user) {
      // Réinitialiser le flag quand l'utilisateur se déconnecte
      hasScheduledRef.current = false;
      userIdRef.current = null;
    }
  }, [user, rescheduleAll]);

  return <>{children}</>;
};
