import { CheckCircle2, Circle } from "lucide-react";
import { formatDate } from "../utils/prescriptionUtils";

interface RefillVisitItemProps {
  visit: {
    date: string;
    actualDate: string | null;
    visitNumber: number;
    isCompleted: boolean;
    treatmentId: string;
  };
  onToggle: (treatmentId: string, visitNumber: number, currentStatus: boolean) => void;
}

export function RefillVisitItem({ visit, onToggle }: RefillVisitItemProps) {
  const isInitial = visit.visitNumber === 1;
  const label = isInitial ? "Initial 1/1" : `Rechargement ${visit.visitNumber - 1}/${visit.visitNumber - 1}`;

  return (
    <button
      onClick={() => onToggle(visit.treatmentId, visit.visitNumber, visit.isCompleted)}
      className="flex items-center justify-between w-full py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
    >
      <div className="flex items-center gap-2">
        {visit.isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
        <span className={visit.isCompleted ? "text-muted-foreground" : ""}>
          {label}
        </span>
      </div>
      <span className="text-sm text-muted-foreground">
        {formatDate(visit.date)}
      </span>
    </button>
  );
}
