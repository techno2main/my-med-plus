import { VisitInfoCards } from "./VisitInfoCards";
import type { VisitDates } from "../types";

interface CalendarHeaderProps {
  visitDates: VisitDates;
}

export const CalendarHeader = ({ visitDates }: CalendarHeaderProps) => {
  return (
    <div className="space-y-4">
      <VisitInfoCards 
        nextPharmacyVisit={visitDates.nextPharmacyVisit}
        nextDoctorVisit={visitDates.nextDoctorVisit}
      />
    </div>
  );
};
