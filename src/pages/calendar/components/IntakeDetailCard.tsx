import { CheckCircle2, XCircle, Clock, ClockAlert, Pill } from "lucide-react";
import { useIntakeOverdue } from "@/hooks/useIntakeOverdue";
import type { IntakeDetail } from "../types";

interface IntakeDetailCardProps {
  intake: IntakeDetail;
}

export const IntakeDetailCard = ({ intake }: IntakeDetailCardProps) => {
  const { isIntakeOverdue } = useIntakeOverdue();

  const getStatusIcon = () => {
    // Toujours afficher l'icône pilule blanche, peu importe le statut
    return <Pill className="h-4 w-4 text-white" />;
  };

  const getStatusBadge = () => {
    if (intake.status === 'taken' && intake.scheduledTimestamp && intake.takenAtTimestamp) {
      const scheduled = new Date(intake.scheduledTimestamp);
      const taken = new Date(intake.takenAtTimestamp);
      const differenceMinutes = (taken.getTime() - scheduled.getTime()) / (1000 * 60);
      
      // Vert : avant l'heure ou jusqu'à 30min après (à l'heure)
      if (differenceMinutes <= 30) {
        return <CheckCircle2 className="h-6 w-6 text-success" />;
      }
      // Vert : entre 30min et 1h après (léger retard)
      else if (differenceMinutes <= 60) {
        return <ClockAlert className="h-6 w-6 text-success" />;
      }
      // Vert : plus d'1h après (gros retard)
      else {
        return <ClockAlert className="h-6 w-6 text-success" />;
      }
    }
    
    switch (intake.status) {
      case 'taken':
        return <CheckCircle2 className="h-6 w-6 text-success" />;
      case 'missed':
        return <XCircle className="h-6 w-6 text-danger" />;
      case 'upcoming':
        // Vérifier si la prise est en retard pour changer l'icône
        if (intake.scheduledTimestamp) {
          const scheduledDate = new Date(intake.scheduledTimestamp);
          if (isIntakeOverdue(scheduledDate)) {
            return <ClockAlert className="h-6 w-6 text-success" />;
          }
        }
        return <Clock className="h-6 w-6 text-warning" />;
      default:
        return null;
    }
  };

  const isOverdue = intake.status === 'upcoming' && 
                    intake.scheduledTimestamp && 
                    isIntakeOverdue(new Date(intake.scheduledTimestamp));

  return (
    <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${
            isOverdue ? 'text-green-700' : ''
          }`}>
            {intake.time}
            {intake.takenAt && intake.status === 'taken' && (
              <span className="text-xs text-muted-foreground ml-1">
                ({intake.takenAt})
              </span>
            )}
          </span>
        </div>
        {getStatusBadge()}
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{intake.medication}</p>
        {intake.dosage && (
          <span className="text-xs text-muted-foreground">{intake.dosage}</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{intake.treatment}</p>
    </div>
  );
};
