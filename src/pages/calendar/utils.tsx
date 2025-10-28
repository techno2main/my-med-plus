import { isSameDay } from "date-fns";
import type { DayIntake } from "./types";

export const getDayIndicator = (
  date: Date,
  monthIntakes: DayIntake[],
  nextPharmacyVisit: Date | null,
  nextDoctorVisit: Date | null
) => {
  const dayData = monthIntakes.find(intake => isSameDay(intake.date, date));
  
  // Check for special dates
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  
  // Check if it's pharmacy visit
  if (nextPharmacyVisit) {
    const pharmacyDate = new Date(nextPharmacyVisit);
    pharmacyDate.setHours(0, 0, 0, 0);
    if (dateOnly.getTime() === pharmacyDate.getTime()) {
      return <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-base">⚕️</div>;
    }
  }
  
  // Check if it's doctor visit
  if (nextDoctorVisit) {
    const doctorDate = new Date(nextDoctorVisit);
    doctorDate.setHours(0, 0, 0, 0);
    if (dateOnly.getTime() === doctorDate.getTime()) {
      return <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-base">🩺</div>;
    }
  }
  
  if (!dayData || dayData.total === 0) return null;

  const now = new Date();
  const nowDateOnly = new Date(now);
  nowDateOnly.setHours(0, 0, 0, 0);

  const isPastDay = dateOnly < nowDateOnly;
  const isToday = dateOnly.getTime() === nowDateOnly.getTime();

  // Only show green if ALL intakes are taken
  if (dayData.taken === dayData.total) {
    return <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-success" />;
  }
  // Show red if there are any missed intakes (past days only)
  else if (dayData.missed > 0 && isPastDay) {
    return <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-danger" />;
  }
  // Show blue only for future days with only upcoming intakes
  else if (!isPastDay && !isToday && dayData.upcoming > 0 && dayData.taken === 0) {
    return <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />;
  }
  // No indicator for partially completed days or today with pending items
  return null;
};
