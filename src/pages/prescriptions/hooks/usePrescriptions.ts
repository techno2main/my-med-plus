import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateExpiryDate, getPrescriptionStatus } from "../utils/prescriptionUtils";

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
    posology: string;
  }>;
  refillVisits: RefillVisit[];
}

export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
          // Calculer la date d'expiration et le statut
          const expiryDate = calculateExpiryDate(presc.prescription_date, presc.duration_days);
          const { status } = getPrescriptionStatus(expiryDate);

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
          const medications: Array<{ id: string; name: string; posology: string }> = [];
          if (treatmentsData && treatmentsData.length > 0) {
            for (const treatment of treatmentsData) {
              const { data: medsData } = await supabase
                .from("medications")
                .select("id, name, posology")
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
                refillVisits.push(
                  ...visitsData.map((v) => ({
                    date: v.visit_date,
                    actualDate: v.actual_visit_date,
                    visitNumber: v.visit_number,
                    isCompleted: v.is_completed || false,
                    treatmentId: treatment.id,
                  }))
                );
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
            refillVisits,
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
      const today = new Date().toISOString().split("T")[0];

      const { error: updateError } = await supabase
        .from("pharmacy_visits")
        .update({
          is_completed: !currentStatus,
          actual_visit_date: !currentStatus ? today : null,
        })
        .eq("id", visit.id);

      if (updateError) throw updateError;

      toast.success(!currentStatus ? "Rechargement validé ✓" : "Rechargement annulé");

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
      const { data, error } = await supabase.storage.from("prescriptions").download(prescription.file_path);

      if (error) throw error;

      // Créer un lien de téléchargement avec le nom original
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      // Utiliser le nom de fichier original s'il existe, sinon utiliser le nom du fichier dans le storage
      a.download =
        prescription.original_filename || prescription.file_path.split("/").pop() || "prescription.pdf";
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

  return {
    prescriptions,
    loading,
    handleToggleVisit,
    handleDownload,
  };
}
