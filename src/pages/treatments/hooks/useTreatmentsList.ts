import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { calculateDaysBetween } from "@/lib/dateUtils"
import { sortTimeStrings, sortMedicationsByEarliestTime } from "@/lib/sortingUtils"
import type { Treatment } from "../types"

export const useTreatmentsList = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTreatments()
  }, [])

  const loadTreatments = async () => {
    try {
      const { data: treatmentsData, error: treatmentsError } = await supabase
        .from("treatments")
        .select("*")
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false })

      if (treatmentsError) {
        console.error("Treatments error:", treatmentsError)
        throw treatmentsError
      }

      // Load medications for each treatment
      const treatmentsWithMeds = await Promise.all(
        (treatmentsData || []).map(async (treatment: any) => {
          // Load prescription and prescribing doctor if exists
          let prescribingDoctor = null
          let prescription = null
          
          if (treatment.prescription_id) {
            const { data: prescriptionData } = await supabase
              .from("prescriptions")
              .select("file_path, prescribing_doctor_id, duration_days")
              .eq("id", treatment.prescription_id)
              .maybeSingle()
            
            prescription = prescriptionData
            
            // Load prescribing doctor from prescription
            if (prescriptionData?.prescribing_doctor_id) {
              const { data: doctorData } = await supabase
                .from("health_professionals")
                .select("name")
                .eq("id", prescriptionData.prescribing_doctor_id)
                .maybeSingle()
              prescribingDoctor = doctorData
            }
          }

          // Calculate QSP in days
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
          
          // If no prescription QSP, calculate from existing dates
          if (!qspDays && treatment.start_date && treatment.end_date) {
            qspDays = calculateDaysBetween(treatment.start_date, treatment.end_date)
          }

          // Load next pharmacy visit
          const { data: pharmacyVisits } = await supabase
            .from("pharmacy_visits")
            .select("visit_date, visit_number, is_completed")
            .eq("treatment_id", treatment.id)
            .eq("is_completed", false)
            .order("visit_date", { ascending: true })
            .limit(1)

          const { data: medications } = await supabase
            .from("medications")
            .select(`
              id, 
              name, 
              posology, 
              times,
              current_stock,
              min_threshold,
              catalog_id
            `)
            .eq("treatment_id", treatment.id)

          // Load pathology and dosage from catalog for each medication
          const medsWithPathology = await Promise.all(
            (medications || []).map(async (med: any) => {
              let pathology = null;
              let catalogDosage = null;
              
              if (med.catalog_id) {
                const { data: catalogData } = await supabase
                  .from("medication_catalog")
                  .select("pathology, strength, default_posology")
                  .eq("id", med.catalog_id)
                  .maybeSingle();
                
                pathology = catalogData?.pathology || null;
                catalogDosage = catalogData?.strength || catalogData?.default_posology;
              }

              // Sort times in ascending order
              const sortedTimes = sortTimeStrings(med.times || []);

              return {
                id: med.id,
                name: med.name,
                posology: catalogDosage || med.posology,
                times: sortedTimes,
                pathology,
                currentStock: med.current_stock || 0,
                minThreshold: med.min_threshold || 10
              };
            })
          );

          // Sort medications by earliest time, then alphabetically by name
          const sortedMeds = sortMedicationsByEarliestTime(medsWithPathology);

          return {
            ...treatment,
            medications: sortedMeds,
            prescribing_doctor: prescribingDoctor,
            prescription: prescription,
            next_pharmacy_visit: pharmacyVisits && pharmacyVisits.length > 0 ? pharmacyVisits[0] : null,
            qsp_days: qspDays
          }
        })
      )

      setTreatments(treatmentsWithMeds as Treatment[])
    } catch (error) {
      console.error("Error loading treatments:", error)
      toast.error("Erreur lors du chargement des traitements")
    } finally {
      setLoading(false)
    }
  }

  return { treatments, loading, reloadTreatments: loadTreatments }
}
