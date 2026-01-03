import { isSameDay } from "date-fns";
import { getLocalDateString } from "@/lib/dateUtils";
import type { DayIntake } from "./types";

export const getDayIndicator = (
  date: Date,
  monthIntakes: DayIntake[],
  nextPharmacyVisit: Date | null,
  nextDoctorVisit: Date | null
) => {
  const dayData = monthIntakes.find(intake => isSameDay(intake.date, date));
  
  // Check for special dates using local date strings
  const dateString = getLocalDateString(date);
  
  // Check if it's pharmacy visit
  if (nextPharmacyVisit) {
    const pharmacyDateString = getLocalDateString(nextPharmacyVisit);
    if (dateString === pharmacyDateString) {
      return <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-base">⚕️</div>;
    }
  }
  
  // Check if it's doctor visit
  if (nextDoctorVisit) {
    const doctorDateString = getLocalDateString(nextDoctorVisit);
    if (dateString === doctorDateString) {
      return <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-base">🩺</div>;
    }
  }
  
  if (!dayData || dayData.total === 0) return null;

  const now = new Date();
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
