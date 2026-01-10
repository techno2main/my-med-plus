import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ModernDatePicker } from "@/components/ui/modern-date-picker";
import type { ProfileFieldName } from "@/hooks/useProfileCompletion";

// Mapping entre les noms de champs DB et les IDs de formulaire
const FIELD_TO_INPUT_ID: Record<ProfileFieldName, string> = {
  first_name: "firstName",
  last_name: "lastName",
  date_of_birth: "dateOfBirth",
  blood_type: "bloodType",
  height: "height",
  weight: "weight",
};

interface ProfileFormEditProps {
  firstName: string;
  lastName: string;
  dateOfBirth: Date | undefined;
  bloodType: string;
  height: string;
  weight: string;
  age: number | null;
  bmi: string | null;
  focusField?: ProfileFieldName | null;
  getBMIColor: (bmi: number) => string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onDateOfBirthChange: (date: Date | undefined) => void;
  onBloodTypeChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  onWeightChange: (value: string) => void;
}

export function ProfileFormEdit({
  firstName,
  lastName,
  dateOfBirth,
  bloodType,
  height,
  weight,
  age,
  bmi,
  focusField,
  getBMIColor,
  onFirstNameChange,
  onLastNameChange,
  onDateOfBirthChange,
  onBloodTypeChange,
  onHeightChange,
  onWeightChange,
}: ProfileFormEditProps) {
  const formRef = useRef<HTMLDivElement>(null);

  // Focus sur le champ demandé
  useEffect(() => {
    if (focusField && formRef.current) {
      const inputId = FIELD_TO_INPUT_ID[focusField];
      // Petit délai pour laisser le DOM se mettre à jour
      setTimeout(() => {
        const input = document.getElementById(inputId);
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [focusField]);

  return (
    <div ref={formRef}>
      {/* Informations personnelles */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input 
              id="firstName" 
              placeholder="Prénom" 
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input 
              id="lastName" 
              placeholder="Nom" 
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Date de naissance</Label>
            {age !== null && (
              <Badge variant="secondary" className="text-xs">
                {age} ans
              </Badge>
            )}
          </div>
          <ModernDatePicker
            value={dateOfBirth}
            onChange={onDateOfBirthChange}
            placeholder="Sélectionner la date de naissance"
          />
        </div>
      </div>

      {/* Informations médicales */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="font-semibold mb-4">Informations médicales</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bloodType">Groupe sanguin</Label>
              <Input 
                id="bloodType" 
                placeholder="A+" 
                value={bloodType}
                onChange={(e) => onBloodTypeChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>IMC</Label>
              {bmi ? (
                <div className={`flex items-center h-10 px-3 rounded-md border ${getBMIColor(parseFloat(bmi))} text-sm font-medium`}>
                  {bmi}
                </div>
              ) : (
                <div className="h-10 px-3 rounded-md border bg-muted flex items-center text-sm text-muted-foreground">
                  En attente
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="height">Taille (cm)</Label>
              <Input 
                id="height" 
                type="number" 
                placeholder="170" 
                value={height}
                onChange={(e) => onHeightChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Poids (kg)</Label>
              <Input 
                id="weight" 
                type="number" 
                step="0.1"
                placeholder="70" 
                value={weight}
                onChange={(e) => onWeightChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
