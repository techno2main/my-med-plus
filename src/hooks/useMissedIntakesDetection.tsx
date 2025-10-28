import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay, subDays } from 'date-fns';
import { formatToFrenchTime } from "@/lib/dateUtils";

interface MissedIntake {
  id: string;
  medicationId: string;
  medication: string;
  dosage: string;
  scheduledTime: string;
  displayTime: string;
  date: Date;
  dayName: string;
  status: 'missed_yesterday' | 'missed_today';
}

interface MissedIntakesResult {
  missedIntakes: MissedIntake[];
  loading: boolean;
  totalMissed: number;
}

// Règles de tolérance pour considérer une prise comme manquée
const TOLERANCE_RULES = {
  morning: { start: 6, end: 12, toleranceHours: 1 },    // 06:00-12:00, tolérance 1h
  afternoon: { start: 12, end: 18, toleranceHours: 1 }, // 12:00-18:00, tolérance 1h  
  evening: { start: 18, end: 24, toleranceHours: 1 }    // 18:00-24:00, tolérance 1h
};

export const useMissedIntakesDetection = () => {
  const [missedIntakes, setMissedIntakes] = useState<MissedIntake[]>([]);
  const [loading, setLoading] = useState(true);

  const getTimeSlot = (hour: number) => {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'evening';
  };

  const isIntakeMissed = (scheduledTime: Date, currentTime: Date) => {
    const scheduledHour = scheduledTime.getHours();
    const timeSlot = getTimeSlot(scheduledHour);
    const toleranceMs = TOLERANCE_RULES[timeSlot].toleranceHours * 60 * 60 * 1000;
    
    const timeDiff = currentTime.getTime() - scheduledTime.getTime();
    return timeDiff > toleranceMs;
  };

  const detectMissedIntakes = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const today = startOfDay(now);
      const yesterday = startOfDay(subDays(now, 1));

      // NOUVELLE APPROCHE : Ne détecter que les prises existantes dans medication_intakes
      // avec status='pending' et dont l'heure + tolérance est dépassée
      
      // 1. Récupérer les prises en attente (pending) des derniers jours (UNIQUEMENT traitements actifs)
      const { data: pendingIntakes, error: pendingError } = await supabase
        .from("medication_intakes")
        .select(`
          id,
          medication_id,
          scheduled_time,
          status,
          medications!inner (
            name,
            strength,
            posology,
            medication_catalog(strength, default_posology),
            treatments!inner(is_active)
          )
        `)
        .eq("status", "pending")
        .eq("medications.treatments.is_active", true)
        .gte("scheduled_time", yesterday.toISOString())
        .lt("scheduled_time", now.toISOString())
        .order("scheduled_time", { ascending: false });

      if (pendingError) throw pendingError;

      // 2. Filtrer celles dont le délai de tolérance est dépassé
      const missed: MissedIntake[] = [];

      (pendingIntakes || []).forEach((intake: any) => {
        const scheduledTime = new Date(intake.scheduled_time);
        
        // Vérifier si le délai de tolérance est dépassé
        if (isIntakeMissed(scheduledTime, now)) {
          const intakeDate = new Date(intake.scheduled_time);
          const isYesterday = format(intakeDate, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd');
          
          missed.push({
            id: intake.id,
            medicationId: intake.medication_id,
            medication: intake.medications.name,
            dosage: intake.medications.medication_catalog?.strength || 
                   intake.medications.medication_catalog?.default_posology || 
                   intake.medications.strength || 
                   intake.medications.posology || '',
            scheduledTime: intake.scheduled_time,
            displayTime: formatToFrenchTime(intake.scheduled_time),
            date: scheduledTime,
            dayName: isYesterday ? 'Hier' : format(scheduledTime, 'dd/MM/yyyy'),
            status: isYesterday ? 'missed_yesterday' : 'missed_today'
          });
        }
      });

      setMissedIntakes(missed);

    } catch (error) {
      console.error("Erreur lors de la détection des prises manquées:", error);
      setMissedIntakes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    detectMissedIntakes();
  }, []);

  const result: MissedIntakesResult = {
    missedIntakes,
    loading,
    totalMissed: missedIntakes.length
  };

  return result;
};