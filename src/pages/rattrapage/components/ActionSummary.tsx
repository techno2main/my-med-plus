import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, XCircle } from "lucide-react";

interface ActionSummaryProps {
  processedCount: number;
  totalMissed: number;
  pendingCount: number;
  saving: boolean;
  onCancelAll: () => void;
  onSaveAll: () => void;
}

export function ActionSummary({
  processedCount,
  totalMissed,
  pendingCount,
  saving,
  onCancelAll,
  onSaveAll,
}: ActionSummaryProps) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs">
          <span className="font-medium">
            {processedCount}/{totalMissed} prises traitées
          </span>
          <span className="text-muted-foreground">
            {pendingCount} en attente de traitement
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onCancelAll}
            disabled={saving}
            className="gap-1 text-xs"
          >
            <XCircle className="h-3 w-3" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={onSaveAll}
            disabled={processedCount !== totalMissed || saving}
            className="gap-1 text-xs"
          >
            <Save className="h-3 w-3" />
            {saving ? "Validation..." : "Valider"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
