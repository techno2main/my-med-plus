import { EmptyState as EmptyStateAtom } from "@/components/ui/atoms/EmptyState";

export const EmptyState = () => {
  return (
    <EmptyStateAtom
      content={{ description: "Aucun historique disponible" }}
    />
  );
};
