import { CheckCircle2, XCircle, Clock, ClockAlert, Pill, AlertCircle, Pause } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useIntakeOverdue } from "@/hooks/useIntakeOverdue";
import type { IntakeDetail } from "../types";

interface IntakeDetailCardProps {
  intake: IntakeDetail;
  isToday?: boolean;
  isPastDate?: boolean;
  onClick?: () => void;
}

export const IntakeDetailCard = ({ intake, isToday = false, isPastDate = false, onClick }: IntakeDetailCardProps) => {
  const { isIntakeOverdue } = useIntakeOverdue();

  // Détermine si la carte est cliquable
  // - Pour aujourd'hui : uniquement les prises 'upcoming' ET non en pause
  // - Pour les dates antérieures : toutes les prises sauf celles en pause
  const isClickable = onClick && !intake.isPaused && ((isToday && intake.status === 'upcoming') || isPastDate);

  // Détermine si une alerte de stock doit être affichée
  const hasStockAlert = () => {
    if (intake.currentStock === undefined || intake.minThreshold === undefined) return false;
    return intake.currentStock <= intake.minThreshold;
  };

  const getAlertColor = () => {
    if (intake.currentStock === 0) return "text-red-500";
    if (intake.currentStock && intake.minThreshold && intake.currentStock <= intake.minThreshold) {
      return "text-orange-500";
    }
    return "";
  };

  const getStatusIcon = () => {
    // Si le médicament est en pause ET que la prise est encore pending ET que ce n'est pas une date passée
    if (intake.isPaused && intake.status === 'upcoming' && !isPastDate) {
      return <Pause className="h-4 w-4 text-orange-600" />;
    }
    // Sinon, afficher l'icône pilule blanche
    return <Pill className="h-4 w-4 text-white" />;
  };

  const getStatusBadge = () => {
    // Si le médicament est en pause ET que la prise est encore pending ET que ce n'est pas une date passée
    if (intake.isPaused && intake.status === 'upcoming' && !isPastDate) {
      return <Pause className="h-6 w-6 text-orange-600" />;
    }
    
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
    <div 
      className={`p-3 rounded-lg border bg-card transition-shadow ${
        isClickable 
          ? 'hover:shadow-md hover:border-primary cursor-pointer' 
          : 'hover:shadow-sm'
      }`}
      onClick={isClickable ? onClick : undefined}
    >
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
          {hasStockAlert() && (
            <div className="flex items-center gap-0.5">
              <AlertCircle className={`h-4 w-4 ${getAlertColor()}`} />
            </div>
          )}
        </div>
        {getStatusBadge()}
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{intake.medication}</p>
        {intake.dosage && (
          <span className="text-xs text-muted-foreground">{intake.dosage}</span>
        )}
      </div>
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-muted-foreground">{intake.treatment}</p>
        {intake.currentStock !== undefined && (
          <p className={`text-xs font-medium ${getAlertColor() || 'text-muted-foreground'}`}>
            Stock actuel : {intake.currentStock}
          </p>
        )}
      </div>
    </div>
  );
};
