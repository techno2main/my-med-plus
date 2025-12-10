import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

interface NumericKeyboardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  title?: string;
  allowNegative?: boolean;
}

export function NumericKeyboard({
  open,
  onOpenChange,
  value,
  onValueChange,
  title = "Ajustement",
  allowNegative = true,
}: NumericKeyboardProps) {
  const [displayValue, setDisplayValue] = useState<string>("");
  const [isNegative, setIsNegative] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      // Initialiser avec la valeur existante
      if (value) {
        const numValue = value.replace(/[^0-9-]/g, "");
        if (numValue.startsWith("-")) {
          setIsNegative(true);
          setDisplayValue(numValue.substring(1));
        } else if (numValue.startsWith("+")) {
          setIsNegative(false);
          setDisplayValue(numValue.substring(1));
        } else {
          setIsNegative(false);
          setDisplayValue(numValue);
        }
      } else {
        setDisplayValue("");
        setIsNegative(false);
      }
    }
  }, [value, open]);

  const handleNumberClick = (num: string) => {
    setDisplayValue((prev) => {
      // Ne pas ajouter de 0 au début
      if (prev === "" && num === "0") return prev;
      return prev + num;
    });
  };

  const handleBackspace = () => {
    setDisplayValue((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDisplayValue("");
    setIsNegative(false);
  };

  const handleToggleSign = () => {
    if (allowNegative) {
      setIsNegative((prev) => !prev);
    }
  };

  const handleConfirm = () => {
    if (displayValue) {
      const sign = isNegative ? "-" : "+";
      onValueChange(`${sign}${displayValue}`);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getDisplayText = () => {
    if (!displayValue) return "0";
    const sign = isNegative ? "-" : "+";
    return `${sign}${displayValue}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Saisissez une valeur numérique à l'aide du clavier
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Affichage de la valeur */}
          <div className="bg-muted p-4 rounded-lg text-center">
            <div className="text-4xl font-bold font-mono">{getDisplayText()}</div>
          </div>

          {/* Clavier numérique */}
          <div className="grid grid-cols-3 gap-2">
            {/* Ligne 1: 1, 2, 3 */}
            {["1", "2", "3"].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleNumberClick(num)}
                className="h-16 text-2xl font-semibold"
              >
                {num}
              </Button>
            ))}

            {/* Ligne 2: 4, 5, 6 */}
            {["4", "5", "6"].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleNumberClick(num)}
                className="h-16 text-2xl font-semibold"
              >
                {num}
              </Button>
            ))}

            {/* Ligne 3: 7, 8, 9 */}
            {["7", "8", "9"].map((num) => (
              <Button
                key={num}
                type="button"
                variant="outline"
                size="lg"
                onClick={() => handleNumberClick(num)}
                className="h-16 text-2xl font-semibold"
              >
                {num}
              </Button>
            ))}

            {/* Ligne 4: +/-, 0, Backspace */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleToggleSign}
              disabled={!allowNegative}
              className={`h-16 text-xl font-semibold ${
                isNegative ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
              }`}
            >
              {isNegative ? <Minus className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => handleNumberClick("0")}
              className="h-16 text-2xl font-semibold"
            >
              0
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleBackspace}
              className="h-16 text-xl font-semibold"
            >
              ←
            </Button>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="flex-1"
            >
              Effacer
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!displayValue}
              className="flex-1"
            >
              OK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Composant wrapper pour input avec clavier numérique
interface NumericKeyboardInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  title?: string;
  allowNegative?: boolean;
}

export function NumericKeyboardInput({
  value,
  onValueChange,
  placeholder = "+10 ou -5",
  className,
  title,
  allowNegative = true,
}: NumericKeyboardInputProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left ${className}`}
      >
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </button>
      <NumericKeyboard
        open={open}
        onOpenChange={setOpen}
        value={value}
        onValueChange={onValueChange}
        title={title}
        allowNegative={allowNegative}
      />
    </>
  );
}
