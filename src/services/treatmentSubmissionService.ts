import { supabase } from "@/integrations/supabase/client";
import { TreatmentFormData, MedicationItem } from "@/components/TreatmentWizard/types";
import {
  buildPrescriptionData,
  buildTreatmentData,
  buildMedicationsData,
  buildPharmacyVisitsData,
} from "@/components/TreatmentWizard/utils/treatmentDataBuilders";

/**
 * Type Result pour gérer les succès et erreurs de manière typée
 */
export type SubmissionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: Error };

/**
 * Données de réponse après soumission réussie
 */
export interface TreatmentSubmissionResponse {
  prescriptionId: string;
  treatmentId: string;
}

/**
 * Service centralisé pour la soumission de traitements
 * Gère toute la logique de persistence en base de données
 */
export class TreatmentSubmissionService {
  /**
   * Upload un fichier de prescription vers Supabase Storage
   */
  private async uploadPrescriptionFile(
    userId: string,
    prescriptionId: string,
    file: File,
    fileName: string
  ): Promise<void> {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('prescriptions')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Mettre à jour la prescription avec le fichier
    const { error: updateError } = await supabase
      .from("prescriptions")
      .update({
        file_path: filePath,
        original_filename: fileName,
      })
      .eq('id', prescriptionId);

    if (updateError) throw updateError;
  }

  /**
   * Crée une nouvelle prescription en base de données
   */
  private async createPrescription(
    userId: string,
    formData: TreatmentFormData
  ): Promise<string> {
    const prescriptionData = buildPrescriptionData(userId, formData);
    
    const { data: prescData, error: prescError } = await supabase
      .from("prescriptions")
      .insert(prescriptionData)
      .select()
      .single();

    if (prescError) throw prescError;
    return prescData.id;
  }

  /**
   * Crée ou récupère l'ID de la prescription
   * Upload le fichier si présent
   */
  private async ensurePrescriptionExists(
    userId: string,
    formData: TreatmentFormData
  ): Promise<string> {
    let prescriptionId = formData.prescriptionId;

    // Créer une prescription si elle n'existe pas
    if (!prescriptionId) {
      prescriptionId = await this.createPrescription(userId, formData);
    }

    // Upload du fichier si présent
    if (formData.prescriptionFile && prescriptionId) {
      await this.uploadPrescriptionFile(
        userId,
        prescriptionId,
        formData.prescriptionFile,
        formData.prescriptionFileName
      );
    }

    return prescriptionId;
  }

  /**
   * Crée le traitement principal
   */
  private async createTreatment(
    userId: string,
    prescriptionId: string,
    formData: TreatmentFormData
  ): Promise<string> {
    const treatmentData = buildTreatmentData(userId, prescriptionId, formData);
    
    const { data: treatment, error: treatmentError } = await supabase
      .from("treatments")
      .insert(treatmentData)
      .select()
      .single();

    if (treatmentError) throw treatmentError;
    return treatment.id;
  }

  /**
   * Insère les médicaments personnalisés en attente dans le catalogue
   * et met à jour les catalogId correspondants
   */
  private async insertPendingCustomMedications(
    formData: TreatmentFormData
  ): Promise<MedicationItem[]> {
    const updatedMedications: MedicationItem[] = [];

    for (const med of formData.medications) {
      if (med.pendingInsertion) {
        // 1. Créer la pathologie si elle n'existe pas
        if (med.pendingPathology) {
          const { data: existingPathology } = await supabase
            .from("pathologies")
            .select("id")
            .ilike("name", med.pendingPathology)
            .maybeSingle();

          if (!existingPathology) {
            await supabase
              .from("pathologies")
              .insert({ name: med.pendingPathology });
          }
        }

        // 2. Insérer le médicament dans le catalogue
        const { data: catalogData } = await supabase
          .from("medication_catalog")
          .insert({
            name: med.name,
            pathology: med.pathology || null,
            default_posology: med.posology || null,
            strength: med.strength || null,
            default_times: med.times
          })
          .select()
          .single();

        if (catalogData) {
          // Mettre à jour avec le catalogId réel
          updatedMedications.push({
            ...med,
            catalogId: catalogData.id,
            pendingInsertion: false,
            pendingPathology: undefined,
          });
        }
      } else {
        // Médicament déjà du catalogue, pas de modification
        updatedMedications.push(med);
      }
    }

    return updatedMedications;
  }

  /**
   * Crée les médicaments associés au traitement
   */
  private async createMedications(
    treatmentId: string,
    formData: TreatmentFormData
  ): Promise<void> {
    const medicationsData = buildMedicationsData(treatmentId, formData);
    
    const { error: medError } = await supabase
      .from("medications")
      .insert(medicationsData);

    if (medError) throw medError;
  }

  /**
   * Crée les visites à la pharmacie si nécessaire
   */
  private async createPharmacyVisits(
    treatmentId: string,
    formData: TreatmentFormData
  ): Promise<void> {
    const visitsData = buildPharmacyVisitsData(treatmentId, formData);
    
    if (visitsData.length > 0) {
      const { error: visitsError } = await supabase
        .from("pharmacy_visits")
        .insert(visitsData);

      if (visitsError) throw visitsError;
    }
  }

  /**
   * Valide les données du formulaire avant soumission
   */
  private validateFormData(formData: TreatmentFormData): { isValid: boolean; error?: Error } {
    if (!formData.medications || formData.medications.length === 0) {
      return { 
        isValid: false, 
        error: new Error("Aucun médicament ajouté") 
      };
    }

    if (!formData.prescriptionDate) {
      return { 
        isValid: false, 
        error: new Error("Date de prescription manquante") 
      };
    }

    if (!formData.durationDays || parseInt(formData.durationDays) <= 0) {
      return { 
        isValid: false, 
        error: new Error("Durée du traitement invalide") 
      };
    }

    return { isValid: true };
  }

  /**
   * Soumission complète d'un traitement
   * Point d'entrée principal du service
   * 
   * @param userId - ID de l'utilisateur authentifié
   * @param formData - Données du formulaire de traitement
   * @returns Result avec les IDs créés ou une erreur
   */
  async submitTreatment(
    userId: string,
    formData: TreatmentFormData
  ): Promise<SubmissionResult<TreatmentSubmissionResponse>> {
    try {
      // 1. Validation
      const validationResult = this.validateFormData(formData);
      if (!validationResult.isValid) {
        return { 
          success: false, 
          error: validationResult.error! 
        };
      }

      // 2. Créer ou récupérer la prescription
      const prescriptionId = await this.ensurePrescriptionExists(userId, formData);

      // 3. Insérer les médicaments personnalisés en attente dans le catalogue
      const updatedMedications = await this.insertPendingCustomMedications(formData);
      const updatedFormData = { ...formData, medications: updatedMedications };

      // 4. Créer le traitement
      const treatmentId = await this.createTreatment(userId, prescriptionId, updatedFormData);

      // 5. Créer les médicaments
      await this.createMedications(treatmentId, updatedFormData);

      // 6. Créer les visites pharmacie
      await this.createPharmacyVisits(treatmentId, updatedFormData);

      // 7. Retour succès
      return {
        success: true,
        data: {
          prescriptionId,
          treatmentId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

/**
 * Instance singleton du service
 * À utiliser dans toute l'application
 */
export const treatmentSubmissionService = new TreatmentSubmissionService();
