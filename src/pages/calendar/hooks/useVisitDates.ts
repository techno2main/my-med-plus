import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { VisitDates } from "../types";

export const useVisitDates = (): VisitDates => {
  const [nextPharmacyVisit, setNextPharmacyVisit] = useState<Date | null>(null);
  const [nextDoctorVisit, setNextDoctorVisit] = useState<Date | null>(null);
  const [treatmentStartDate, setTreatmentStartDate] = useState<Date | null>(null);

  useEffect(() => {
    loadVisitDates();
  }, []);

  const loadVisitDates = async () => {
    try {
      const now = new Date();

      // Load active treatment start date and end date - get all active treatments and take the EARLIEST one
      const { data: activeTreatments, error: treatmentError } = await supabase
        .from("treatments")
        .select("start_date, end_date")
        .eq("is_active", true)
        .order("start_date", { ascending: true }); // Prendre le plus ancien, pas le plus récent

      if (treatmentError) {
        console.error("Error loading active treatment:", treatmentError);
      }

      const activeTreatment = activeTreatments && activeTreatments.length > 0 ? activeTreatments[0] : null;

      if (activeTreatment) {
        if (activeTreatment.start_date) {
          setTreatmentStartDate(new Date(activeTreatment.start_date));
        }
        
        if (activeTreatment.end_date) {
          const endDate = new Date(activeTreatment.end_date);
          setNextDoctorVisit(endDate);
        }
      }

      // Load next pharmacy visit (uniquement pour traitements actifs)
      const { data: visits } = await supabase
        .from("pharmacy_visits")
        .select(`
          visit_date,
          treatments!inner(is_active)
        `)
        .gte("visit_date", format(now, "yyyy-MM-dd"))
        .eq("is_completed", false)
        .eq("treatments.is_active", true)
        .order("visit_date", { ascending: true })
        .limit(1);

      if (visits && visits.length > 0) {
        setNextPharmacyVisit(new Date(visits[0].visit_date));
      }

    } catch (error) {
      console.error("Error loading visit dates:", error);
    }
  };

  return { nextPharmacyVisit, nextDoctorVisit, treatmentStartDate };
};
