import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2 } from "lucide-react";
import { useState } from "react";

interface CustomMessagesCardProps {
  customMessages: {
    medicationReminder: string;
    delayedReminder: string;
    stockAlert: string;
    prescriptionRenewal: string;
    pharmacyVisit: string;
  };
  onUpdate: (messages: any) => void;
}

export function CustomMessagesCard({
  customMessages,
  onUpdate,
}: CustomMessagesCardProps) {
  const [showCustomize, setShowCustomize] = useState(false);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Settings2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Personnaliser</h3>
          <p className="text-sm text-muted-foreground">
            Modifier les textes
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCustomize(!showCustomize)}
        >
          {showCustomize ? "Masquer" : "Modifier"}
        </Button>
      </div>

      {showCustomize && (
        <div className="pl-11 space-y-3">
          <div>
            <Label htmlFor="msg-medication" className="text-xs">
              Rappel de prise
            </Label>
            <Input
              id="msg-medication"
              value={customMessages.medicationReminder}
              onChange={(e) =>
                onUpdate({
                  ...customMessages,
                  medicationReminder: e.target.value,
                })
              }
              placeholder="💊 Rappel de prise"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="msg-delayed" className="text-xs">
              Rappel de prise manquée
            </Label>
            <Input
              id="msg-delayed"
              value={customMessages.delayedReminder}
              onChange={(e) =>
                onUpdate({
                  ...customMessages,
                  delayedReminder: e.target.value,
                })
              }
              placeholder="⏰ Rappel de prise manquée"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="msg-stock" className="text-xs">
              Alerte de stock
            </Label>
            <Input
              id="msg-stock"
              value={customMessages.stockAlert}
              onChange={(e) =>
                onUpdate({
                  ...customMessages,
                  stockAlert: e.target.value,
                })
              }
              placeholder="⚠️ Stock faible"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="msg-renewal" className="text-xs">
              Renouvellement d'ordonnance
            </Label>
            <Input
              id="msg-renewal"
              value={customMessages.prescriptionRenewal}
              onChange={(e) =>
                onUpdate({
                  ...customMessages,
                  prescriptionRenewal: e.target.value,
                })
              }
              placeholder="📅 Renouvellement d'ordonnance"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="msg-pharmacy" className="text-xs">
              Visite pharmacie
            </Label>
            <Input
              id="msg-pharmacy"
              value={customMessages.pharmacyVisit}
              onChange={(e) =>
                onUpdate({
                  ...customMessages,
                  pharmacyVisit: e.target.value,
                })
              }
              placeholder="💊 Visite pharmacie"
              className="mt-1"
            />
          </div>
        </div>
      )}
    </Card>
  );
}
