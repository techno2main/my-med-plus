import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { getLocalDateString } from "@/lib/dateUtils";
import { IntakeDetailCard } from "./IntakeDetailCard";
import type { IntakeDetail } from "../types";

interface DayDetailsPanelProps {
  selectedDate: Date;
  dayDetails: IntakeDetail[];
  loading: boolean;
  treatmentStartDate: Date | null;
}

export const DayDetailsPanel = ({ selectedDate, dayDetails, loading, treatmentStartDate }: DayDetailsPanelProps) => {
  const navigate = useNavigate();
  
  const isBeforeTreatmentStart = () => {
    if (!treatmentStartDate) return false;
    
    const selectedDateString = getLocalDateString(selectedDate);
    const treatmentStartDateString = getLocalDateString(treatmentStartDate);
    
    return selectedDateString < treatmentStartDateString;
  };

  // Vérifier si c'est aujourd'hui
  const isToday = getLocalDateString(selectedDate) === getLocalDateString(new Date());
  
  // Vérifier si c'est une date passée (antérieure à aujourd'hui)
  const isPastDate = getLocalDateString(selectedDate) < getLocalDateString(new Date());

  // Gérer le clic sur une prise
  const handleIntakeClick = (intake: IntakeDetail) => {
    if (isToday && intake.status === 'upcoming') {
      // Pour aujourd'hui : rediriger vers la page Accueil avec l'ID de la prise
      navigate(`/?intake=${intake.id}`);
    } else if (isPastDate) {
      // Pour les dates antérieures : rediriger vers l'historique
      // On pourra ajouter un filtre par médicament ultérieurement
      navigate(`/history?medication=${intake.medication}`);
    }
  };

  return (
    <Card className="p-6 surface-elevated">
      <div className="flex items-baseline gap-2 mb-4">
        <h3 className="text-lg font-semibold">
          {format(selectedDate, "d MMMM yyyy", { locale: fr })}
        </h3>
        {isToday && (
          <span className="text-sm text-muted-foreground">
            (Aujourd'hui)
          </span>
        )}
        {dayDetails.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {isToday && " | "}
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
            <IntakeDetailCard 
              key={detail.id} 
              intake={detail} 
              isToday={isToday}
              isPastDate={isPastDate}
              onClick={() => handleIntakeClick(detail)}
            />
          ))}
        </div>
      )}
    </Card>
  );
};
