import { useState, useEffect } from "react";
import { startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getLocalDateString } from "@/lib/dateUtils";
import type { DayIntake } from "../types";

interface UseMonthIntakesProps {
  currentMonth: Date;
}

interface UseMonthIntakesReturn {
  monthIntakes: DayIntake[];
  observanceRate: number;
  loading: boolean;
}

export const useMonthIntakes = ({ currentMonth }: UseMonthIntakesProps): UseMonthIntakesReturn => {
  const [monthIntakes, setMonthIntakes] = useState<DayIntake[]>([]);
  const [observanceRate, setObservanceRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonthData();
  }, [currentMonth]);

  const loadMonthData = async () => {
    try {
      setLoading(true);
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Extend range to include visible days from previous/next months (typically ±7 days)
      const extendedStart = new Date(monthStart);
      extendedStart.setDate(extendedStart.getDate() - 7);
      const extendedEnd = new Date(monthEnd);
      extendedEnd.setDate(extendedEnd.getDate() + 7);

      // Load intakes for the extended range to include visible days from adjacent months
      const { data: intakes } = await supabase
        .from("medication_intakes")
        .select(`
          *,
          medications!inner(
            treatment_id,
            treatments!inner(is_active)
          )
        `)
        .gte("scheduled_time", extendedStart.toISOString())
        .lte("scheduled_time", extendedEnd.toISOString())
        .eq("medications.treatments.is_active", true);

      // Process day by day using REAL intakes only (but now including adjacent month days)
      const daysData: DayIntake[] = [];
      const currentDate = new Date(extendedStart);
      const now = new Date();

      while (currentDate <= extendedEnd) {
        const dayIntakes = intakes?.filter((i: any) =>
          isSameDay(new Date(i.scheduled_time), currentDate)
        ) || [];

        if (dayIntakes.length > 0) {
          const dayTotal = dayIntakes.length;
          const dayTaken = dayIntakes.filter((i: any) => i.status === 'taken').length;

          // Count missed: either explicitly skipped OR pending but in the past
          const dayMissed = dayIntakes.filter((i: any) => {
            if (i.status === 'skipped') return true;
            // Only count as missed if it's a past day (not today)
            if (i.status === 'pending') {
              const scheduledTime = new Date(i.scheduled_time);
              const scheduledDateString = getLocalDateString(scheduledTime);
              const nowDateString = getLocalDateString(now);
              return scheduledDateString < nowDateString;
            }
            return false;
          }).length;

          // Count upcoming: pending and scheduled time is in the future (including today's future times)
          const dayUpcoming = dayIntakes.filter((i: any) => {
            const scheduledTime = new Date(i.scheduled_time);
            return i.status === 'pending' && scheduledTime > now;
          }).length;

          daysData.push({
            date: new Date(currentDate),
            total: dayTotal,
            taken: dayTaken,
            missed: dayMissed,
            upcoming: dayUpcoming
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      setMonthIntakes(daysData);

      // Calculate observance rate for the month
      const totalPast = daysData.reduce((sum, day) => sum + day.taken + day.missed, 0);
      const totalTaken = daysData.reduce((sum, day) => sum + day.taken, 0);
      setObservanceRate(totalPast > 0 ? Math.round((totalTaken / totalPast) * 100) : 100);

    } catch (error) {
      console.error("Error loading month data:", error);
      toast.error("Erreur lors du chargement du calendrier");
    } finally {
      setLoading(false);
    }
  };

  return { monthIntakes, observanceRate, loading };
};
