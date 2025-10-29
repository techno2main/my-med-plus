import { Badge } from "@/components/ui/badge";

interface Medication {
  id: string;
  name: string;
  posology: string;
}

interface MedicationsListProps {
  medications: Medication[];
}

export function MedicationsList({ medications }: MedicationsListProps) {
  if (medications.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="text-sm font-medium text-muted-foreground mb-2">Médicaments prescrits</p>
      <div className="flex flex-wrap gap-2">
        {medications.map((med) => (
          <Badge 
            key={med.id} 
            variant="secondary"
            className="max-w-full break-words"
          >
            {med.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
