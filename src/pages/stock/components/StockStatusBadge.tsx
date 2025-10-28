import { Badge } from "@/components/ui/badge";

interface StockStatusBadgeProps {
  status: "ok" | "low" | "critical";
}

export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  switch (status) {
    case "ok":
      return <Badge variant="success">Stock OK</Badge>;
    case "low":
      return <Badge variant="warning">Stock bas</Badge>;
    case "critical":
      return <Badge variant="danger">Critique</Badge>;
    default:
      return null;
  }
}
