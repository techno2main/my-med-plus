import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export const useTerminateTreatment = () => {
  const [isTerminating, setIsTerminating] = useState(false)

  const terminateTreatment = async (treatmentId: string, treatmentName: string) => {
    setIsTerminating(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { error } = await supabase
        .from("treatments")
        .update({ 
          is_active: false, 
          end_date: today,
          updated_at: new Date().toISOString() 
        })
        .eq("id", treatmentId)

      if (error) throw error

      // Le trigger treatment_archived_cleanup supprime automatiquement les prises futures
      toast.success(`Traitement "${treatmentName}" terminé`)
      return true
    } catch (error) {
      console.error("Error terminating treatment:", error)
      toast.error("Erreur lors de la terminaison du traitement")
      return false
    } finally {
      setIsTerminating(false)
    }
  }

  return { terminateTreatment, isTerminating }
}
