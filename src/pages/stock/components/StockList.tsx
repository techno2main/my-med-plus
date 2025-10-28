import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";
import { StockCard } from "./StockCard";

interface StockItem {
  id: string;
  medication: string;
  dosage: string;
  current_stock: number;
  min_threshold: number;
  unit: string;
  status: "ok" | "low" | "critical";
  expiry_date?: string | null;
}

interface StockListProps {
  items: StockItem[];
  onAdjust: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export function StockList({ items, onAdjust, onViewDetails }: StockListProps) {
  if (items.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Aucun médicament en stock</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <StockCard
          key={item.id}
          item={item}
          onAdjust={() => onAdjust(item.id)}
          onViewDetails={() => onViewDetails(item.id)}
        />
      ))}
    </div>
  );
}
