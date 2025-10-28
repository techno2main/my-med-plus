import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { IntakeDetailCard } from "./IntakeDetailCard";
import type { IntakeDetail } from "../types";

interface DayDetailsPanelProps {
  selectedDate: Date;
  dayDetails: IntakeDetail[];
  loading: boolean;
  treatmentStartDate: Date | null;
}

export const DayDetailsPanel = ({ selectedDate, dayDetails, loading, treatmentStartDate }: DayDetailsPanelProps) => {
  const isBeforeTreatmentStart = () => {
    if (!treatmentStartDate) return false;
    
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const treatmentStartDateOnly = new Date(treatmentStartDate);
    treatmentStartDateOnly.setHours(0, 0, 0, 0);
    
    return selectedDateOnly < treatmentStartDateOnly;
  };

  return (
    <Card className="p-6 surface-elevated">
      <div className="flex items-baseline gap-2 mb-4">
        <h3 className="text-lg font-semibold">
          {format(selectedDate, "d MMMM yyyy", { locale: fr })}
        </h3>
        {dayDetails.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {dayDetails.filter(d => d.status === 'taken').length}/{dayDetails.length}
          </span>
        )}
      </div>
      
      {isBeforeTreatmentStart() ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucun traitement à cette date
        </p>
      ) : dayDetails.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucune prise planifiée
        </p>
      ) : (
        <div className="space-y-3">
          {dayDetails.map((detail) => (
            <IntakeDetailCard key={detail.id} intake={detail} />
          ))}
        </div>
      )}
    </Card>
  );
};
