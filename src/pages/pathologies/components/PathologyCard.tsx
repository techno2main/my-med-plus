import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import type { Pathology } from "../utils/pathologyUtils";

interface PathologyCardProps {
  pathology: Pathology;
  onEdit: (pathology: Pathology) => void;
  onDelete: (id: string) => void;
}

export function PathologyCard({ pathology, onEdit, onDelete }: PathologyCardProps) {
  return (
    <Card className="p-4 surface-elevated hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold flex-1">{pathology.name}</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(pathology)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(pathology.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {pathology.description && (
        <p className="text-sm text-muted-foreground">{pathology.description}</p>
      )}
    </Card>
  );
}
