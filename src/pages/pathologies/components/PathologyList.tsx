import { Card } from "@/components/ui/card";
import { PathologyCard } from "./PathologyCard";
import type { Pathology } from "../utils/pathologyUtils";

interface PathologyListProps {
  pathologies: Pathology[];
  isLoading: boolean;
  onEdit: (pathology: Pathology) => void;
  onDelete: (id: string) => void;
}

export function PathologyList({ pathologies, isLoading, onEdit, onDelete }: PathologyListProps) {
  if (isLoading) {
    return <p>Chargement...</p>;
  }

  if (pathologies.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Aucune pathologie trouvée</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pathologies.map((pathology) => (
        <PathologyCard
          key={pathology.id}
          pathology={pathology}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
