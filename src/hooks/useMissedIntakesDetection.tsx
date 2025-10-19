import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

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

      // 1. Récupérer les médicaments actifs avec leurs horaires
      const { data: medications, error: medsError } = await supabase
        .from("medications")
        .select(`
          id,
          name,
          dosage_amount,
          dosage,
          times,
          treatment_id,
          treatments!inner(name, is_active),
          medication_catalog(dosage_amount, default_dosage)
        `)
        .eq("treatments.is_active", true);

      if (medsError) throw medsError;

      // 2. Récupérer les prises traitées des 2 derniers jours
      // Inclure "taken" ET "skipped" - toutes deux sont des prises déjà traitées
      const { data: confirmedIntakes, error: intakesError } = await supabase
        .from("medication_intakes")
        .select("medication_id, scheduled_time, status")
        .gte("scheduled_time", yesterday.toISOString())
        .in("status", ["taken", "skipped"]); // Prises traitées (prises OU volontairement manquées)

      if (intakesError) throw intakesError;

      // 3. Créer un Set des prises confirmées pour recherche rapide
      const confirmedSet = new Set(
        (confirmedIntakes || []).map(intake => 
          `${intake.medication_id}-${format(new Date(intake.scheduled_time), 'yyyy-MM-dd-HH:mm')}`
        )
      );

      // 4. Analyser chaque médicament pour détecter les manquées
      const missed: MissedIntake[] = [];

      (medications || []).forEach(med => {
        med.times?.forEach((time: string) => {
          // Vérifier hier
          const yesterdayIntake = new Date(yesterday);
          const [hours, minutes] = time.split(':');
          yesterdayIntake.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          const yesterdayKey = `${med.id}-${format(yesterdayIntake, 'yyyy-MM-dd-HH:mm')}`;
          
          if (!confirmedSet.has(yesterdayKey)) {
            missed.push({
              id: `${med.id}-${med.name}-${yesterdayIntake.toISOString()}`,
              medicationId: med.id,
              medication: med.name,
              dosage: med.medication_catalog?.dosage_amount || 
                     med.medication_catalog?.default_dosage || 
                     med.dosage_amount || med.dosage || '',
              scheduledTime: yesterdayIntake.toISOString(),
              displayTime: time,
              date: yesterdayIntake,
              dayName: 'Hier',
              status: 'missed_yesterday'
            });
          }

          // Vérifier aujourd'hui (seulement si l'heure + tolérance est dépassée)
          const todayIntake = new Date(today);
          todayIntake.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          
          const todayKey = `${med.id}-${format(todayIntake, 'yyyy-MM-dd-HH:mm')}`;
          const isMissedToday = isIntakeMissed(todayIntake, now);
          
          if (!confirmedSet.has(todayKey) && isMissedToday) {
            missed.push({
              id: `${med.id}-${med.name}-${todayIntake.toISOString()}`,
              medicationId: med.id,
              medication: med.name,
              dosage: med.medication_catalog?.dosage_amount || 
                     med.medication_catalog?.default_dosage || 
                     med.dosage_amount || med.dosage || '',
              scheduledTime: todayIntake.toISOString(),
              displayTime: time,
              date: todayIntake,
              dayName: "Aujourd'hui",
              status: 'missed_today'
            });
          }
        });
      });

      // 5. Trier par date (plus récent en premier)
      missed.sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());

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