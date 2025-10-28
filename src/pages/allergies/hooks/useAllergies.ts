import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Allergy } from "../utils/allergyUtils";

export function useAllergies() {
  const queryClient = useQueryClient();

  const { data: allergies = [], isLoading } = useQuery({
    queryKey: ["allergies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("allergies")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Allergy[];
    },
  });

  const createAllergy = async (name: string, severity: string, description: string) => {
    try {
      const { error } = await supabase
        .from("allergies")
        .insert({
          name,
          severity: severity || null,
          description: description || null,
        });

      if (error) throw error;

      toast.success("Allergie ajoutée avec succès");
      queryClient.invalidateQueries({ queryKey: ["allergies"] });
      return true;
    } catch (error) {
      console.error("Error creating allergy:", error);
      toast.error("Erreur lors de l'enregistrement");
      return false;
    }
  };

  const updateAllergy = async (id: string, name: string, severity: string, description: string) => {
    try {
      const { error } = await supabase
        .from("allergies")
        .update({
          name,
          severity: severity || null,
          description: description || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Allergie modifiée avec succès");
      queryClient.invalidateQueries({ queryKey: ["allergies"] });
      return true;
    } catch (error) {
      console.error("Error updating allergy:", error);
      toast.error("Erreur lors de l'enregistrement");
      return false;
    }
  };

  const deleteAllergy = async (id: string) => {
    try {
      const { error } = await supabase.from("allergies").delete().eq("id", id);

      if (error) throw error;

      toast.success("Allergie supprimée");
      queryClient.invalidateQueries({ queryKey: ["allergies"] });
      return true;
    } catch (error) {
      console.error("Error deleting allergy:", error);
      toast.error("Erreur lors de la suppression");
      return false;
    }
  };

  return {
    allergies,
    isLoading,
    createAllergy,
    updateAllergy,
    deleteAllergy,
  };
}
