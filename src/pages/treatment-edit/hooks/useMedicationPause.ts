import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook pour gérer la pause/reprise d'un médicament
 * - Met en pause : supprime les prises futures
 * - Réactive : régénère les prises pour 7 jours
 */
export function useMedicationPause() {
  const [loading, setLoading] = useState(false);

  const togglePause = async (
    medicationId: string,
    currentIsPaused: boolean,
    medicationName: string
  ): Promise<boolean> => {
    setLoading(true);
    
    try {
      const newIsPaused = !currentIsPaused;

      // 1. Mettre à jour le statut is_paused dans la table medications
      const { error: updateError } = await supabase
        .from('medications')
        .update({ is_paused: newIsPaused })
        .eq('id', medicationId);

      if (updateError) throw updateError;

      // 2. Si on met en pause : supprimer les prises futures
      if (newIsPaused) {
        const { error: deleteFutureError } = await supabase
          .rpc('delete_future_intakes_on_pause', { med_id: medicationId });

        if (deleteFutureError) {
          console.error('[useMedicationPause] Erreur suppression prises futures:', deleteFutureError);
          // Ne pas bloquer si erreur, juste logger
        }

        toast.success(`${medicationName} mis en pause`, {
          description: "Les prises futures ont été supprimées"
        });
      } 
      // 3. Si on réactive : régénérer les prises futures (7 jours)
      else {
        const { error: regenerateError } = await supabase
          .rpc('regenerate_future_intakes', { med_id: medicationId });

        if (regenerateError) {
          console.error('[useMedicationPause] Erreur régénération prises:', regenerateError);
          // Ne pas bloquer si erreur, juste logger
        }

        toast.success(`${medicationName} réactivé`, {
          description: "Les prises ont été régénérées pour 7 jours"
        });
      }

      return true;
    } catch (error) {
      console.error('[useMedicationPause] Erreur toggle pause:', error);
      toast.error("Erreur lors de la modification du statut");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    togglePause,
    loading
  };
}
