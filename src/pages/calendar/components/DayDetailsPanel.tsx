import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { getLocalDateString } from "@/lib/dateUtils";
import { IntakeDetailCard } from "./IntakeDetailCard";
import type { IntakeDetail } from "../types";
import { ChevronUp } from "lucide-react";

interface DayDetailsPanelProps {
  selectedDate: Date;
  dayDetails: IntakeDetail[];
  loading: boolean;
  treatmentStartDate: Date | null;
  onScrollToCalendar?: () => void;
}

export const DayDetailsPanel = ({ selectedDate, dayDetails, loading, treatmentStartDate, onScrollToCalendar }: DayDetailsPanelProps) => {
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
        {dayDetails.length > 0 && (() => {
          const missedCount = dayDetails.filter(d => d.status === 'missed').length;
          const skippedCount = dayDetails.filter(d => d.status === 'skipped').length;
          const total = dayDetails.length;
          const totalProblems = missedCount + skippedCount;
          
          let statusText = '';
          if (totalProblems > 0) {
            if (missedCount > 0 && skippedCount > 0) {
              // Mix des deux
              statusText = `${totalProblems} manquée${totalProblems > 1 ? 's' : ''} ou sautée${totalProblems > 1 ? 's' : ''}`;
            } else if (missedCount > 0) {
              // Seulement manquées
              statusText = `${missedCount} manquée${missedCount > 1 ? 's' : ''}`;
            } else if (skippedCount > 0) {
              // Seulement sautées
              statusText = `${skippedCount} sautée${skippedCount > 1 ? 's' : ''}`;
            }
          }
          
          return (
            <span className="text-sm text-muted-foreground">
              {isToday && " | "}
              {total} prise{total > 1 ? 's' : ''}{statusText ? ` (${statusText})` : ''}
            </span>
          );
        })()}
        {onScrollToCalendar && (
          <button
            onClick={onScrollToCalendar}
            className="ml-auto md:hidden text-muted-foreground hover:text-foreground transition-colors"
            title="Remonter au calendrier"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {dayDetails.length === 0 ? (
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
