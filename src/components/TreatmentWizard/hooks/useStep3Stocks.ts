import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TreatmentFormData } from "../types";
import { getAuthenticatedUser } from "@/lib/auth-guard";
import { applyStockUpdates } from "../utils/stockHelpers";

interface UseStep3StocksProps {
  formData: TreatmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<TreatmentFormData>>;
}

export function useStep3Stocks({ formData, setFormData }: UseStep3StocksProps) {
  const [loadingStocks, setLoadingStocks] = useState(true);
  const loadedMedicationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadExistingStocks();
  }, [formData.medications]);

  const loadExistingStocks = async () => {
    // Identifier les nouveaux médicaments (non encore chargés)
    const currentMedNames = formData.medications.map(m => m.name);
    const newMedications = formData.medications.filter(
      (med) => !loadedMedicationsRef.current.has(med.name)
    );

    // Si aucun nouveau médicament, ne rien faire
    if (newMedications.length === 0) {
      setLoadingStocks(false);
      return;
    }

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

      // Early return si pas de données
      if (!existingMedications) {
        setLoadingStocks(false);
        // Marquer les nouveaux médicaments comme chargés même si pas de données
        newMedications.forEach(med => loadedMedicationsRef.current.add(med.name));
        return;
      }

      // Appliquer les mises à jour de stocks avec les utilitaires
      setFormData((prev) => {
        const { newStocks, updatedMedications, hasChanges } = applyStockUpdates(
          prev.medications,
          prev.stocks,
          existingMedications
        );

        if (hasChanges) {
          return { 
            ...prev, 
            stocks: newStocks,
            medications: updatedMedications 
          };
        }
        return prev;
      });

      // Marquer les nouveaux médicaments comme chargés
      newMedications.forEach(med => loadedMedicationsRef.current.add(med.name));

    } catch (error) {
      console.error("Error loading existing stocks:", error);
    } finally {
      setLoadingStocks(false);
    }
  };

  const updateStock = (index: number, value: number) => {
    setFormData((prev) => ({
      ...prev,
      stocks: { ...prev.stocks, [index]: value },
    }));
  };

  const updateThreshold = (index: number, value: number) => {
    setFormData((prev) => {
      const updated = [...prev.medications];
      updated[index].minThreshold = value;
      return { ...prev, medications: updated };
    });
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
