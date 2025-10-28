import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function EmptyStocksAlert() {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Certains médicaments ont un stock initial à 0. Veuillez renseigner les stocks disponibles.
      </AlertDescription>
    </Alert>
  );
}
