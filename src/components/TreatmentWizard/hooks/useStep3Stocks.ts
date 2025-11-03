import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TreatmentFormData } from "../types";
import { getAuthenticatedUser } from "@/lib/auth-guard";

interface UseStep3StocksProps {
  formData: TreatmentFormData;
  setFormData: (data: TreatmentFormData) => void;
}

export function useStep3Stocks({ formData, setFormData }: UseStep3StocksProps) {
  const [loadingStocks, setLoadingStocks] = useState(true);

  useEffect(() => {
    loadExistingStocks();
  }, [formData.medications]);

  const loadExistingStocks = async () => {
    setLoadingStocks(true);
    try {
      const { data: user, error } = await getAuthenticatedUser();
      if (error || !user) {
        console.warn('[useStep3Stocks] Utilisateur non authentifié:', error?.message);
        setLoadingStocks(false);
        return;
      }

      // Récupérer tous les médicaments actifs de l'utilisateur
      const { data: existingMedications } = await supabase
        .from("medications")
        .select(`
          name,
          current_stock,
          min_threshold,
          treatments!inner(user_id, is_active)
        `)
        .eq("treatments.user_id", user.id)
        .eq("treatments.is_active", true);

      if (existingMedications) {
        const newStocks = { ...formData.stocks };
        const updatedMedications = [...formData.medications];
        let hasChanges = false;

        formData.medications.forEach((med, index) => {
          // Chercher le médicament existant par nom
          const existing = existingMedications.find(
            (em) => em.name.toLowerCase() === med.name.toLowerCase()
          );

          if (existing) {
            // Pré-remplir avec le stock actuel existant
            if (!(index in newStocks) || newStocks[index] === 0) {
              newStocks[index] = existing.current_stock || 0;
              hasChanges = true;
            }
            // Mettre à jour le seuil d'alerte si non défini
            if (updatedMedications[index].minThreshold === 10 && existing.min_threshold) {
              updatedMedications[index].minThreshold = existing.min_threshold;
              hasChanges = true;
            }
          } else {
            // Initialiser à 0 si pas trouvé
            if (!(index in newStocks)) {
              newStocks[index] = 0;
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          setFormData({ 
            ...formData, 
            stocks: newStocks,
            medications: updatedMedications 
          });
        }
      }
    } catch (error) {
      console.error("Error loading existing stocks:", error);
    } finally {
      setLoadingStocks(false);
    }
  };

  const updateStock = (index: number, value: number) => {
    setFormData({
      ...formData,
      stocks: { ...formData.stocks, [index]: value },
    });
  };

  const updateThreshold = (index: number, value: number) => {
    const updated = [...formData.medications];
    updated[index].minThreshold = value;
    setFormData({ ...formData, medications: updated });
  };

  const hasEmptyStocks = formData.medications.some((_, index) => 
    !formData.stocks[index] || formData.stocks[index] === 0
  );

  return {
    loadingStocks,
    hasEmptyStocks,
    updateStock,
    updateThreshold,
  };
}
