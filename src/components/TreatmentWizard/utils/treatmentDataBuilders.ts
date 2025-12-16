import { format } from "date-fns";
import { TreatmentFormData } from "../types";

/**
 * Prépare les données de prescription pour l'insertion en base
 */
export const buildPrescriptionData = (
  userId: string,
  formData: TreatmentFormData
) => {
  return {
    user_id: userId,
    prescribing_doctor_id: formData.prescribingDoctorId || null,
    prescription_date: formData.prescriptionDate || new Date().toISOString().split('T')[0],
    duration_days: parseInt(formData.durationDays) || 90,
    file_path: null,
    original_filename: null,
  };
};

/**
 * Calcule la date de fin du traitement
 */
export const calculateEndDate = (
  startDate: string,
  durationDays: string
): string | null => {
  if (!durationDays) return null;
  
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + parseInt(durationDays));
  return end.toISOString().split('T')[0];
};

/**
 * Prépare les données du traitement pour l'insertion en base
 */
export const buildTreatmentData = (
  userId: string,
  prescriptionId: string,
  formData: TreatmentFormData
) => {
  const startDate = formData.prescriptionDate || new Date().toISOString().split('T')[0];
  const endDate = calculateEndDate(startDate, formData.durationDays);
  
  return {
    user_id: userId,
    prescription_id: prescriptionId,
    pharmacy_id: formData.pharmacyId || null,
    name: formData.name,
    description: formData.description,
    start_date: startDate,
    end_date: endDate,
    pathology: formData.medications.map(m => m.pathology).filter(Boolean).join(", "),
  };
};

/**
 * Prépare les données des médicaments pour l'insertion en base
 */
export const buildMedicationsData = (
  treatmentId: string,
  formData: TreatmentFormData
) => {
  return formData.medications.map((med, index) => ({
    treatment_id: treatmentId,
    catalog_id: med.catalogId || null,
    name: med.name,
    posology: med.posology,
    strength: null,
    times: med.times.filter(t => t !== ""),
    initial_stock: formData.stocks[index] || 0,
    current_stock: formData.stocks[index] || 0,
    min_threshold: med.minThreshold,
  }));
};

/**
 * Prépare les données des visites à la pharmacie
 */
export const buildPharmacyVisitsData = (
  treatmentId: string,
  formData: TreatmentFormData
): any[] => {
  // Vérifier que toutes les données nécessaires sont présentes
  if (
    !formData.firstPharmacyVisit ||
    !formData.pharmacyId ||
    !formData.durationDays ||
    !formData.qsp
  ) {
    return [];
  }

  const visits = [];
  const firstVisitDate = new Date(formData.firstPharmacyVisit);
  const treatmentDuration = parseInt(formData.durationDays);
  const qspDays = parseInt(formData.qsp);
  
  // Calculer le nombre de visites nécessaires selon le QSP
  const numberOfVisits = Math.ceil(treatmentDuration / qspDays);
  
  // Créer les visites espacées selon le QSP (en jours, pas en mois)
  for (let i = 0; i < numberOfVisits; i++) {
    const visitDate = new Date(firstVisitDate);
    visitDate.setDate(visitDate.getDate() + (i * qspDays));
    
    // Ne pas créer de visite après la fin du traitement
    const treatmentEndDate = new Date(formData.startDate);
    treatmentEndDate.setDate(treatmentEndDate.getDate() + treatmentDuration);
    
    if (visitDate <= treatmentEndDate) {
      visits.push({
        treatment_id: treatmentId,
        pharmacy_id: formData.pharmacyId,
        visit_date: format(visitDate, "yyyy-MM-dd"),
        visit_number: i + 1,
        is_completed: false,
      });
    }
  }

  return visits;
};
