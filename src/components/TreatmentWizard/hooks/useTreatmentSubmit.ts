import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getAuthenticatedUser } from "@/lib/auth-guard";
import { TreatmentFormData } from "../types";
import { treatmentSubmissionService } from "@/services/treatmentSubmissionService";
import {
  handleAuthError,
  handleSubmitError,
  handleValidationError,
  handleSubmitSuccess,
} from "../utils/errorHandlers";

interface UseTreatmentSubmitReturn {
  loading: boolean;
  handleSubmit: () => Promise<void>;
}

/**
 * Hook personnalisé pour gérer la soumission du formulaire de traitement
 * Délègue la logique de persistence au treatmentSubmissionService
 */
export const useTreatmentSubmit = (
  formData: TreatmentFormData,
  canSubmit: () => boolean
): UseTreatmentSubmitReturn => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /**
   * Soumission complète du traitement
   */
  const handleSubmit = async (): Promise<void> => {
    // Validation côté UI
    if (!canSubmit()) {
      handleValidationError(toast);
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Authentification
      const { data: user, error: authError } = await getAuthenticatedUser();
      if (authError || !user) {
        handleAuthError(toast, authError?.message);
        return;
      }

      // 2. Déléguer la soumission au service
      const result = await treatmentSubmissionService.submitTreatment(user.id, formData);

      // 3. Gérer le résultat
      if (!result.success) {
        // Type narrowing: ici result est de type { success: false; error: Error }
        const errorResult = result as { success: false; error: Error };
        throw errorResult.error;
      }

      // 4. Succès (Type narrowing: ici result.data est disponible)
      handleSubmitSuccess(toast);
      navigate("/");
      
    } catch (error) {
      handleSubmitError(toast, error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleSubmit,
  };
};
