import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sortIntakesByTimeAndName } from "@/lib/sortingUtils";
import { formatToFrenchTime, getLocalDateString, getStartOfLocalDay, getEndOfLocalDay } from "@/lib/dateUtils";
import type { IntakeDetail } from "../types";

interface UseDayDetailsProps {
  selectedDate: Date;
  treatmentStartDate: Date | null;
}

interface UseDayDetailsReturn {
  dayDetails: IntakeDetail[];
  loading: boolean;
}

export const useDayDetails = ({ selectedDate, treatmentStartDate }: UseDayDetailsProps): UseDayDetailsReturn => {
  const [dayDetails, setDayDetails] = useState<IntakeDetail[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDayDetails();
  }, [selectedDate, treatmentStartDate]);

  const loadDayDetails = async () => {
    try {
      setLoading(true);
      
      // Check if selected date is before treatment start
      if (treatmentStartDate) {
        const selectedDateString = getLocalDateString(selectedDate);
        const treatmentStartDateString = getLocalDateString(treatmentStartDate);

        if (selectedDateString < treatmentStartDateString) {
          setDayDetails([]);
          return;
        }
      }

      // Get start and end of selected day using new utility functions
      const dayStart = getStartOfLocalDay(selectedDate);
      const dayEnd = getEndOfLocalDay(selectedDate);
      const now = new Date();
      const today = getStartOfLocalDay();
      const selectedDateString = getLocalDateString(selectedDate);
      const todayString = getLocalDateString(today);
      const isPast = selectedDateString < todayString;

      // SYSTÈME UNIFIÉ : Lire UNIQUEMENT depuis medication_intakes
      // Plus de génération dynamique !
      const { data: intakes, error: intakesError } = await supabase
        .from("medication_intakes")
        .select(`
          id,
          medication_id,
          scheduled_time,
          taken_at,
          status,
          medications!inner (
            name,
            current_stock,
            min_threshold,
            treatment_id,
            is_paused,
            treatments!inner (name, is_active),
            medication_catalog (strength, default_posology)
          )
        `)
        .gte("scheduled_time", dayStart.toISOString())
        .lte("scheduled_time", dayEnd.toISOString())
        .eq("medications.treatments.is_active", true)
        .order("scheduled_time", { ascending: true });

      if (intakesError) throw intakesError;

      const details: IntakeDetail[] = [];

      // Traiter toutes les prises de la même manière
      (intakes || []).forEach((intake: any) => {
        const scheduledTime = new Date(intake.scheduled_time);
        
        let status: 'taken' | 'missed' | 'upcoming' = 'upcoming';
        if (intake.status === 'taken') {
          status = 'taken';
        } else if (intake.status === 'skipped') {
          status = 'missed';
        } else if (intake.status === 'pending') {
          // Pour aujourd'hui : ne marquer comme "missed" que si la date est vraiment passée (jour précédent)
          // Pour le jour actuel, même si l'heure est passée, on garde "upcoming"
          if (isPast) {
            status = 'missed';
          } else {
            status = 'upcoming';
          }
        }

        const catalogDosage = intake.medications?.medication_catalog?.strength || 
                              intake.medications?.medication_catalog?.default_posology || "";

        // Convertir UTC vers heure locale française
        const localTime = formatToFrenchTime(intake.scheduled_time);
        const localTakenAt = intake.taken_at ? formatToFrenchTime(intake.taken_at) : undefined;

        details.push({
          id: intake.id,
          medication: intake.medications?.name || '',
          dosage: catalogDosage,
          time: localTime,
          takenAt: localTakenAt,
          status: status,
          treatment: intake.medications?.treatments?.name || '',
          scheduledTimestamp: intake.scheduled_time,
          takenAtTimestamp: intake.taken_at || undefined,
          currentStock: intake.medications?.current_stock || 0,
          minThreshold: intake.medications?.min_threshold || 10,
          isPaused: intake.medications?.is_paused || false
        });
      });

      // Sort details: 1) by scheduled time, 2) by medication name alphabetically
      const sortedDetails = sortIntakesByTimeAndName(details);

      setDayDetails(sortedDetails);

    } catch (error) {
      console.error("Error loading day details:", error);
    } finally {
      setLoading(false);
    }
  };

  return { dayDetails, loading };
};
