import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationSystem } from "./useNotificationSystem";
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { toast } from "sonner";
import { parseISO } from 'date-fns';
import { getAuthenticatedUser } from "@/lib/auth-guard";

// Mode debug pour les logs détaillés (false en production)
const DEBUG_NOTIFICATIONS = import.meta.env.DEV && false; // Mettre à true pour déboguer

/**
 * Génère un ID numérique unique à partir d'une chaîne
 */
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};

/**
 * Hook pour planifier automatiquement les notifications de rappel de prise
 * Se base sur medication_intakes et les préférences utilisateur
 */
export const useMedicationNotificationScheduler = () => {
  const { 
    preferences, 
    hasPermission, 
    isSupported,
    mode 
  } = useNotificationSystem();
  
  const scheduledNotificationsRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelCreatedRef = useRef(false);

  // Charger le cache depuis localStorage au démarrage
  useEffect(() => {
    const savedCache = localStorage.getItem('scheduled_notifications_cache');
    if (savedCache) {
      try {
        const parsed = JSON.parse(savedCache);
        scheduledNotificationsRef.current = new Set(parsed);
        if (DEBUG_NOTIFICATIONS) {
          console.log(`📦 Cache restauré: ${parsed.length} notifications`);
        }
      } catch (error) {
        console.error("Erreur chargement cache:", error);
      }
    }
  }, []);

  // Créer le canal de notification Android au premier chargement
  useEffect(() => {
    const createNotificationChannel = async () => {
      if (Capacitor.isNativePlatform() && !channelCreatedRef.current) {
        try {
          await LocalNotifications.createChannel({
            id: 'medication-reminders',
            name: 'Rappels de médicaments',
            description: 'Notifications pour vos rappels de prise',
            importance: 5, // Max importance pour garantir la livraison
            visibility: 1,
            sound: 'beep.wav',
            vibration: true,
            lights: true,
            lightColor: '#488AFF'
          });
          channelCreatedRef.current = true;
          if (DEBUG_NOTIFICATIONS) {
            console.log("✅ Canal de notification créé");
          }
        } catch (error) {
          console.error("❌ Erreur création canal:", error);
        }
      }
    };
    
    createNotificationChannel();
  }, []);

  // Détecter les changements de délais - DÉSACTIVÉ pour éviter les toasts
  // L'utilisateur doit manuellement replanifier si besoin
  /*
  const previousDelaysRef = useRef({
    before: preferences.medicationReminderBefore,
    after: preferences.medicationReminderDelay
  });

  useEffect(() => {
    const delaysChanged = 
      previousDelaysRef.current.before !== preferences.medicationReminderBefore ||
      previousDelaysRef.current.after !== preferences.medicationReminderDelay;

    if (delaysChanged && hasPermission && preferences.medicationReminders) {
      console.log("⚙️ Délais modifiés");
      rescheduleAll(false);
      previousDelaysRef.current = {
        before: preferences.medicationReminderBefore,
        after: preferences.medicationReminderDelay
      };
    }
  }, [preferences.medicationReminderBefore, preferences.medicationReminderDelay, hasPermission, preferences.medicationReminders]);
  */

  useEffect(() => {
    // Vérifier si on peut planifier des notifications
    const canSchedule = isSupported && 
                       (mode === 'native' ? hasPermission : true) &&
                       preferences.pushEnabled && 
                       preferences.medicationReminders;

    if (!canSchedule) {
      if (DEBUG_NOTIFICATIONS) {
        console.log("❌ Planification automatique désactivée:", {
          isSupported,
          hasPermission,
          pushEnabled: preferences.pushEnabled,
          medicationReminders: preferences.medicationReminders
        });
      }
      
      // Nettoyer les notifications existantes si désactivé
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (DEBUG_NOTIFICATIONS) {
      console.log("✅ Planification automatique activée - Mode:", mode);
    }

    // Planifier immédiatement au démarrage (SANS toasts)
    scheduleUpcomingNotifications(false);

    // NE PLUS replanifier automatiquement toutes les 5 min
    // L'utilisateur doit cliquer sur 🔄 pour forcer une replanification
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [preferences.pushEnabled, preferences.medicationReminders, hasPermission, isSupported, mode]);

  /**
   * Planifie les notifications pour toutes les prises à venir dans les prochaines 24h
   */
  const scheduleUpcomingNotifications = useCallback(async (showToasts: boolean = false) => {
    try {
      // Logs uniquement en mode debug
      if (DEBUG_NOTIFICATIONS) {
        console.log("🔔 ========== DÉBUT PLANIFICATION ==========");
        console.log("🔔 Recherche des prises à planifier...");
        console.log("🔔 Préférences:", {
          pushEnabled: preferences.pushEnabled,
          medicationReminders: preferences.medicationReminders,
          reminderBefore: preferences.medicationReminderBefore,
          reminderDelay: preferences.medicationReminderDelay
        });
      }
      
      // Vérifier qu'on a un utilisateur connecté
      const { data: user, error: authError } = await getAuthenticatedUser();
      if (authError || !user) {
        if (DEBUG_NOTIFICATIONS) {
          console.warn('[useMedicationNotificationScheduler] Utilisateur non authentifié:', authError?.message);
        }
        return;
      }
      
      if (DEBUG_NOTIFICATIONS) {
        console.log("✅ Utilisateur connecté:", user.id);
      }
      
      // Récupérer les prises pending dans les prochaines 24h
      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      if (DEBUG_NOTIFICATIONS) {
        console.log("🔍 Recherche prises entre:", {
          now: now.toISOString(),
          next24h: next24h.toISOString(),
          nowLocal: now.toLocaleString('fr-FR'),
          next24hLocal: next24h.toLocaleString('fr-FR')
        });
      }

      const { data: upcomingIntakes, error} = await supabase
        .from("medication_intakes")
        .select(`
          id,
          medication_id,
          scheduled_time,
          status,
          medications!inner (
            name,
            treatment_id,
            treatments!inner (
              user_id,
              is_active
            ),
            medication_catalog (
              strength,
              default_posology
            )
          )
        `)
        .eq("status", "pending")
        .eq("medications.treatments.is_active", true)
        .gte("scheduled_time", now.toISOString())
        .lte("scheduled_time", next24h.toISOString())
        .order("scheduled_time", { ascending: true });

      if (error) {
        console.error("❌ Erreur chargement prises:", error);
        if (showToasts) toast.error(`Erreur BDD: ${error.message}`);
        return;
      }
      
      if (DEBUG_NOTIFICATIONS) {
        console.log("📋 Prises trouvées (brut):", upcomingIntakes?.length || 0);
      }
      
      // Filtrer pour garder seulement les prises de l'utilisateur connecté
      const userIntakes = upcomingIntakes?.filter((intake: any) => 
        intake.medications?.treatments?.user_id === user.id
      ) || [];

      if (DEBUG_NOTIFICATIONS) {
        console.log(`📋 ${userIntakes.length} prises de l'utilisateur`, userIntakes.map((i: any) => ({
          id: i.id,
          medication: i.medications?.name,
          scheduledTime: i.scheduled_time,
          scheduledLocal: new Date(i.scheduled_time).toLocaleString('fr-FR')
        })));
      }
      
      if (userIntakes.length === 0) {
        if (DEBUG_NOTIFICATIONS) {
          console.log("⚠️ Aucune prise trouvée dans les 24h");
        }
        if (showToasts) toast.info("Aucune prise à planifier dans les 24h");
        return;
      }

      // Planifier une notification pour chaque prise
      let successCount = 0;
      for (const intake of userIntakes) {
        if (DEBUG_NOTIFICATIONS) {
          console.log(`\n📌 Traitement de la prise ${intake.id} - ${intake.medications?.name}`);
        }
        const result = await scheduleNotificationForIntake(intake);
        if (result) successCount++;
      }
      
      if (DEBUG_NOTIFICATIONS) {
        console.log(`\n✅ ${successCount}/${userIntakes.length} prises planifiées avec succès`);
        console.log("🔔 ========== FIN PLANIFICATION ==========\n");
      }
      
      if (showToasts) toast.success(`${successCount} prises planifiées`);

    } catch (error) {
      console.error("❌ Erreur planification notifications:", error);
      if (showToasts) toast.error(`Erreur: ${error}`);
    }
  }, [preferences.pushEnabled, preferences.medicationReminders, preferences.medicationReminderBefore, preferences.medicationReminderDelay, hasPermission, isSupported, mode]);


  /**
   * Planifie les notifications (avant + après) pour une prise spécifique
   */
  const scheduleNotificationForIntake = async (intake: any): Promise<boolean> => {
    try {
      // UTILISER EXACTEMENT LA MÊME LOGIQUE QUE Index.tsx
      const utcDate = parseISO(intake.scheduled_time);
      
      // Convertir en timestamp français avec toLocaleString
      const parisTimeString = utcDate.toLocaleString('fr-FR', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      // Parser pour obtenir un Date en heure locale du navigateur
      // parisTimeString format: "21/10/2025 09:30:00" ou "21/10/2025, 09:30:00"
      const parts = parisTimeString.replace(',', '').split(' ');
      const [day, month, year] = parts[0].split('/');
      const [hours, minutes, seconds] = parts[1].split(':');
      
      // Créer le Date avec les valeurs de Paris
      const scheduledTime = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds || '0')
      );
      
      const now = new Date();
      
      if (DEBUG_NOTIFICATIONS) {
        console.log(`📅 ${intake.medications?.name}: DB=${intake.scheduled_time} -> Paris=${parisTimeString} -> Date=${scheduledTime.toLocaleString('fr-FR')}`);
      }
      
      const medicationName = intake.medications?.name || "Médicament";
      const dosage = intake.medications?.medication_catalog?.strength || 
                     intake.medications?.medication_catalog?.default_posology || 
                     "1 comprimé";

      // Clé unique pour éviter les doublons
      const notifKey = `${intake.id}_${scheduledTime.getTime()}`;

      // Vérifier si déjà planifiée
      if (scheduledNotificationsRef.current.has(notifKey)) {
        if (DEBUG_NOTIFICATIONS) {
          console.log(`  ⚠️ Déjà en cache, skip`);
        }
        return false;
      }

      let notifCount = 0;

      // 1. NOTIFICATION AVANT LA PRISE (optionnelle)
      if (preferences.medicationReminderBefore > 0) {
        const beforeTime = new Date(scheduledTime.getTime() - preferences.medicationReminderBefore * 60 * 1000);
        
        if (DEBUG_NOTIFICATIONS) {
          console.log(`  🔔 AVANT: ${beforeTime.toLocaleString('fr-FR')} (dans ${preferences.medicationReminderBefore} min avant)`);
        }
        
        if (beforeTime > now) {
          const beforeId = Math.abs(hashCode(`${intake.id}_before`));
          
          if (DEBUG_NOTIFICATIONS) {
            console.log(`  ✅ Planification AVANT (ID: ${beforeId})`);
          }
          
          await scheduleNativeNotification({
            id: beforeId,
            title: "💊 Rappel de prise à venir",
            body: `${medicationName} - ${dosage}\nÀ prendre dans ${preferences.medicationReminderBefore} min`,
            scheduleAt: beforeTime
          });

          notifCount++;
        } else if (DEBUG_NOTIFICATIONS) {
          console.log(`  ⏭️ AVANT dans le passé, skip`);
        }
      } else if (DEBUG_NOTIFICATIONS) {
        console.log(`  ⏭️ AVANT désactivé (0 min)`);
      }

      // 2. NOTIFICATION À L'HEURE DE LA PRISE (TOUJOURS)
      if (DEBUG_NOTIFICATIONS) {
        console.log(`  🔔 À L'HEURE: ${scheduledTime.toLocaleString('fr-FR')}`);
      }
      
      if (scheduledTime > now) {
        const onTimeId = Math.abs(hashCode(`${intake.id}_ontime`));
        
        if (DEBUG_NOTIFICATIONS) {
          console.log(`  ✅ Planification À L'HEURE (ID: ${onTimeId})`);
        }
        
        await scheduleNativeNotification({
          id: onTimeId,
          title: "💊 C'est l'heure de votre médicament",
          body: `${medicationName} - ${dosage}`,
          scheduleAt: scheduledTime
        });

        notifCount++;
      } else if (DEBUG_NOTIFICATIONS) {
        console.log(`  ⏭️ À L'HEURE dans le passé, skip`);
      }

      // 3. NOTIFICATION APRÈS LA PRISE (optionnelle)
      if (preferences.medicationReminderDelay > 0) {
        const afterTime = new Date(scheduledTime.getTime() + preferences.medicationReminderDelay * 60 * 1000);
        
        if (DEBUG_NOTIFICATIONS) {
          console.log(`  🔔 APRÈS: ${afterTime.toLocaleString('fr-FR')} (${preferences.medicationReminderDelay} min après)`);
        }
        
        if (afterTime > now) {
          const afterId = Math.abs(hashCode(`${intake.id}_after`));
          
          if (DEBUG_NOTIFICATIONS) {
            console.log(`  ✅ Planification APRÈS (ID: ${afterId})`);
          }
          
          await scheduleNativeNotification({
            id: afterId,
            title: "⏰ Avez-vous pris votre médicament ?",
            body: `${medicationName} - ${dosage}\nPrévu à ${scheduledTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
            scheduleAt: afterTime
          });

          notifCount++;
        } else if (DEBUG_NOTIFICATIONS) {
          console.log(`  ⏭️ APRÈS dans le passé, skip`);
        }
      } else if (DEBUG_NOTIFICATIONS) {
        console.log(`  ⏭️ APRÈS désactivé (0 min)`);
      }

      if (DEBUG_NOTIFICATIONS) {
        console.log(`  📊 Total: ${notifCount} notifications planifiées`);
      }

      // Marquer comme planifiée
      scheduledNotificationsRef.current.add(notifKey);
      
      // Sauvegarder le cache dans localStorage
      const cacheArray = Array.from(scheduledNotificationsRef.current);
      localStorage.setItem('scheduled_notifications_cache', JSON.stringify(cacheArray));
      
      if (DEBUG_NOTIFICATIONS) {
        console.log(`  💾 Cache sauvegardé (${cacheArray.length} entrées)`);
      }

      // Nettoyer les anciennes clés (plus de 48h)
      const twoDaysAgo = now.getTime() - 48 * 60 * 60 * 1000;
      scheduledNotificationsRef.current.forEach(key => {
        const timestamp = parseInt(key.split('_')[1]);
        if (timestamp < twoDaysAgo) {
          scheduledNotificationsRef.current.delete(key);
        }
      });
      
      return notifCount > 0;

    } catch (error) {
      console.error("  ❌ ERREUR:", error, intake);
      return false;
    }
  };

  /**
   * Planifie une notification native via Capacitor LocalNotifications
   */
  const scheduleNativeNotification = async ({
    id,
    title,
    body,
    scheduleAt
  }: {
    id: number;
    title: string;
    body: string;
    scheduleAt: Date;
  }) => {
    try {
      // Vérifier si Capacitor est disponible (mobile natif)
      if (!Capacitor.isNativePlatform()) {
        if (DEBUG_NOTIFICATIONS) {
          console.log("    ⚠️ Capacitor non disponible, notification ignorée");
        }
        return;
      }

      if (DEBUG_NOTIFICATIONS) {
        console.log(`    🚀 LocalNotifications.schedule() appelé:`, {
          id,
          title,
          body: body.substring(0, 50) + '...',
          scheduleAt: scheduleAt.toISOString(),
          scheduleAtLocal: scheduleAt.toLocaleString('fr-FR')
        });
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id,
            schedule: { 
              at: scheduleAt
            },
            sound: 'beep.wav',
            attachments: undefined,
            actionTypeId: "",
            extra: {
              intakeId: id,
              timestamp: scheduleAt.getTime()
            },
            channelId: 'medication-reminders',
            ongoing: false,
            autoCancel: true
          }
        ]
      });

      if (DEBUG_NOTIFICATIONS) {
        console.log(`    ✅ Notification ID ${id} planifiée pour ${scheduleAt.toLocaleString('fr-FR')}`);
      }

    } catch (error) {
      console.error(`    ❌ ERREUR planification ID ${id}:`, error);
      throw error;
    }
  };

  /**
   * Force la replanification immédiate (appelé manuellement si besoin)
   */
  const rescheduleAll = useCallback(async (showToasts: boolean = true) => {
    if (DEBUG_NOTIFICATIONS) {
      console.log("🔄 Replanification forcée de toutes les notifications...");
    }
    
    const toastId = showToasts ? toast.loading("Replanification des notifications...") : null;
    
    // Vider le cache
    scheduledNotificationsRef.current.clear();
    localStorage.removeItem('scheduled_notifications_cache');
    
    // Annuler toutes les notifications planifiées
    try {
      if (Capacitor.isNativePlatform()) {
        const pending = await LocalNotifications.getPending();
        
        if (DEBUG_NOTIFICATIONS) {
          console.log(`📋 ${pending.notifications.length} notifications en attente:`, pending.notifications);
        }
        
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel(pending);
          if (DEBUG_NOTIFICATIONS) {
            console.log("✅ Notifications annulées");
          }
        }
      }
    } catch (error) {
      console.error("⚠️ Erreur annulation notifications:", error);
    }

    await scheduleUpcomingNotifications(showToasts);
    
    // Vérifier ce qui a été planifié
    try {
      if (Capacitor.isNativePlatform()) {
        const pendingAfter = await LocalNotifications.getPending();
        
        if (DEBUG_NOTIFICATIONS) {
          console.log(`✅ ${pendingAfter.notifications.length} notifications planifiées:`, pendingAfter.notifications);
        }
        
        if (showToasts && toastId) {
          toast.dismiss(toastId);
          toast.success(`✅ ${pendingAfter.notifications.length} notifications planifiées`);
        }
      } else {
        if (showToasts && toastId) {
          toast.dismiss(toastId);
          toast.success("✅ Planification terminée");
        }
      }
    } catch (error) {
      console.error("⚠️ Erreur vérification notifications:", error);
      if (showToasts && toastId) {
        toast.dismiss(toastId);
        toast.error("Erreur lors de la planification");
      }
    }
  }, [scheduleUpcomingNotifications]);

  return {
    rescheduleAll,
    scheduledCount: scheduledNotificationsRef.current.size
  };
};
