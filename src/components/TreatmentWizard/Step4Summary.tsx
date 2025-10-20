import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TreatmentFormData } from "./types";
import { FileText, Clock, Package } from "lucide-react";

interface Step4SummaryProps {
  formData: TreatmentFormData;
  prescriptions: any[];
  pharmacies: any[];
}

export function Step4Summary({ formData, prescriptions, pharmacies }: Step4SummaryProps) {
  const prescription = prescriptions.find(p => p.id === formData.prescriptionId);
  const pharmacy = pharmacies.find(p => p.id === formData.pharmacyId);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Informations générales</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Nom du traitement</p>
            <p className="font-medium">{formData.name}</p>
          </div>
          {formData.description && (
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="font-medium">{formData.description}</p>
            </div>
          )}
          {prescription && (
            <div>
              <p className="text-sm text-muted-foreground">Ordonnance</p>
              <p className="font-medium">
                {new Date(prescription.prescription_date).toLocaleDateString('fr-FR')} - {prescription.health_professionals?.name}
              </p>
            </div>
          )}
          {formData.prescriptionFileName && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm">{formData.prescriptionFileName}</span>
            </div>
          )}
          {pharmacy && (
            <div>
              <p className="text-sm text-muted-foreground">Pharmacie</p>
              <p className="font-medium">{pharmacy.name}</p>
            </div>
          )}
          {formData.firstPharmacyVisit && (
            <div>
              <p className="text-sm text-muted-foreground">Première visite en pharmacie</p>
              <p className="font-medium">
                {new Date(formData.firstPharmacyVisit).toLocaleDateString('fr-FR')}
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Médicament(s) ({formData.medications.length})
        </h3>
        {formData.medications.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun médicament ajouté</p>
        ) : (
          <div className="space-y-4">
            {formData.medications.map((med, index) => (
              <div key={index}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{med.name}</h4>
                      {med.pathology && (
                        <Badge variant="secondary" className="mt-1">
                          {med.pathology}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                    <div>
                      <p className="text-muted-foreground">Prises par jour</p>
                      <p className="font-medium">{med.takesPerDay}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Unités par prise</p>
                      <p className="font-medium">{med.unitsPerTake}</p>
                    </div>
                  </div>
                  {med.times.filter(t => t).length > 0 && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Horaires</p>
                      <p className="font-medium">{med.times.filter(t => t).join(", ")}</p>
                    </div>
                  )}
                  {med.posology && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Posologie</p>
                      <p className="font-medium">{med.posology}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Stocks initiaux
        </h3>
        {formData.medications.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun stock à configurer</p>
        ) : (
          <div className="space-y-3">
            {formData.medications.map((med, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                <div>
                  <p className="font-medium text-sm">{med.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Consommation: {med.takesPerDay * med.unitsPerTake} unités/jour
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formData.stocks[index] || 0} unités</p>
                  <p className="text-xs text-muted-foreground">
                    Seuil: {med.minThreshold}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
