import { Calendar } from "lucide-react";
import type { VisitDetail } from "../types";

interface VisitDetailCardProps {
  visit: VisitDetail;
}

export const VisitDetailCard = ({ visit }: VisitDetailCardProps) => {
  const getVisitIcon = () => {
    // Icône calendrier pour tous les RDV
    return <Calendar className="h-4 w-4 text-white" />;
  };

  const getVisitBadge = () => {
    switch (visit.type) {
      case 'pharmacy':
        return <span className="text-2xl">⚕️</span>;
      case 'doctor':
        return <span className="text-2xl">🩺</span>;
      default:
        return null;
    }
  };

  const getVisitBgColor = () => {
    switch (visit.type) {
      case 'pharmacy':
        return 'bg-blue-500';
      case 'doctor':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-3 rounded-lg border bg-card border-border/50">
      <div className="flex items-center gap-3">
        {/* Icon pillule/stéthoscope */}
        <div className={`w-8 h-8 rounded-full ${getVisitBgColor()} flex items-center justify-center flex-shrink-0`}>
          {getVisitIcon()}
        </div>

        {/* Infos RDV */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{visit.title}</h4>
          </div>
          {visit.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {visit.description}
            </p>
          )}
        </div>

        {/* Badge statut */}
        <div className="flex-shrink-0">
          {getVisitBadge()}
        </div>
      </div>
    </div>
  );
};
