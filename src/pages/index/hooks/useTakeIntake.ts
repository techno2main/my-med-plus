import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { convertFrenchToUTC } from "@/lib/dateUtils"
import { UpcomingIntake } from "../types"

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
