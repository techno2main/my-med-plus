import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { PrescriptionCard } from "./PrescriptionCard";

interface Prescription {
  id: string;
  prescription_date: string;
  duration_days: number;
  expiry_date: string;
  status: "active" | "expiring" | "expired";
  notes: string | null;
  file_path: string | null;
  original_filename: string | null;
  doctor_name: string | null;
  treatments: Array<{ id: string; name: string }>;
  medications: Array<{ id: string; name: string; posology: string }>;
  refillVisits: Array<{
    date: string;
    actualDate: string | null;
    visitNumber: number;
    isCompleted: boolean;
    treatmentId: string;
  }>;
}

interface PrescriptionListProps {
  prescriptions: Prescription[];
  loading: boolean;
  onDownload: (prescription: Prescription) => void;
  onToggleVisit: (treatmentId: string, visitNumber: number, currentStatus: boolean) => void;
}

export function PrescriptionList({ prescriptions, loading, onDownload, onToggleVisit }: PrescriptionListProps) {
  if (loading) {
    return <p className="text-center text-muted-foreground">Chargement...</p>;
  }

  if (prescriptions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-2">Aucune ordonnance enregistrée</p>
        <p className="text-sm text-muted-foreground">
          Les ordonnances sont créées automatiquement lors de l'ajout d'un nouveau traitement
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {prescriptions.map((prescription) => (
        <PrescriptionCard
          key={prescription.id}
          prescription={prescription}
          onDownload={() => onDownload(prescription)}
          onToggleVisit={onToggleVisit}
        />
      ))}
    </div>
  );
}
