import { isSameDay } from "date-fns";
import { getLocalDateString } from "@/lib/dateUtils";
import type { DayIntake } from "./types";
import type { MonthVisit } from "./hooks/useMonthVisits";

export const getDayIndicator = (
  date: Date,
  monthIntakes: DayIntake[],
  monthVisits: MonthVisit[]
) => {
  const dayData = monthIntakes.find(intake => isSameDay(intake.date, date));
  
  // Vérifier s'il y a des RDV ce jour
  const dayVisits = monthVisits.filter(visit => isSameDay(visit.date, date));
  
  if (dayVisits.length > 0) {
    const hasPharmacy = dayVisits.some(v => v.type === 'pharmacy');
    const hasDoctor = dayVisits.some(v => v.type === 'doctor');
    
    // Si les deux types de RDV, afficher les deux carrés
    if (hasPharmacy && hasDoctor) {
      return (
        <div className="absolute top-0 right-0 flex gap-0.5">
          <div className="w-2 h-2 bg-purple-500" />
          <div className="w-2 h-2 bg-green-500" />
        </div>
      );
    }
    
    // Sinon, afficher un seul carré
    if (hasPharmacy) {
      return <div className="absolute top-0 right-0 w-2 h-2 bg-green-500" />;
    }
    if (hasDoctor) {
      return <div className="absolute top-0 right-0 w-2 h-2 bg-purple-500" />;
    }
  }
  
  if (!dayData || dayData.total === 0) return null;

  const now = new Date();
  const dateString = getLocalDateString(date);
  const nowDateString = getLocalDateString(now);

  const isPastDay = dateString < nowDateString;
  const isToday = dateString === nowDateString;

  // Green: ALL intakes are taken
  if (dayData.taken === dayData.total) {
    return <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-success" />;
  }
  // Red: any missed intakes (past days only)
  if (dayData.missed > 0 && isPastDay) {
    return <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-danger" />;
  }
  // Orange: partially completed (some taken, some remaining - for today or past days with partial completion)
  if (dayData.taken > 0 && dayData.taken < dayData.total) {
    return <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-warning" />;
  }
  // Blue: future days OR today with only upcoming intakes (none taken yet)
  if (dayData.upcoming > 0) {
    return <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />;
  }
  
  return null;
};
