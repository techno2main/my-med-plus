import { Card } from "@/components/ui/card";
import { MedicationCard } from "./MedicationCard";

interface Medication {
  id: string;
  name: string;
  strength?: string | null;
  pathology?: string | null;
  default_posology?: string | null;
  description?: string | null;
  total_stock?: number;
  effective_threshold?: number;
}

interface MedicationListProps {
  medications: Medication[];
  loading: boolean;
  onEdit: (medication: Medication) => void;
  onDelete: (id: string) => void;
  onStockClick: (id: string) => void;
}

export function MedicationList({ medications, loading, onEdit, onDelete, onStockClick }: MedicationListProps) {
  if (loading) {
    return <p>Chargement...</p>;
  }

  if (medications.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Aucun médicament trouvé</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {medications.map((med) => (
        <MedicationCard
          key={med.id}
          medication={med}
          onEdit={() => onEdit(med)}
          onDelete={() => onDelete(med.id)}
          onStockClick={() => onStockClick(med.id)}
        />
      ))}
    </div>
  );
}
