import { EmptyState as EmptyStateAtom } from "@/components/ui/atoms/EmptyState";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function EmptyState() {
  const navigate = useNavigate();
  
  return (
    <EmptyStateAtom
      visual={{ icon: CheckCircle2, iconColor: "text-success", title: "Tout est à jour !" }}
      content={{ description: "Aucune prise non traitée" }}
      action={{
        label: "Retour à l'accueil",
        onClick: () => navigate("/")
      }}
    />
  );
}
