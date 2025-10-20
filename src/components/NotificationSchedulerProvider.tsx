import { useEffect } from "react";
import { useMedicationNotificationScheduler } from "@/hooks/useMedicationNotificationScheduler";
import { useAuth } from "@/hooks/useAuth";

/**
 * Composant invisible qui active automatiquement la planification 
 * des notifications de rappel de prise pour les utilisateurs connectés
 */
export const NotificationSchedulerProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { rescheduleAll } = useMedicationNotificationScheduler();

  useEffect(() => {
    if (user) {
      console.log("👤 Utilisateur connecté, démarrage du planificateur de notifications");
      
      // Petite attente pour laisser l'app se charger complètement
      const timer = setTimeout(() => {
        rescheduleAll();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      console.log("👤 Utilisateur déconnecté, planificateur désactivé");
    }
  }, [user]);

  return <>{children}</>;
};
