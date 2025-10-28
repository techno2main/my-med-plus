import { Card } from "@/components/ui/card";
import { ProfessionalCard } from "./ProfessionalCard";
import type { HealthProfessional } from "../utils/professionalUtils";

interface ProfessionalListProps {
  professionals: HealthProfessional[];
  isLoading: boolean;
  emptyMessage: string;
  onEdit: (professional: HealthProfessional) => void;
  onDelete: (id: string) => void;
}

export function ProfessionalList({
  professionals,
  isLoading,
  emptyMessage,
  onEdit,
  onDelete,
}: ProfessionalListProps) {
  if (isLoading) {
    return <p>Chargement...</p>;
  }

  if (professionals.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {professionals.map((professional) => (
        <ProfessionalCard
          key={professional.id}
          professional={professional}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
