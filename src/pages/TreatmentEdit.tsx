import { useState, useEffect } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateInput } from "@/components/ui/date-input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Save, Trash2, Pencil } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MedicationEditDialog } from "@/components/TreatmentEdit/MedicationEditDialog";

interface Medication {
  id: string;
  name: string;
  posology: string;
  strength?: string | null;
  times: string[];
  catalog_id?: string;
  pathology?: string | null;
}

interface Treatment {
  id: string;
  name: string;
  pathology: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  description: string | null;
}

export default function TreatmentEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qspDays, setQspDays] = useState<number | null>(null); // QSP en jours
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    isActive: true
  });

  useEffect(() => {
    if (id) {
      loadTreatmentData();
    }
  }, [id]);

  const loadTreatmentData = async () => {
    try {
      // Load treatment
      const { data: treatmentData, error: treatmentError } = await supabase
        .from("treatments")
        .select("*")
        .eq("id", id)
        .single();

      if (treatmentError) throw treatmentError;
      setTreatment(treatmentData);
      
      // Calculate QSP and end date
      let calculatedEndDate = treatmentData.end_date || "";
      let durationDays: number | null = null;
      
      // Get QSP from prescription if it exists
      if (treatmentData.prescription_id) {
        const { data: prescriptionData } = await supabase
          .from("prescriptions")
          .select("duration_days")
          .eq("id", treatmentData.prescription_id)
          .maybeSingle();
        
        if (prescriptionData?.duration_days) {
          durationDays = prescriptionData.duration_days;
        }
      }
      
      // If no prescription QSP, calculate from existing dates
      if (!durationDays && treatmentData.start_date && treatmentData.end_date) {
        const startDate = new Date(treatmentData.start_date);
        const endDate = new Date(treatmentData.end_date);
        durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      // Calculate end date from QSP if we have it
      if (durationDays && treatmentData.start_date) {
        const startDate = new Date(treatmentData.start_date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationDays);
        calculatedEndDate = endDate.toISOString().split('T')[0];
      }
      
      setQspDays(durationDays);
      
      // Set form data
      setFormData({
        name: treatmentData.name,
        description: treatmentData.description || treatmentData.pathology || "",
        startDate: treatmentData.start_date,
        endDate: calculatedEndDate,
        isActive: treatmentData.is_active
      });

      // Load medications for this treatment
      const { data: medsData, error: medsError } = await supabase
        .from("medications")
        .select("id, name, posology, strength, times, catalog_id")
        .eq("treatment_id", id);

      if (medsError) throw medsError;
      
      // Load pathology and strength from catalog for each medication
      const medsWithPathology = await Promise.all(
        (medsData || []).map(async (med: any) => {
          let pathology = null;
          let catalogDosageAmount = null;
          
          if (med.catalog_id) {
            const { data: catalogData } = await supabase
              .from("medication_catalog")
              .select("pathology, strength")
              .eq("id", med.catalog_id)
              .maybeSingle();
            
            pathology = catalogData?.pathology || null;
            catalogDosageAmount = catalogData?.strength || null;
          }

          return {
            ...med,
            pathology,
            strength: catalogDosageAmount || med.strength
          };
        })
      );
      
      // Trier par horaire de prise puis par nom
      const sortedMedications = medsWithPathology.sort((a, b) => {
        // Obtenir le premier horaire de chaque médicament pour le tri
        const aFirstTime = a.times && a.times.length > 0 ? a.times[0] : "99:99";
        const bFirstTime = b.times && b.times.length > 0 ? b.times[0] : "99:99";
        
        // Comparer les horaires
        if (aFirstTime !== bFirstTime) {
          return aFirstTime.localeCompare(bFirstTime);
        }
        
        // Si même horaire, trier par nom
        return a.name.localeCompare(b.name);
      });
      
      setMedications(sortedMedications);

    } catch (error) {
      console.error("Error loading treatment:", error);
      toast.error("Erreur lors du chargement du traitement");
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateChange = (newStartDate: string) => {
    setFormData(prev => {
      const updated = { ...prev, startDate: newStartDate };
      
      // Recalculate end date based on QSP if we have it
      if (qspDays && newStartDate) {
        const startDate = new Date(newStartDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + qspDays);
        updated.endDate = endDate.toISOString().split('T')[0];
      }
      
      return updated;
    });
  };

  const handleEditMedication = (med: Medication) => {
    setEditingMedication(med);
    setDialogOpen(true);
  };

  const handleAddMedication = () => {
    setEditingMedication(null);
    setDialogOpen(true);
  };

  const handleMedicationSaved = () => {
    loadTreatmentData();
  };

  const handleSave = async () => {
    if (!treatment) return;

    try {
      // Recalculate end_date to ensure it's always up-to-date in DB
      let calculatedEndDate = formData.endDate || null;
      if (qspDays && formData.startDate) {
        const start = new Date(formData.startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + qspDays);
        calculatedEndDate = end.toISOString().split('T')[0];
      }
      
      const { error } = await supabase
        .from("treatments")
        .update({
          name: formData.name,
          description: formData.description || null,
          start_date: formData.startDate,
          end_date: calculatedEndDate,
          is_active: formData.isActive,
          updated_at: new Date().toISOString()
        })
        .eq("id", treatment.id);

      if (error) throw error;

      toast.success("Traitement mis à jour avec succès");
      navigate("/treatments");
    } catch (error) {
      console.error("Error updating treatment:", error);
      toast.error("Erreur lors de la mise à jour du traitement");
    }
  };

  const handleDelete = async () => {
    if (!treatment) return;

    try {
      const { error } = await supabase
        .from("treatments")
        .delete()
        .eq("id", treatment.id);

      if (error) throw error;

      toast.success("Traitement supprimé");
      navigate("/treatments");
    } catch (error) {
      console.error("Error deleting treatment:", error);
      toast.error("Erreur lors de la suppression du traitement");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  if (!treatment) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <p className="text-center text-muted-foreground">Traitement non trouvé</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/treatments")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Modifier le traitement</h1>
            <p className="text-muted-foreground">{treatment.name}</p>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="name">Nom du traitement</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Traitement Diabète"
                    className="flex-1"
                  />
                  {qspDays && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      QSP : {Math.round(qspDays / 30)} mois
                    </span>
                  )}
                  <Switch 
                    id="isActive" 
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Ex: Diabète Type 2, Cholestérol..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <DateInput
                  id="startDate"
                  value={formData.startDate}
                  onChange={handleStartDateChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <div className="flex items-center h-10 px-3 py-2 rounded-md border border-input bg-muted/50 text-sm">
                  {formData.endDate ? new Date(formData.endDate).toLocaleDateString('fr-FR') : "Non définie"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Médicaments */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Médicaments</h3>
            <Button size="icon" variant="default" onClick={handleAddMedication}>
              +
            </Button>
          </div>

          <div className="space-y-3">
            {medications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucun médicament</p>
            ) : (
              medications.map((med) => (
                <Card key={med.id} className="p-4 bg-surface">
                  {/* Ligne 1: Nom + Dosage + Pathologie Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{med.name}</p>
                      {med.strength && (
                        <span className="text-sm text-muted-foreground">{med.strength}</span>
                      )}
                    </div>
                    {med.pathology && (
                      <Badge variant="secondary" className="text-xs">
                        {med.pathology}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Ligne 2: Posologie + Icône Edit */}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">{med.posology}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEditMedication(med)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Ligne 3: Horaires de prise + Pastilles */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {med.times.length === 1 ? "Horaire de prise" : "Horaires de prise"}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {med.times.map((time, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-primary/10 text-sm font-medium">
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button className="w-full" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Enregistrer les modifications
          </Button>
          <Button 
            variant="outline" 
            className="w-full border-danger text-danger hover:bg-danger hover:text-white"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer le traitement
          </Button>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer ce traitement ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-danger hover:bg-danger/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <MedicationEditDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          medication={editingMedication}
          treatmentId={id!}
          onSave={handleMedicationSaved}
        />
      </div>
    </AppLayout>
  );
}
