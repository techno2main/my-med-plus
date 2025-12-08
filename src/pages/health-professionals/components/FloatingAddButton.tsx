import { useState } from "react";
import { Plus, X, Stethoscope, Building2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FloatingAddButtonProps {
  onAdd: (type: "medecin" | "pharmacie" | "laboratoire") => void;
}

const options = [
  { type: "medecin" as const, label: "Médecin", icon: Stethoscope },
  { type: "pharmacie" as const, label: "Pharmacie", icon: Building2 },
  { type: "laboratoire" as const, label: "Laboratoire", icon: FlaskConical },
];

export function FloatingAddButton({ onAdd }: FloatingAddButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = (type: "medecin" | "pharmacie" | "laboratoire") => {
    onAdd(type);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3">
      {/* Options menu */}
      <div
        className={cn(
          "flex flex-col gap-2 transition-all duration-300",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        {options.map((option, index) => (
          <button
            key={option.type}
            onClick={() => handleOptionClick(option.type)}
            className={cn(
              "flex items-center justify-between w-44 bg-card border border-border rounded-full pl-4 pr-2 py-2 shadow-lg",
              "hover:bg-accent transition-all duration-200",
              "animate-in fade-in slide-in-from-bottom-2"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <span className="text-sm font-medium text-foreground">
              {option.label}
            </span>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <option.icon className="h-5 w-5 text-primary-foreground" />
            </div>
          </button>
        ))}
      </div>

      {/* Main FAB button */}
      <Button
        size="icon"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-transform duration-300",
          isOpen && "rotate-45"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/60 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
