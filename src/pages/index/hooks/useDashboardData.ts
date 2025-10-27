import { useState, useEffect } from "react"
import { parseISO } from "date-fns"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { formatToFrenchTime } from "@/lib/dateUtils"
import { UpcomingIntake, StockAlert, ActiveTreatment } from "../types"

export const useDashboardData = () => {
  const [upcomingIntakes, setUpcomingIntakes] = useState<UpcomingIntake[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [activeTreatments, setActiveTreatments] = useState<ActiveTreatment[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      // Load active treatments with QSP and end date info
      const { data: treatments, error: treatmentsError } = await supabase
        .from("treatments")
        .select("id, name, start_date, end_date, prescription_id")
        .eq("is_active", true)

      if (treatmentsError) throw treatmentsError

      // Calculate QSP for each treatment and format data
      const treatmentsWithQsp = await Promise.all(
        (treatments || []).map(async (treatment: any) => {
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
            const startDate = new Date(treatment.start_date)
            const endDate = new Date(treatment.end_date)
            qspDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          }
          
          return {
            id: treatment.id,
            name: treatment.name,
            startDate: treatment.start_date,
            endDate: treatment.end_date,
            qspDays: qspDays
          }
        })
      )
      
      // Trier par date de début (du plus ancien au plus récent)
      treatmentsWithQsp.sort((a, b) => {
        const dateA = new Date(a.startDate).getTime()
        const dateB = new Date(b.startDate).getTime()
        return dateA - dateB
      })
      
      setActiveTreatments(treatmentsWithQsp)
      const treatmentsMap = new Map(treatmentsWithQsp.map(t => [t.id, t]))

      // Load medications info for stock alerts
      const { data: medications, error: medsError } = await supabase
        .from("medications")
        .select(`
          id,
          name,
          times,
          current_stock,
          min_threshold,
          treatment_id,
          treatments!inner(name, is_active)
        `)
        .eq("treatments.is_active", true)
      
      if (medsError) throw medsError

      // SYSTÈME UNIFIÉ : Lire les prises depuis medication_intakes uniquement
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayAfterTomorrow = new Date(today)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

      const { data: upcomingIntakesData, error: intakesError } = await supabase
        .from("medication_intakes")
        .select(`
          id,
          medication_id,
          scheduled_time,
          status,
          medications!inner (
            id,
            name,
            current_stock,
            min_threshold,
            treatment_id,
            treatments!inner (name, is_active),
            medication_catalog (pathology, strength, default_posology)
          )
        `)
        .gte("scheduled_time", today.toISOString())
        .lt("scheduled_time", dayAfterTomorrow.toISOString())
        .eq("status", "pending")
        .eq("medications.treatments.is_active", true)
        .order("scheduled_time", { ascending: true })

      if (intakesError) throw intakesError

      const intakes: UpcomingIntake[] = [];

      (upcomingIntakesData || []).forEach((intake: any) => {
        // Afficher toutes les prises pending (aujourd'hui + demain)
        const treatmentInfo = treatmentsMap.get(intake.medications.treatment_id)
        const catalogDosage = intake.medications?.medication_catalog?.strength || 
                             intake.medications?.medication_catalog?.default_posology || ""

        // Convertir UTC vers heure locale française avec date-fns
        const localTime = formatToFrenchTime(intake.scheduled_time);
        
        // Utiliser parseISO pour parser correctement la date UTC
        const scheduledDate = parseISO(intake.scheduled_time.replace(' ', 'T').replace('+00', 'Z'));

        intakes.push({
          id: intake.id,
          medicationId: intake.medication_id,
          medication: intake.medications.name,
          dosage: catalogDosage,
          time: localTime,
          date: scheduledDate,
          treatment: intake.medications.treatments.name,
          treatmentId: intake.medications.treatment_id,
          pathology: intake.medications?.medication_catalog?.pathology || "",
          currentStock: intake.medications.current_stock || 0,
          minThreshold: intake.medications.min_threshold || 10,
          treatmentQspDays: treatmentInfo?.qspDays || null,
          treatmentEndDate: treatmentInfo?.endDate || null
        })
      })

      setUpcomingIntakes(intakes) // Afficher TOUTES les prises, pas seulement les 10 premières

      // Process stock alerts
      const alerts: StockAlert[] = []
      medications?.forEach((med: any) => {
        if (med.current_stock <= med.min_threshold) {
          const dailyConsumption = med.times?.length || 1
          const daysLeft = Math.floor(med.current_stock / dailyConsumption)
          
          alerts.push({
            id: med.id,
            medication: med.name,
            remaining: med.current_stock,
            daysLeft: daysLeft
          })
        }
      })
      setStockAlerts(alerts)

    } catch (error) {
      console.error("Error loading dashboard data:", error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  return {
    upcomingIntakes,
    stockAlerts,
    activeTreatments,
    loading,
    reload: loadDashboardData
  }
}
