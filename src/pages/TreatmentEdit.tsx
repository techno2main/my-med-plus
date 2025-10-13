import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

export default function TreatmentEdit() {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock data - remplacer par vraies données
  const treatment = {
    id: 1,
    name: "Traitement Diabète",
    pathology: "Diabète Type 2",
    startDate: "2025-01-15",
    endDate: null,
    isActive: true,
    notes: "Traitement principal pour contrôle glycémique",
    medications: [
      { id: 1, name: "Metformine 850mg", dosage: "1 comprimé", times: ["08:00", "20:00"] },
    ]
  };

  return (
    <AppLayout showBottomNav={false}>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Modifier le traitement</h1>
            <p className="text-muted-foreground">{treatment.name}</p>
          </div>
        </div>

        {/* Informations générales */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Informations générales</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du traitement</Label>
              <Input 
                id="name" 
                defaultValue={treatment.name}
                placeholder="Ex: Traitement Diabète"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pathology">Pathologie</Label>
              <Input 
                id="pathology" 
                defaultValue={treatment.pathology}
                placeholder="Ex: Diabète Type 2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input 
                  id="startDate" 
                  type="date" 
                  defaultValue={treatment.startDate}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input 
                  id="endDate" 
                  type="date" 
                  defaultValue={treatment.endDate || ""}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive" className="flex-1">
                <p className="font-medium">Traitement actif</p>
                <p className="text-sm text-muted-foreground">Afficher dans les traitements en cours</p>
              </Label>
              <Switch id="isActive" defaultChecked={treatment.isActive} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea 
                id="notes" 
                defaultValue={treatment.notes}
                placeholder="Ajoutez des notes sur ce traitement..."
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Médicaments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Médicaments</h3>
            <Button size="sm">Ajouter un médicament</Button>
          </div>

          <div className="space-y-3">
            {treatment.medications.map((med) => (
              <Card key={med.id} className="p-4 bg-surface">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{med.name}</p>
                    <p className="text-sm text-muted-foreground">{med.dosage}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    Modifier
                  </Button>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Horaires de prise</p>
                  <div className="flex flex-wrap gap-2">
                    {med.times.map((time, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full bg-primary/10 text-sm font-medium">
                        {time}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Enregistrer les modifications
          </Button>
          <Button 
            variant="outline" 
            className="w-full border-danger text-danger hover:bg-danger hover:text-white"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer le traitement
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
