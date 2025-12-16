import { AllergyCard } from "./AllergyCard";
import { EmptyState } from "@/components/ui/atoms/EmptyState";
import { AlertTriangle } from "lucide-react";
import type { Allergy } from "../utils/allergyUtils";

interface AllergyListProps {
  allergies: Allergy[];
  isLoading: boolean;
  onEdit: (allergy: Allergy) => void;
  onDelete: (id: string) => void;
  onAdd?: () => void;
}

export function AllergyList({ allergies, isLoading, onEdit, onDelete, onAdd }: AllergyListProps) {
  if (isLoading) {
    return <p>Chargement...</p>;
  }

  if (allergies.length === 0) {
    return (
      <EmptyState
        visual={{ icon: AlertTriangle, iconColor: "text-orange-500", title: "Aucune allergie enregistrée" }}
        content={{ description: "Ajoutez vos allergies pour recevoir des alertes lors de la prescription de médicaments" }}
        action={onAdd ? {
          label: "Ajouter une allergie",
          onClick: onAdd
        } : undefined}
      />
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
