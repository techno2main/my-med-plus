import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getStockStatus } from "../utils/stockUtils";

export function useStock() {
  const navigate = useNavigate();

  // Récupération des médicaments depuis les traitements actifs
  const { data: medications, isLoading } = useQuery({
    queryKey: ["medications-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medications")
        .select(
          `
          *,
          treatments!inner(is_active),
          medication_catalog(strength, default_posology)
        `
        )
        .eq("treatments.is_active", true)
        .order("name");

      if (error) throw error;

      return data;
    },
  });

  const stockItems =
    medications?.map((med) => ({
      ...med,
      medication: med.name,
      dosage: med.medication_catalog?.strength || med.medication_catalog?.default_posology || "",
      unit: "unités",
      status: getStockStatus(med.current_stock || 0, med.min_threshold || 10),
    })) || [];

  const lowStockCount = stockItems.filter((item) => item.status === "low" || item.status === "critical").length;

  const handleAdjust = (id: string) => {
    navigate(`/stock/adjust?id=${id}`);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/stock/${id}`);
  };

  return {
    stockItems,
    lowStockCount,
    isLoading,
    handleAdjust,
    handleViewDetails,
  };
}
