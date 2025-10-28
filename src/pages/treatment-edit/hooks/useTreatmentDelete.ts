import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import type { Treatment } from "../types"

export const useTreatmentDelete = (treatment: Treatment | null) => {
  const navigate = useNavigate()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleDelete = async () => {
    if (!treatment) return

    try {
      const { error } = await supabase
        .from("treatments")
        .delete()
        .eq("id", treatment.id)

      if (error) throw error

      toast.success("Traitement supprimé")
      navigate("/treatments")
    } catch (error) {
      console.error("Error deleting treatment:", error)
      toast.error("Erreur lors de la suppression du traitement")
    }
  }

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDelete
  }
}
