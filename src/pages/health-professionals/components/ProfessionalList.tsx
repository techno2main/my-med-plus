import { ProfessionalCard } from "./ProfessionalCard";
import { EmptyState } from "@/components/ui/atoms/EmptyState";
import { LucideIcon } from "lucide-react";
import type { HealthProfessional } from "../utils/professionalUtils";

interface ProfessionalListProps {
  professionals: HealthProfessional[];
  isLoading: boolean;
  emptyIcon?: LucideIcon;
  emptyIconColor?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  onEdit: (professional: HealthProfessional) => void;
  onDelete: (id: string) => void;
  onAdd?: () => void;
}

export function ProfessionalList({
  professionals,
  isLoading,
  emptyIcon,
  emptyIconColor,
  emptyTitle,
  emptyDescription,
  onEdit,
  onDelete,
  onAdd,
}: ProfessionalListProps) {
  if (isLoading) {
    return <p>Chargement...</p>;
  }

  if (professionals.length === 0) {
    return (
      <EmptyState
        visual={emptyIcon || emptyTitle ? { icon: emptyIcon, iconColor: emptyIconColor, title: emptyTitle } : undefined}
        content={{ description: emptyDescription || "Aucun élément trouvé" }}
        action={onAdd ? {
          label: "Ajouter",
          onClick: onAdd
        } : undefined}
      />
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
