import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "active" | "expiring" | "expired";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "active":
      return <Badge variant="success">Active</Badge>;
    case "expiring":
      return <Badge variant="warning">Expire bientôt</Badge>;
    case "expired":
      return <Badge variant="danger">Expirée</Badge>;
    default:
      return null;
  }
}
