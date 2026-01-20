import { useState, useEffect } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { VisitDetail } from "../types";

export const useDayVisits = (selectedDate: Date) => {
  const [visits, setVisits] = useState<VisitDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDayVisits();
  }, [selectedDate]);

  const loadDayVisits = async () => {
    try {
      setLoading(true);
      const dayString = format(selectedDate, "yyyy-MM-dd");
      const dayVisits: VisitDetail[] = [];

      // Charger les visites en pharmacie du jour (tous traitements, même archivés)
      const { data: pharmacyVisits } = await supabase
        .from("pharmacy_visits")
        .select(`
          id,
          visit_date,
          visit_number,
          is_completed,
          treatment_id,
          treatments!inner(
            id,
            name
          )
        `)
        .eq("visit_date", dayString);

      if (pharmacyVisits && pharmacyVisits.length > 0) {
        // Pour chaque visite, compter le nombre total de visites du traitement
        for (const visit of pharmacyVisits) {
          const { data: allVisits } = await supabase
            .from("pharmacy_visits")
            .select("id")
            .eq("treatment_id", visit.treatment_id);
          
          const totalVisits = allVisits?.length || 1;
          const visitNumber = visit.visit_number || 1;
          
          let title = '';
          let description = '';
          
          if (visitNumber === 1) {
            title = `Pharmacie ${visitNumber}/${totalVisits}`;
            description = `Visite initiale • ${visit.treatments.name}`;
          } else {
            title = `Pharmacie ${visitNumber}/${totalVisits}`;
            description = `Rechargement • ${visit.treatments.name}`;
          }
          
          dayVisits.push({
            id: `pharmacy-${visit.id}`,
            type: 'pharmacy',
            date: new Date(visit.visit_date),
            title: title,
            description: description
          });
        }
      }

      // Charger les visites médecin du jour
      const { data: treatments } = await supabase
        .from("treatments")
        .select("id, name, start_date, end_date")
        .order("start_date", { ascending: true });

      if (treatments && treatments.length > 0) {
        // Trouver le premier traitement (le plus ancien)
        const firstTreatment = treatments[0];
        
        treatments.forEach((treatment: any) => {
          // Pour le premier traitement uniquement : RDV au start_date
          if (treatment.id === firstTreatment.id && treatment.start_date === dayString) {
            dayVisits.push({
              id: `doctor-start-${treatment.id}`,
              type: 'doctor',
              date: new Date(treatment.start_date),
              title: 'Rendez-vous Médecin',
              description: 'Nouvelle ordonnance'
            });
          }
          // Pour tous les autres : RDV à end_date + 1
          else if (treatment.end_date) {
            const endDate = new Date(treatment.end_date);
            const doctorVisitDate = new Date(endDate);
            doctorVisitDate.setDate(doctorVisitDate.getDate() + 1);
            
            if (format(doctorVisitDate, "yyyy-MM-dd") === dayString) {
              dayVisits.push({
                id: `doctor-end-${treatment.id}`,
                type: 'doctor',
                date: doctorVisitDate,
                title: 'Rendez-vous Médecin',
                description: 'Nouvelle ordonnance'
              });
            }
          }
        });
      }

      setVisits(dayVisits);
    } catch (error) {
      console.error("Error loading day visits:", error);
    } finally {
      setLoading(false);
    }
  };

  return { visits, loading };
};
