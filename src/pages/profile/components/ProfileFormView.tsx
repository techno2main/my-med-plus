import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getBMILabel } from "../utils/profileUtils";

interface ProfileFormViewProps {
  dateOfBirth: Date | undefined;
  bloodType: string;
  height: string;
  weight: string;
  age: number | null;
  bmi: string | null;
  getBMIColor: (bmi: number) => string;
}

export function ProfileFormView({
  dateOfBirth,
  bloodType,
  height,
  weight,
  age,
  bmi,
  getBMIColor,
}: ProfileFormViewProps) {
  return (
    <>
      {/* Informations personnelles */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Date de naissance</Label>
            <p className="font-medium mt-1">{dateOfBirth ? format(dateOfBirth, "dd/MM/yyyy") : "-"}</p>
          </div>
          <div className="flex items-end justify-start">
            {age !== null && (
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {age} ans
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Informations médicales */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="font-semibold mb-4">Informations médicales</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Groupe sanguin</Label>
              <p className="font-medium mt-1">{bloodType || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">IMC</Label>
              {bmi ? (
                <p className={`font-medium mt-1 ${getBMIColor(parseFloat(bmi))}`}>
                  {bmi} - {getBMILabel(parseFloat(bmi))}
                </p>
              ) : (
                <p className="text-muted-foreground mt-1">-</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Taille</Label>
              <p className="font-medium mt-1">{height ? `${height} cm` : "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Poids</Label>
              <p className="font-medium mt-1">{weight ? `${weight} kg` : "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
