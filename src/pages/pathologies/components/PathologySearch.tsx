import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface PathologySearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function PathologySearch({ value, onChange }: PathologySearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Rechercher une pathologie..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 bg-surface"
      />
    </div>
  );
}
