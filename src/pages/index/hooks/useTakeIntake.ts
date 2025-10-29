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

export const useTakeIntake = (onSuccess: () => void) => {
  const [processing, setProcessing] = useState(false)

  const takeIntake = async (intake: UpcomingIntake) => {
    setProcessing(true)
    try {
      // Update existing intake record
      const { error: intakeError } = await supabase
        .from("medication_intakes")
        .update({
          taken_at: convertFrenchToUTC(new Date()).toISOString(),
          status: 'taken'
        })
        .eq("id", intake.id)

      if (intakeError) throw intakeError

      // Update medication stock
      const { error: stockError } = await supabase
        .from("medications")
        .update({
          current_stock: intake.currentStock - 1
        })
        .eq("id", intake.medicationId)

      if (stockError) throw stockError

      // Annuler les notifications associées à cette prise (avant, à l'heure, après)
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
          
          console.log(`🔕 Notifications annulées pour la prise ${intake.id}`);
        } catch (notifError) {
          console.error("Erreur annulation notifications:", notifError);
          // Ne pas bloquer la validation de la prise si l'annulation échoue
        }
      }

      toast.success("Prise enregistrée ✓")
      onSuccess()
    } catch (error) {
      console.error("Error recording intake:", error)
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setProcessing(false)
    }
  }

  return { takeIntake, processing }
}
