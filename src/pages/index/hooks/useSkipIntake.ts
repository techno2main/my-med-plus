import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { convertFrenchToUTC } from "@/lib/dateUtils"
import { UpcomingIntake } from "../types"
import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

/**
 * Génère un ID numérique unique à partir d'une chaîne (même logique que le scheduler)
 */
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};

export const useSkipIntake = (onSuccess: () => void) => {
  const [processing, setProcessing] = useState(false)

  const skipIntake = async (intake: UpcomingIntake) => {
    setProcessing(true)
    try {
      // Update intake record to skipped status (no stock decrement)
      const { error: intakeError } = await supabase
        .from("medication_intakes")
        .update({
          taken_at: convertFrenchToUTC(new Date()).toISOString(),
          status: 'skipped'
        })
        .eq("id", intake.id)

      if (intakeError) throw intakeError

      // Annuler les notifications associées à cette prise
      if (Capacitor.isNativePlatform()) {
        try {
          const beforeId = Math.abs(hashCode(`${intake.id}_before`));
          const onTimeId = Math.abs(hashCode(`${intake.id}_ontime`));
          const afterId = Math.abs(hashCode(`${intake.id}_after`));
          
          await LocalNotifications.cancel({ notifications: [
            { id: beforeId },
            { id: onTimeId },
            { id: afterId }
          ]});
          
          console.log(`🔕 Notifications annulées pour la prise sautée ${intake.id}`);
        } catch (notifError) {
          console.error("Erreur annulation notifications:", notifError);
        }
      }

      toast.success("Prise sautée", {
        description: "Cette prise a été marquée comme sautée volontairement"
      })
      onSuccess()
    } catch (error) {
      console.error("Error skipping intake:", error)
      toast.error("Erreur lors du saut de la prise")
    } finally {
      setProcessing(false)
    }
  }

  return { skipIntake, processing }
}
