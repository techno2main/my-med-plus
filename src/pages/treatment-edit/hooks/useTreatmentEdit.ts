import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { calculateDaysBetween, calculateEndDate } from "@/lib/dateUtils"
import { sortMedicationsByEarliestTime } from "@/lib/sortingUtils"
import type { Treatment, Medication, TreatmentFormData } from "../types"

type MedicationCatalogWithPathology = {
  pathology_id: string | null
  strength: string | null
  pathologies: {
    id: string
    name: string
  } | null
}

export const useTreatmentEdit = () => {
  const { id } = useParams()
  const [treatment, setTreatment] = useState<Treatment | null>(null)
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [qspDays, setQspDays] = useState<number | null>(null)
  const [formData, setFormData] = useState<TreatmentFormData>({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    isActive: true
  })

  useEffect(() => {
    if (id) {
      loadTreatmentData()
    }
  }, [id])

  const loadTreatmentData = async () => {
    try {
      // Load treatment
      const { data: treatmentData, error: treatmentError } = await supabase
        .from("treatments")
        .select("*")
        .eq("id", id)
        .single()

      if (treatmentError) throw treatmentError
      setTreatment(treatmentData)
      
      // Calculate QSP and end date
      let calculatedEndDate = treatmentData.end_date || ""
      let durationDays: number | null = null
      
      // Get QSP from prescription if it exists
      if (treatmentData.prescription_id) {
        const { data: prescriptionData } = await supabase
          .from("prescriptions")
          .select("duration_days")
          .eq("id", treatmentData.prescription_id)
          .maybeSingle()
        
        if (prescriptionData?.duration_days) {
          durationDays = prescriptionData.duration_days
        }
      }
      
      // If no prescription QSP, calculate from existing dates
      if (!durationDays && treatmentData.start_date && treatmentData.end_date) {
        durationDays = calculateDaysBetween(treatmentData.start_date, treatmentData.end_date)
      }
      
      // Calculate end date from QSP if we have it
      if (durationDays && treatmentData.start_date) {
        calculatedEndDate = calculateEndDate(treatmentData.start_date, durationDays)
      }
      
      setQspDays(durationDays)
      
      // Set form data
      setFormData({
        name: treatmentData.name,
        description: treatmentData.description || treatmentData.pathology || "",
        startDate: treatmentData.start_date,
        endDate: calculatedEndDate,
        isActive: treatmentData.is_active
      })

      // Load medications for this treatment
      const { data: medsData, error: medsError } = await supabase
        .from("medications")
        .select("id, name, posology, strength, times, catalog_id, is_paused")
        .eq("treatment_id", id)

      if (medsError) throw medsError
      
      // Load pathology and strength from catalog for each medication
      const medsWithPathology = await Promise.all(
        (medsData || []).map(async (med: any) => {
          let pathology = null
          let catalogDosageAmount = null
          
          if (med.catalog_id) {
            const { data: catalogData } = await supabase
              .from("medication_catalog")
              .select(`
                pathology_id,
                strength,
                pathologies (
                  id,
                  name
                )
              `)
              .eq("id", med.catalog_id)
              .maybeSingle() as { data: MedicationCatalogWithPathology | null }
            
            pathology = catalogData?.pathologies?.name || null
            catalogDosageAmount = catalogData?.strength || null
          }

          return {
            ...med,
            pathology,
            strength: catalogDosageAmount || med.strength
          }
        })
      )
      
      // Trier par horaire de prise puis par nom
      const sortedMedications = sortMedicationsByEarliestTime(medsWithPathology)
      
      setMedications(sortedMedications)

    } catch (error) {
      console.error("Error loading treatment:", error)
      toast.error("Erreur lors du chargement du traitement")
    } finally {
      setLoading(false)
    }
  }

  const handleStartDateChange = (newStartDate: string) => {
    setFormData(prev => {
      const updated = { ...prev, startDate: newStartDate }
      
      // Recalculate end date based on QSP if we have it
      if (qspDays && newStartDate) {
        updated.endDate = calculateEndDate(newStartDate, qspDays)
      }
      
      return updated
    })
  }

  const handleSave = async () => {
    if (!treatment) return

    try {
      // Recalculate end_date to ensure it's always up-to-date in DB
      let calculatedEndDate = formData.endDate || null
      if (qspDays && formData.startDate) {
        calculatedEndDate = calculateEndDate(formData.startDate, qspDays)
      }
      
      const { error } = await supabase
        .from("treatments")
        .update({
          name: formData.name,
          description: formData.description || null,
          start_date: formData.startDate,
          end_date: calculatedEndDate,
          is_active: formData.isActive,
          updated_at: new Date().toISOString()
        })
        .eq("id", treatment.id)

      if (error) throw error

      toast.success("Traitement mis à jour avec succès")
      return true
    } catch (error) {
      console.error("Error updating treatment:", error)
      toast.error("Erreur lors de la mise à jour du traitement")
      return false
    }
  }

  return {
    treatment,
    medications,
    loading,
    qspDays,
    formData,
    setFormData,
    handleStartDateChange,
    handleSave,
    reloadTreatment: loadTreatmentData
  }
}
