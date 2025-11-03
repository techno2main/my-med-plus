import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUser } from "@/lib/auth-guard";
import { toast } from "sonner";
import type { Pathology } from "../utils/pathologyUtils";

export function usePathologies() {
  const queryClient = useQueryClient();

  const { data: pathologies = [], isLoading } = useQuery({
    queryKey: ["pathologies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pathologies")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Pathology[];
    },
  });

  const createPathology = async (name: string, description: string) => {
    try {
      const { data: user, error } = await getAuthenticatedUser();
      if (error) {
        console.warn('[usePathologies] Utilisateur non authentifié:', error.message);
      }
      
      const { error: insertError } = await supabase
        .from("pathologies")
        .insert({
          name,
          description: description || null,
          created_by: user?.id,
          is_approved: false,
        });

      if (insertError) throw insertError;

      toast.success("Pathologie ajoutée avec succès");
      queryClient.invalidateQueries({ queryKey: ["pathologies"] });
      return true;
    } catch (error) {
      console.error("Error creating pathology:", error);
      toast.error("Erreur lors de l'enregistrement");
      return false;
    }
  };

  const updatePathology = async (id: string, name: string, description: string) => {
    try {
      const { error } = await supabase
        .from("pathologies")
        .update({
          name,
          description: description || null,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Pathologie modifiée avec succès");
      queryClient.invalidateQueries({ queryKey: ["pathologies"] });
      return true;
    } catch (error) {
      console.error("Error updating pathology:", error);
      toast.error("Erreur lors de l'enregistrement");
      return false;
    }
  };

  const deletePathology = async (id: string) => {
    try {
      const { error } = await supabase.from("pathologies").delete().eq("id", id);

      if (error) throw error;

      toast.success("Pathologie supprimée");
      queryClient.invalidateQueries({ queryKey: ["pathologies"] });
      return true;
    } catch (error) {
      console.error("Error deleting pathology:", error);
      toast.error("Erreur lors de la suppression");
      return false;
    }
  };

  return {
    pathologies,
    isLoading,
    createPathology,
    updatePathology,
    deletePathology,
  };
}
