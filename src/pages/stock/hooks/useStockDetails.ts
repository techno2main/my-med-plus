import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getStockStatus, calculateEstimatedDays } from "../utils/stockUtils";

export function useStockDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medication, setMedication] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadMedication(id);
    }
  }, [id]);

  const loadMedication = async (medicationId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("medications")
        .select(
          `
          *,
          medication_catalog(strength, default_posology)
        `
        )
        .eq("id", medicationId)
        .single();

      if (error) throw error;

      setMedication(data);
    } catch (error: any) {
      toast.error("Erreur lors du chargement du médicament");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStock = medication?.current_stock || 0;
  const minThreshold = medication?.min_threshold || 10;
  const takesPerDay = medication?.takes_per_day || 1;
  const unitsPerTake = medication?.units_per_take || 1;

  const status = getStockStatus(currentStock, minThreshold);
  const estimatedDays = calculateEstimatedDays(currentStock, takesPerDay, unitsPerTake);

  const handleAdjust = () => {
    navigate(`/stock/adjust?id=${id}`);
  };

  return {
    medication,
    currentStock,
    minThreshold,
    takesPerDay,
    unitsPerTake,
    status,
    estimatedDays,
    isLoading,
    handleAdjust,
    handleBack: () => navigate("/stock"),
  };
}
