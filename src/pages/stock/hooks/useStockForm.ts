import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseAdjustment, calculateNewStock } from "../utils/stockUtils";

export function useStockForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const medicationId = searchParams.get("id");

  const [medication, setMedication] = useState<any>(null);
  const [adjustmentStr, setAdjustmentStr] = useState("");
  const [minThreshold, setMinThreshold] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (medicationId) {
      loadMedication(medicationId);
    }
  }, [medicationId]);

  const loadMedication = async (id: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("medications")
        .select("*, medication_catalog(strength, default_posology)")
        .eq("id", id)
        .single();

      if (error) throw error;

      setMedication(data);
      setMinThreshold(data.min_threshold || 10);
    } catch (error: any) {
      toast.error("Erreur lors du chargement du médicament");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const adjustment = parseAdjustment(adjustmentStr);
  const currentStock = medication?.current_stock || 0;
  const newStock = calculateNewStock(currentStock, adjustment);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!medication || adjustment === 0) {
      toast.error("Ajustement invalide");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("medications")
        .update({
          current_stock: newStock,
          min_threshold: minThreshold,
        })
        .eq("id", medication.id);

      if (error) throw error;

      toast.success("Stock mis à jour");
      navigate("/stock");
    } catch (error: any) {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    medication,
    currentStock,
    adjustmentStr,
    setAdjustmentStr,
    adjustment,
    newStock,
    minThreshold,
    setMinThreshold,
    isLoading,
    handleSubmit,
    handleCancel: () => navigate("/stock"),
  };
}
