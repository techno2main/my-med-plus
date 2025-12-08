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
  onToggleVisit: (treatmentId: string, visitNumber: number, currentStatus: boolean, plannedDate: string) => void;
  openPrescriptionId?: string | null;
}

export function PrescriptionList({ prescriptions, loading, onDownload, onToggleVisit, openPrescriptionId }: PrescriptionListProps) {
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

  // Trier les ordonnances : non-archivées d'abord (par date desc), archivées ensuite (par date desc)
  const sortedPrescriptions = [...prescriptions].sort((a, b) => {
    const aArchived = a.status === "expired";
    const bArchived = b.status === "expired";
    
    // Si les deux ont le même statut d'archivage, trier par date
    if (aArchived === bArchived) {
      return new Date(b.prescription_date).getTime() - new Date(a.prescription_date).getTime();
    }
    
    // Sinon, les non-archivées en premier
    return aArchived ? 1 : -1;
  });

  return (
    <div className="space-y-4">
      {sortedPrescriptions.map((prescription) => (
        <PrescriptionCard
          key={prescription.id}
          prescription={prescription}
          onDownload={() => onDownload(prescription)}
          onToggleVisit={onToggleVisit}
          defaultOpen={prescription.id === openPrescriptionId}
        />
      ))}
    </div>
  );
}
