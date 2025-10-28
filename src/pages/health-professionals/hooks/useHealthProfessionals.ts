import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { HealthProfessional } from "../utils/professionalUtils";

export function useHealthProfessionals() {
  const queryClient = useQueryClient();

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["health-professionals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_professionals")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as HealthProfessional[];
    },
  });

  const createProfessional = async (formData: Omit<HealthProfessional, "id" | "user_id">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await supabase.from("health_professionals").insert({
        name: formData.name,
        type: formData.type,
        specialty: formData.specialty || null,
        phone: formData.phone || null,
        email: formData.email || null,
        street_address: formData.street_address || null,
        postal_code: formData.postal_code || null,
        city: formData.city || null,
        is_primary_doctor: formData.is_primary_doctor || false,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Professionnel ajouté avec succès");
      queryClient.invalidateQueries({ queryKey: ["health-professionals"] });
      return true;
    } catch (error) {
      console.error("Error creating professional:", error);
      toast.error("Erreur lors de l'enregistrement");
      return false;
    }
  };

  const updateProfessional = async (
    id: string,
    formData: Omit<HealthProfessional, "id" | "user_id">
  ) => {
    try {
      const { error } = await supabase
        .from("health_professionals")
        .update({
          name: formData.name,
          type: formData.type,
          specialty: formData.specialty || null,
          phone: formData.phone || null,
          email: formData.email || null,
          street_address: formData.street_address || null,
          postal_code: formData.postal_code || null,
          city: formData.city || null,
          is_primary_doctor: formData.is_primary_doctor || false,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Professionnel modifié avec succès");
      queryClient.invalidateQueries({ queryKey: ["health-professionals"] });
      return true;
    } catch (error) {
      console.error("Error updating professional:", error);
      toast.error("Erreur lors de l'enregistrement");
      return false;
    }
  };

  const deleteProfessional = async (id: string) => {
    try {
      const { error } = await supabase.from("health_professionals").delete().eq("id", id);

      if (error) throw error;

      toast.success("Professionnel supprimé");
      queryClient.invalidateQueries({ queryKey: ["health-professionals"] });
      return true;
    } catch (error) {
      console.error("Error deleting professional:", error);
      toast.error("Erreur lors de la suppression");
      return false;
    }
  };

  return {
    professionals,
    isLoading,
    createProfessional,
    updateProfessional,
    deleteProfessional,
  };
}
