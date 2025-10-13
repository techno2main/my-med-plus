import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdvancedCalendar } from "@/components/ui/advanced-calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, FileText, X, CalendarIcon } from "lucide-react";
import { TreatmentFormData } from "./types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Step1InfoProps {
  formData: TreatmentFormData;
  setFormData: (data: TreatmentFormData) => void;
  prescriptions: any[];
  doctors: any[];
  pharmacies: any[];
}

export function Step1Info({ formData, setFormData, prescriptions, doctors, pharmacies }: Step1InfoProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        prescriptionFile: file,
        prescriptionFileName: file.name,
      });
    }
  };

  const removeFile = () => {
    setFormData({
      ...formData,
      prescriptionFile: null,
      prescriptionFileName: "",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="treatment-name">Nom du traitement *</Label>
          <Input
            id="treatment-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Traitement diabète type 2"
            className="bg-surface"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Informations complémentaires sur le traitement..."
            className="bg-surface min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="doctor">Médecin prescripteur *</Label>
          <Select
            value={formData.prescribingDoctorId}
            onValueChange={(value) => setFormData({ ...formData, prescribingDoctorId: value })}
          >
            <SelectTrigger className="bg-surface">
              <SelectValue placeholder="Sélectionnez un médecin" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {doctors.length === 0 ? (
                <SelectItem value="none" disabled>
                  Aucun médecin disponible
                </SelectItem>
              ) : (
                doctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    {doctor.name} {doctor.specialty ? `- ${doctor.specialty}` : ""}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prescription">Ordonnance de référence (optionnel)</Label>
          <Select
            value={formData.prescriptionId}
            onValueChange={(value) => setFormData({ ...formData, prescriptionId: value })}
          >
            <SelectTrigger className="bg-surface">
              <SelectValue placeholder="Sélectionnez une ordonnance existante" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {prescriptions.length === 0 ? (
                <SelectItem value="none" disabled>
                  Aucune ordonnance disponible
                </SelectItem>
              ) : (
                prescriptions.map((presc) => (
                  <SelectItem key={presc.id} value={presc.id}>
                    {new Date(presc.prescription_date).toLocaleDateString('fr-FR')} - {presc.health_professionals?.name || "Médecin"}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Upload d&apos;ordonnance (optionnel)</Label>
          {!formData.prescriptionFile ? (
            <label htmlFor="file-upload" className="block">
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors bg-surface">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Cliquez pour uploader une ordonnance
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, JPEG, PNG (max 5MB)
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-surface rounded-lg border">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm flex-1 truncate">{formData.prescriptionFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display-name">Nom d&apos;affichage du fichier</Label>
                <Input
                  id="display-name"
                  value={formData.prescriptionFileName}
                  onChange={(e) => setFormData({ ...formData, prescriptionFileName: e.target.value })}
                  placeholder="Ex: Ordonnance Dr. Martin - Janvier 2024"
                  className="bg-surface"
                />
                <p className="text-xs text-muted-foreground">
                  Ce nom sera affiché dans l&apos;application
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pharmacy">Pharmacie de délivrance *</Label>
          <Select
            value={formData.pharmacyId}
            onValueChange={(value) => setFormData({ ...formData, pharmacyId: value })}
          >
            <SelectTrigger className="bg-surface">
              <SelectValue placeholder="Sélectionnez une pharmacie" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {pharmacies.length === 0 ? (
                <SelectItem value="none" disabled>
                  Aucune pharmacie disponible
                </SelectItem>
              ) : (
                pharmacies.map((pharmacy) => (
                  <SelectItem key={pharmacy.id} value={pharmacy.id}>
                    {pharmacy.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="first-visit">Première visite en pharmacie</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-surface",
                  !formData.firstPharmacyVisit && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.firstPharmacyVisit ? (
                  format(new Date(formData.firstPharmacyVisit), "PPP", { locale: fr })
                ) : (
                  <span>Sélectionner une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <AdvancedCalendar
                mode="single"
                selected={formData.firstPharmacyVisit ? new Date(formData.firstPharmacyVisit) : undefined}
                onSelect={(date) => {
                  if (date) {
                    setFormData({ 
                      ...formData, 
                      firstPharmacyVisit: format(date, "yyyy-MM-dd") 
                    });
                  }
                }}
                initialFocus
                locale={fr}
                disabled={(date) => date < new Date("1900-01-01")}
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            Les 2 prochaines visites seront automatiquement planifiées à 1 mois d'intervalle
          </p>
        </div>
      </Card>
    </div>
  );
}
