import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ProfessionalSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProfessionalSearch({ value, onChange }: ProfessionalSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Rechercher un professionnel..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 bg-surface"
      />
    </div>
  );
}
