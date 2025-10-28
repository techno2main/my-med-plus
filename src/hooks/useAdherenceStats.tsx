import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdherenceStats {
  takenOnTime: number;
  skipped: number;
  lateIntakes: number;
  adherence7Days: number;
  adherence30Days: number;
  total7Days: number;
  total30Days: number;
}

/**
 * Hook pour calculer les statistiques d'observance de manière cohérente
 * - Les compteurs (À l'heure, En retard, Manquées) portent sur TOUT l'historique
 * - L'observance (%) est calculée sur 7 ou 30 jours
 */
export const useAdherenceStats = () => {
  const [stats, setStats] = useState<AdherenceStats>({
    takenOnTime: 0,
    skipped: 0,
    lateIntakes: 0,
    adherence7Days: 0,
    adherence30Days: 0,
    total7Days: 0,
    total30Days: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Charger tous les intakes (tout l'historique) UNIQUEMENT pour traitements actifs
      const { data: intakesData, error } = await supabase
        .from("medication_intakes")
        .select(`
          id,
          medication_id,
          scheduled_time,
          taken_at,
          status,
          medications!inner (
            treatment_id,
            treatments!inner(user_id, is_active)
          )
        `)
        .eq("medications.treatments.is_active", true)
        .order("scheduled_time", { ascending: false });

      if (error) throw error;

      // Définir les périodes
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);

      // Filtrer TOUS les intakes passés (taken ou skipped) pour les stats globales
      const allPastIntakes = (intakesData || []).filter(i => {
        const scheduledTime = new Date(i.scheduled_time);
        return scheduledTime <= now && 
               (i.status === 'taken' || i.status === 'skipped');
      });

      // Filtrer par 7 jours pour l'observance
      const intakes7Days = (intakesData || []).filter(i => {
        const scheduledTime = new Date(i.scheduled_time);
        return scheduledTime >= sevenDaysAgo && 
               (i.status === 'taken' || i.status === 'skipped');
      });

      // Filtrer par 30 jours pour l'observance
      const intakes30Days = (intakesData || []).filter(i => {
        const scheduledTime = new Date(i.scheduled_time);
        return scheduledTime >= thirtyDaysAgo && 
               (i.status === 'taken' || i.status === 'skipped');
      });

      // Calculer les prises à l'heure (≤30min) - TOUT l'historique
      const takenOnTimeAll = allPastIntakes.filter(i => {
        if (i.status !== 'taken' || !i.taken_at) return false;
        const scheduledTime = new Date(i.scheduled_time);
        const takenTime = new Date(i.taken_at);
        const differenceMinutes = (takenTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
        return differenceMinutes <= 30;
      }).length;

      // Calculer les prises manquées - TOUT l'historique
      const skippedAll = allPastIntakes.filter(i => i.status === 'skipped').length;

      // Calculer les prises en retard (>30min) - TOUT l'historique
      const lateIntakesAll = allPastIntakes.filter(i => {
        if (i.status !== 'taken' || !i.taken_at) return false;
        const scheduledTime = new Date(i.scheduled_time);
        const takenTime = new Date(i.taken_at);
        const differenceMinutes = (takenTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
        return differenceMinutes > 30;
      }).length;

      // Calculer l'observance pour 7 jours
      const taken7 = intakes7Days.filter(i => i.status === 'taken').length;
      const total7 = intakes7Days.length;

      // Calculer l'observance pour 30 jours
      const taken30 = intakes30Days.filter(i => i.status === 'taken').length;
      const total30 = intakes30Days.length;

      setStats({
        takenOnTime: takenOnTimeAll,
        skipped: skippedAll,
        lateIntakes: lateIntakesAll,
        adherence7Days: total7 > 0 ? Math.round((taken7 / total7) * 100) : 0,
        adherence30Days: total30 > 0 ? Math.round((taken30 / total30) * 100) : 0,
        total7Days: total7,
        total30Days: total30,
      });
    } catch (error) {
      console.error("Error loading adherence stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return { stats, loading, reload: loadStats };
};
