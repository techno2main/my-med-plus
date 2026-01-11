import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AlphabetFilterProps {
  selectedLetter: string;
  onLetterChange: (letter: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export function AlphabetFilter({ selectedLetter, onLetterChange, isOpen, onToggle }: AlphabetFilterProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="text-sm"
        >
          {isOpen ? "Masquer le tri alphabétique" : "Tri alphabétique"}
          {!isOpen && selectedLetter !== "ALL" && (
            <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground rounded-full text-xs font-medium">
              {selectedLetter}
            </span>
          )}
        </Button>
        {selectedLetter !== "ALL" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLetterChange("ALL")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Réinitialiser
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="grid grid-cols-7 gap-1.5 p-3 bg-muted/30 rounded-lg border animate-in fade-in slide-in-from-top-2 duration-200">
          <Button
            variant={selectedLetter === "ALL" ? "default" : "outline"}
            size="sm"
            className={cn(
              "h-9 text-xs font-medium col-span-7 mb-1",
              selectedLetter === "ALL" && "gradient-primary"
            )}
            onClick={() => onLetterChange("ALL")}
          >
            Tous
          </Button>
          {ALPHABET.map((letter) => (
            <Button
              key={letter}
              variant={selectedLetter === letter ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-9 w-full text-xs font-medium transition-all",
                selectedLetter === letter && "gradient-primary ring-2 ring-primary/20"
              )}
              onClick={() => onLetterChange(letter)}
            >
              {letter}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
