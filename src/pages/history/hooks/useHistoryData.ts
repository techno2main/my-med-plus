import { useState, useEffect } from "react"
import { parseISO, startOfDay } from "date-fns"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { formatToFrenchTime, calculateDaysBetween } from "@/lib/dateUtils"
import { sortIntakesByTimeAndName } from "@/lib/sortingUtils"
import { GroupedIntakes } from "../types"

export const useHistoryData = () => {
  const [historyData, setHistoryData] = useState<GroupedIntakes[]>([])
  const [loading, setLoading] = useState(true)

  const loadHistory = async () => {
    try {
      const { data: intakesData, error } = await supabase
        .from("medication_intakes")
        .select(`
          id,
          medication_id,
          scheduled_time,
          taken_at,
          status,
          medications!inner (
            name,
            catalog_id,
            treatment_id,
            medication_catalog(strength, default_posology),
            treatments!inner(name, start_date, end_date, prescription_id, is_active)
          )
        `)
        .order("scheduled_time", { ascending: false }) as { data: any[] | null; error: any }

      if (error) throw error

      // Get unique treatment IDs and calculate QSP for each
      const treatmentIds = [...new Set((intakesData || []).map((i: any) => i.medications?.treatment_id).filter(Boolean))]
      const treatmentsQspMap = new Map()
      
      for (const treatmentId of treatmentIds) {
        const treatment = (intakesData || []).find((i: any) => i.medications?.treatment_id === treatmentId)?.medications?.treatments
        if (treatment) {
          let qspDays: number | null = null
          
          if (treatment.prescription_id) {
            const { data: prescriptionData } = await supabase
              .from("prescriptions")
              .select("duration_days")
              .eq("id", treatment.prescription_id)
              .maybeSingle()
            
            if (prescriptionData?.duration_days) {
              qspDays = prescriptionData.duration_days
            }
          }
          
          if (!qspDays && treatment.start_date && treatment.end_date) {
            qspDays = calculateDaysBetween(treatment.start_date, treatment.end_date)
          }
          
          treatmentsQspMap.set(treatmentId, {
            qsp_days: qspDays,
            end_date: treatment.end_date,
            is_active: treatment.is_active
          })
        }
      }

      // Group by date
      const grouped = (intakesData || []).reduce((acc: Record<string, GroupedIntakes>, intake: any) => {
        const date = startOfDay(parseISO(intake.scheduled_time))
        const dateKey = date.toISOString()
        
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date,
            intakes: []
          }
        }

        const dosage = intake.medications?.medication_catalog?.strength || 
                       intake.medications?.medication_catalog?.default_posology || 
                       ""
        
        const treatmentId = intake.medications?.treatment_id || ''
        const treatmentInfo = treatmentsQspMap.get(treatmentId)
        
        acc[dateKey].intakes.push({
          id: intake.id,
          time: formatToFrenchTime(intake.scheduled_time),
          medication: intake.medications?.name || 'Médicament inconnu',
          dosage: dosage,
          status: intake.status,
          takenAt: intake.taken_at ? formatToFrenchTime(intake.taken_at) : undefined,
          scheduledTimestamp: intake.scheduled_time,
          takenAtTimestamp: intake.taken_at,
          treatment: intake.medications?.treatments?.name || 'Traitement inconnu',
          treatmentId: treatmentId,
          treatmentQspDays: treatmentInfo?.qsp_days || null,
          treatmentEndDate: treatmentInfo?.end_date || null,
          treatmentIsActive: treatmentInfo?.is_active ?? true,
          isPaused: intake.medications?.is_paused || false
        })

        return acc
      }, {})

      // Sort intakes within each day
      Object.values(grouped).forEach((day: GroupedIntakes) => {
        day.intakes = sortIntakesByTimeAndName(day.intakes)
      })

      setHistoryData(Object.values(grouped))

    } catch (error) {
      console.error("Error loading history:", error)
      toast.error("Erreur lors du chargement de l'historique")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  return {
    historyData,
    loading,
    reload: loadHistory
  }
}
