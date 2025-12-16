import { EmptyState as EmptyStateAtom } from "@/components/ui/atoms/EmptyState";
import { Pill } from "lucide-react";

export const EmptyState = () => {
  return (
    <EmptyStateAtom
      visual={{ icon: Pill }}
      content={{ description: "Aucun traitement actif" }}
    />
  );
};
