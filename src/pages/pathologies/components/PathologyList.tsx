import { PathologyCard } from "./PathologyCard";
import { EmptyState } from "@/components/ui/atoms/EmptyState";
import { HeartPulse } from "lucide-react";
import type { Pathology } from "../utils/pathologyUtils";

interface PathologyListProps {
  pathologies: Pathology[];
  isLoading: boolean;
  onEdit: (pathology: Pathology) => void;
  onDelete: (id: string) => void;
  onAdd?: () => void;
}

export function PathologyList({ pathologies, isLoading, onEdit, onDelete, onAdd }: PathologyListProps) {
  if (isLoading) {
    return <p>Chargement...</p>;
  }

  if (pathologies.length === 0) {
    return (
      <EmptyState
        visual={{ icon: HeartPulse, iconColor: "text-red-500", title: "Aucune pathologie enregistrée" }}
        content={{ description: "Ajoutez vos pathologies pour un meilleur suivi de votre santé" }}
        action={onAdd ? {
          label: "Ajouter une pathologie",
          onClick: onAdd
        } : undefined}
      />
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
