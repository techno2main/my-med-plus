import { useState, useEffect } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CheckCircle2, Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Prescription {
  id: string;
  prescription_date: string;
  duration_days: number;
  notes: string | null;
  document_url: string | null;
  file_path: string | null;
  original_filename: string | null;
  prescribing_doctor_id: string | null;
}

interface RefillVisit {
  date: string;
  actualDate: string | null;
  visitNumber: number;
  isCompleted: boolean;
  treatmentId: string;
}

interface PrescriptionWithDetails extends Prescription {
  doctor_name: string | null;
  expiry_date: string;
  status: "active" | "expiring" | "expired";
  treatments: Array<{
    id: string;
    name: string;
  }>;
  medications: Array<{
    id: string;
    name: string;
    dosage: string;
  }>;
  refillVisits: RefillVisit[];
}

export default function Prescriptions() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger les prescriptions
      const { data: prescriptionsData, error: prescError } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("prescription_date", { ascending: false });

      if (prescError) throw prescError;

      // Pour chaque prescription, charger les détails
      const prescriptionsWithDetails = await Promise.all(
        (prescriptionsData || []).map(async (presc) => {
          // Calculer la date d'expiration
          const prescDate = new Date(presc.prescription_date);
          const expiryDate = new Date(prescDate);
          expiryDate.setDate(expiryDate.getDate() + presc.duration_days);

          // Déterminer le statut
          const now = new Date();
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          let status: "active" | "expiring" | "expired";
          if (daysUntilExpiry < 0) {
            status = "expired";
          } else if (daysUntilExpiry <= 30) {
            status = "expiring";
          } else {
            status = "active";
          }

          // Charger le nom du médecin
          let doctor_name = null;
          if (presc.prescribing_doctor_id) {
            const { data: doctorData } = await supabase
              .from("health_professionals")
              .select("name")
              .eq("id", presc.prescribing_doctor_id)
              .single();
            
            doctor_name = doctorData?.name || null;
          }

          // Charger les traitements liés à cette prescription
          const { data: treatmentsData } = await supabase
            .from("treatments")
            .select("id, name")
            .eq("prescription_id", presc.id);

          // Charger tous les médicaments des traitements liés
          const medications: Array<{ id: string; name: string; dosage: string }> = [];
          if (treatmentsData && treatmentsData.length > 0) {
            for (const treatment of treatmentsData) {
              const { data: medsData } = await supabase
                .from("medications")
                .select("id, name, dosage")
                .eq("treatment_id", treatment.id);
              
              if (medsData && medsData.length > 0) {
                medications.push(...medsData);
              }
            }
          }

          // Charger les visites de pharmacie liées aux traitements
          const refillVisits: RefillVisit[] = [];
          if (treatmentsData && treatmentsData.length > 0) {
            for (const treatment of treatmentsData) {
              const { data: visitsData } = await supabase
                .from("pharmacy_visits")
                .select("visit_date, actual_visit_date, visit_number, is_completed")
                .eq("treatment_id", treatment.id)
                .order("visit_date", { ascending: true });
              
              if (visitsData && visitsData.length > 0) {
                refillVisits.push(...visitsData.map(v => ({
                  date: v.visit_date,
                  actualDate: v.actual_visit_date,
                  visitNumber: v.visit_number,
                  isCompleted: v.is_completed || false,
                  treatmentId: treatment.id
                })));
              }
            }
          }

          return {
            ...presc,
            doctor_name,
            expiry_date: expiryDate.toISOString(),
            status,
            treatments: treatmentsData || [],
            medications: medications || [],
            refillVisits
          };
        })
      );

      setPrescriptions(prescriptionsWithDetails);
    } catch (error) {
      console.error("Error loading prescriptions:", error);
      toast.error("Erreur lors du chargement des ordonnances");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "expiring":
        return <Badge variant="warning">Expire bientôt</Badge>;
      case "expired":
        return <Badge variant="danger">Expirée</Badge>;
      default:
        return null;
    }
  };

  const handleToggleVisit = async (treatmentId: string, visitNumber: number, currentStatus: boolean) => {
    try {
      // Trouver la visite correspondante
      const { data: visit, error: fetchError } = await supabase
        .from("pharmacy_visits")
        .select("id")
        .eq("treatment_id", treatmentId)
        .eq("visit_number", visitNumber)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!visit) {
        toast.error("Visite non trouvée");
        return;
      }

      // Si on valide, on enregistre la date du jour
      // Si on annule, on supprime la date réelle
      const today = new Date().toISOString().split('T')[0];
      
      const { error: updateError } = await supabase
        .from("pharmacy_visits")
        .update({ 
          is_completed: !currentStatus,
          actual_visit_date: !currentStatus ? today : null
        })
        .eq("id", visit.id);

      if (updateError) throw updateError;

      toast.success(
        !currentStatus 
          ? "Rechargement validé ✓" 
          : "Rechargement annulé"
      );

      // Recharger les données
      loadPrescriptions();
    } catch (error) {
      console.error("Error updating visit:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDownload = async (prescription: PrescriptionWithDetails) => {
    if (!prescription.file_path) {
      toast.error("Aucun fichier disponible");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("prescriptions")
        .download(prescription.file_path);

      if (error) throw error;

      // Créer un lien de téléchargement avec le nom original
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      // Utiliser le nom de fichier original s'il existe, sinon utiliser le nom du fichier dans le storage
      a.download = prescription.original_filename || prescription.file_path.split("/").pop() || "prescription.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Téléchargement réussi");
    } catch (error) {
      console.error("Error downloading prescription:", error);
      toast.error("Erreur lors du téléchargement");
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

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader 
          title="Ordonnances"
          subtitle="Vos prescriptions médicales"
        />

        {/* Liste des ordonnances */}
        <div className="space-y-4">
          {prescriptions.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">Aucune ordonnance enregistrée</p>
              <p className="text-sm text-muted-foreground">
                Les ordonnances sont créées automatiquement lors de l'ajout d'un nouveau traitement
              </p>
            </Card>
          ) : (
            prescriptions.map((prescription) => (
              <Card key={prescription.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">
                        {prescription.treatments.length > 0 
                          ? prescription.treatments.map(t => t.name).join(", ")
                          : "Ordonnance"}
                      </h3>
                      {prescription.doctor_name && (
                        <p className="text-sm text-muted-foreground">{prescription.doctor_name}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(prescription.status)}
                </div>

                <div className="flex justify-between gap-6 text-sm mb-4">
                  <div className="flex-1">
                    <p className="text-muted-foreground mb-1">Date Début</p>
                    <p className="font-medium">
                      {new Date(prescription.prescription_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-muted-foreground mb-1">Validité</p>
                    <div className="flex items-baseline gap-2">
                      <p className="font-medium">
                        {new Date(prescription.expiry_date).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        QSP {Math.round(prescription.duration_days / 30)} mois
                      </p>
                    </div>
                  </div>
                </div>

                {prescription.medications && prescription.medications.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Médicaments prescrits</p>
                    <div className="flex justify-between gap-0.5 md:flex-wrap md:gap-2 md:justify-start">
                      {prescription.medications.map((medication) => (
                        <Badge key={medication.id} variant="muted" className="text-[13px] px-1.5 py-0.5 md:text-sm md:px-2.5 whitespace-nowrap flex-1 text-center md:flex-none">
                          {medication.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {prescription.notes && (
                  <div className="mb-4 p-3 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                  </div>
                )}

                {prescription.refillVisits && prescription.refillVisits.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-3">Dates de rechargements</p>
                    <div className="space-y-2">
                      {prescription.refillVisits.map((visit, index) => (
                        <div 
                          key={index} 
                          className="p-3 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleToggleVisit(visit.treatmentId, visit.visitNumber, visit.isCompleted)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {visit.isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                              <span className="text-sm">
                                {visit.visitNumber === 1 ? `Initial ${visit.visitNumber}/${prescription.refillVisits.length}` : `Rechargement ${visit.visitNumber}/${prescription.refillVisits.length}`}
                              </span>
                            </div>
                            <div className="text-right space-y-0.5">
                              {visit.isCompleted && visit.actualDate ? (
                                <>
                                  <p className="text-sm font-medium">
                                    {new Date(visit.actualDate).toLocaleDateString('fr-FR')}
                                  </p>
                                  {visit.actualDate !== visit.date && (
                                    <p className="text-xs text-muted-foreground">
                                      Prévu: {new Date(visit.date).toLocaleDateString('fr-FR')}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="text-sm font-medium">
                                  {new Date(visit.date).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {prescription.file_path && (
                    <p className="text-xs text-muted-foreground text-center">
                      {prescription.original_filename || prescription.file_path.split("/").pop()}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleDownload(prescription)}
                      disabled={!prescription.file_path}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}