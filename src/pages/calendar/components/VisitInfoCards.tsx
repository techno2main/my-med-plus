import { Card } from "@/components/ui/card";
import { Pill, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface VisitInfoCardsProps {
  nextPharmacyVisit: Date | null;
  nextDoctorVisit: Date | null;
}

export const VisitInfoCards = ({ nextPharmacyVisit, nextDoctorVisit }: VisitInfoCardsProps) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="p-4 surface-elevated cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/prescriptions')}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Pill className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Recharge
            </p>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {nextPharmacyVisit 
                ? format(nextPharmacyVisit, "d MMM yyyy", { locale: fr }) 
                : "Aucun planifié"}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 surface-elevated cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <Stethoscope className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm font-medium">
              RDV Doc
            </p>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {nextDoctorVisit 
                ? format(nextDoctorVisit, "d MMM yyyy", { locale: fr }) 
                : "Aucune planifiée"}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
