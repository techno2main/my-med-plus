import { useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

const REGENERATION_DELAY = 6 * 60 * 60 * 1000; // 6 heures en millisecondes
const STORAGE_KEY = 'last_intakes_regeneration';

export function useAutoRegenerateIntakes() {
  const isRegenerating = useRef(false);

  const shouldRegenerate = (): boolean => {
    const lastRegeneration = localStorage.getItem(STORAGE_KEY);
    if (!lastRegeneration) return true;

    const timeSinceLastRegen = Date.now() - parseInt(lastRegeneration);
    return timeSinceLastRegen >= REGENERATION_DELAY;
  };

  const regenerateAllIntakes = async () => {
    if (isRegenerating.current) return;
    if (!shouldRegenerate()) return;

    // Vérifier qu'une session existe avant de faire l'appel
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('Pas de session active, régénération annulée');
      return;
    }

    isRegenerating.current = true;

    try {
      // Appeler la fonction PostgreSQL uniquement pour les médicaments des traitements ACTIFS
      const { data: medications, error: medError } = await supabase
        .from('medications')
        .select(`
          id,
          treatments!inner(is_active)
        `)
        .not('times', 'is', null)
        .eq('treatments.is_active', true);

      if (medError) throw medError;

      // Régénérer pour chaque médicament
      for (const med of medications || []) {
        const { error } = await supabase.rpc('regenerate_future_intakes' as any, {
          med_id: med.id
        });
        
        if (error) {
          console.error(`Erreur régénération pour ${med.id}:`, error);
        }
      }

      // Sauvegarder le timestamp de la dernière régénération
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      console.log('Prises futures régénérées avec succès');
      
    } catch (error) {
      console.error('Erreur lors de la régénération automatique:', error);
    } finally {
      isRegenerating.current = false;
    }
  };

  useEffect(() => {
    // Ne fonctionner que sur plateforme native
    if (!Capacitor.isNativePlatform()) return;

    // Régénérer au lancement de l'app
    regenerateAllIntakes();

    // Écouter les changements d'état de l'app
    let stateListener: any;
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // L'app revient au premier plan
        regenerateAllIntakes();
      }
    }).then(listener => {
      stateListener = listener;
    });

    return () => {
      if (stateListener) {
        stateListener.remove();
      }
    };
  }, []);
}
