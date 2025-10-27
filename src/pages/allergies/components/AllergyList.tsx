import { Card } from "@/components/ui/card";
import { AllergyCard } from "./AllergyCard";
import type { Allergy } from "../utils/allergyUtils";

interface AllergyListProps {
  allergies: Allergy[];
  isLoading: boolean;
  onEdit: (allergy: Allergy) => void;
  onDelete: (id: string) => void;
}

export function AllergyList({ allergies, isLoading, onEdit, onDelete }: AllergyListProps) {
  if (isLoading) {
    return <p>Chargement...</p>;
  }

  if (allergies.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Aucune allergie trouvée</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {allergies.map((allergy) => (
        <AllergyCard
          key={allergy.id}
          allergy={allergy}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
