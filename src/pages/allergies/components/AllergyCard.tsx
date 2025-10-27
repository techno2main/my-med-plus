import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import type { Allergy } from "../utils/allergyUtils";
import { getSeverityVariant } from "../utils/allergyUtils";

interface AllergyCardProps {
  allergy: Allergy;
  onEdit: (allergy: Allergy) => void;
  onDelete: (id: string) => void;
}

export function AllergyCard({ allergy, onEdit, onDelete }: AllergyCardProps) {
  return (
    <Card className="p-4 surface-elevated hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold">{allergy.name}</h3>
          {allergy.severity && (
            <Badge variant={getSeverityVariant(allergy.severity)} className="mt-1">
              {allergy.severity}
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(allergy)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(allergy.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {allergy.description && (
        <p className="text-sm text-muted-foreground">{allergy.description}</p>
      )}
    </Card>
  );
}
