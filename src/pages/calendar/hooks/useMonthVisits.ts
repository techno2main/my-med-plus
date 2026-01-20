import { useState, useEffect } from "react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export interface MonthVisit {
  date: Date;
  type: 'pharmacy' | 'doctor';
}

interface UseMonthVisitsProps {
  currentMonth: Date;
}

export const useMonthVisits = ({ currentMonth }: UseMonthVisitsProps) => {
  const [visits, setVisits] = useState<MonthVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthVisits();
  }, [currentMonth]);

  const loadMonthVisits = async () => {
    try {
      setLoading(true);
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Étendre la plage pour inclure les jours visibles des mois adjacents
      const extendedStart = new Date(monthStart);
      extendedStart.setDate(extendedStart.getDate() - 7);
      const extendedEnd = new Date(monthEnd);
      extendedEnd.setDate(extendedEnd.getDate() + 7);

      const monthVisits: MonthVisit[] = [];

      // Charger toutes les visites en pharmacie du mois (tous traitements)
      const { data: pharmacyVisits } = await supabase
        .from("pharmacy_visits")
        .select("visit_date")
        .gte("visit_date", format(extendedStart, "yyyy-MM-dd"))
        .lte("visit_date", format(extendedEnd, "yyyy-MM-dd"));

      if (pharmacyVisits) {
        pharmacyVisits.forEach((visit: any) => {
          monthVisits.push({
            date: new Date(visit.visit_date),
            type: 'pharmacy'
          });
        });
      }

      // Charger toutes les visites médecin
      const { data: treatments } = await supabase
        .from("treatments")
        .select("start_date, end_date")
        .order("start_date", { ascending: true });

      if (treatments && treatments.length > 0) {
        const firstTreatment = treatments[0];
        
        treatments.forEach((treatment: any) => {
          // Pour le premier traitement uniquement : RDV au start_date
          if (treatment === firstTreatment) {
            const startDate = new Date(treatment.start_date);
            if (startDate >= extendedStart && startDate <= extendedEnd) {
              monthVisits.push({
                date: startDate,
                type: 'doctor'
              });
            }
          }
          // Pour tous : RDV à end_date + 1
          if (treatment.end_date) {
            const endDate = new Date(treatment.end_date);
            const doctorVisitDate = new Date(endDate);
            doctorVisitDate.setDate(doctorVisitDate.getDate() + 1);
            
            if (doctorVisitDate >= extendedStart && doctorVisitDate <= extendedEnd) {
              monthVisits.push({
                date: doctorVisitDate,
                type: 'doctor'
              });
            }
          }
        });
      }

      setVisits(monthVisits);
    } catch (error) {
      console.error("Error loading month visits:", error);
    } finally {
      setLoading(false);
    }
  };

  return { visits, loading };
};
