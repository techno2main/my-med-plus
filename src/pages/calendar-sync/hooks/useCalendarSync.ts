import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNativeCalendar } from './useNativeCalendar';
import { useSyncConfig } from './useSyncConfig';
import { filterEventsFromStartDate } from '../utils/dateUtils';
import {
  mapIntakesToEvents,
  mapPharmacyVisitsToEvents,
  mapDoctorVisitsToEvents,
  mapPrescriptionRenewalsToEvents
} from '../utils/eventMapper';
import type { SyncResult, CalendarEvent } from '../types';

/**
 * Hook principal de synchronisation calendrier
 */
export const useCalendarSync = () => {
  const { config, updateConfig } = useSyncConfig();
  const nativeCalendar = useNativeCalendar();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);

  const loadAppEvents = async (): Promise<CalendarEvent[]> => {
    const allEvents: CalendarEvent[] = [];

    try {
      // 1. Charger les prises de médicaments si activé
      if (config.syncIntakes) {
        const { data: intakes } = await supabase
          .from('medication_intakes')
          .select(`
            id,
            scheduled_time,
            taken_at,
            status,
            medications!inner (
              name,
              treatment_id,
              treatments!inner (name, is_active),
              medication_catalog (form)
            )
          `)
          .eq('medications.treatments.is_active', true)
          .gte('scheduled_time', '2025-10-13T00:00:00Z')
          .order('scheduled_time', { ascending: true });

        if (intakes) {
          const filteredIntakes = filterEventsFromStartDate(intakes);
          const intakeEvents = mapIntakesToEvents(filteredIntakes);
          allEvents.push(...intakeEvents);
        }
      }

      // 2. Charger les visites pharmacie si activé
      if (config.syncPharmacyVisits) {
        const { data: visits } = await supabase
          .from('pharmacy_visits')
          .select(`
            id,
            visit_date,
            visit_number,
            treatment_id,
            treatments!inner (name, is_active),
            health_professionals:pharmacy_id (name, street_address)
          `)
          .eq('is_completed', false)
          .eq('treatments.is_active', true)
          .gte('visit_date', '2025-10-13')
          .order('visit_date', { ascending: true });

        if (visits) {
          const filteredVisits = filterEventsFromStartDate(visits);
          const visitEvents = mapPharmacyVisitsToEvents(filteredVisits);
          allEvents.push(...visitEvents);
        }
      }

      // 3. Charger les RDV médecin (fin de traitement) si activé
      if (config.syncDoctorVisits) {
        const { data: treatments } = await supabase
          .from('treatments')
          .select(`
            id,
            name,
            pathology,
            end_date,
            prescription_id,
            prescriptions (
              health_professionals (name)
            )
          `)
          .eq('is_active', true)
          .not('end_date', 'is', null)
          .gte('end_date', '2025-10-13')
          .order('end_date', { ascending: true });

        if (treatments) {
          const doctorEvents = mapDoctorVisitsToEvents(treatments);
          allEvents.push(...doctorEvents);
        }
      }

      // 4. Charger les renouvellements ordonnance si activé
      if (config.syncPrescriptionRenewals) {
        const { data: prescriptions } = await supabase
          .from('prescriptions')
          .select(`
            id,
            prescription_date,
            duration_days,
            prescribing_doctor_id,
            health_professionals (name)
          `)
          .gte('prescription_date', '2025-10-13')
          .order('prescription_date', { ascending: true });

        if (prescriptions) {
          const filteredPrescriptions = filterEventsFromStartDate(prescriptions);
          const renewalEvents = mapPrescriptionRenewalsToEvents(filteredPrescriptions);
          allEvents.push(...renewalEvents);
        }
      }

      console.log(`[Calendar Sync] Loaded ${allEvents.length} events from app`);
      return allEvents;

    } catch (error) {
      console.error('[Calendar Sync] Error loading app events:', error);
      return [];
    }
  };

  const syncToNativeCalendar = async (): Promise<SyncResult> => {
    if (!config.selectedCalendarId) {
      return {
        success: false,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsDeleted: 0,
        errors: ['Aucun calendrier sélectionné']
      };
    }

    if (!nativeCalendar.permission.granted) {
      return {
        success: false,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsDeleted: 0,
        errors: ['Permission calendrier non accordée']
      };
    }

    setSyncing(true);
    const result: SyncResult = {
      success: true,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      errors: []
    };

    try {
      // Charger tous les événements de l'app
      const appEvents = await loadAppEvents();
      
      // Récupérer le mapping des événements déjà synchronisés
      const syncedEvents = config.syncedEvents || {};
      const processedAppEventIds = new Set<string>();

      // Synchroniser chaque événement
      for (const event of appEvents) {
        processedAppEventIds.add(event.id);
        
        const existingNativeEventId = syncedEvents[event.id];
        
        if (existingNativeEventId) {
          // STRATÉGIE: DELETE + CREATE au lieu de UPDATE
          // Certains calendriers natifs (Samsung) ne supportent pas bien modifyEvent
          // On supprime l'ancien et on recrée avec les nouvelles données
          
          const deleted = await nativeCalendar.deleteEvent(existingNativeEventId);
          
          if (deleted) {
            console.log(`[Calendar Sync] Deleted old event for recreation: ${event.title}`);
          }
          
          // Recréer l'événement avec les nouvelles données
          const newEventId = await nativeCalendar.createEvent({
            title: event.title,
            description: event.description,
            startDate: event.startDate,
            endDate: event.endDate,
            calendarId: config.selectedCalendarId,
            location: event.location,
            color: event.color,
            alerts: event.alerts
          });
          
          if (newEventId) {
            syncedEvents[event.id] = newEventId;
            result.eventsUpdated++;
            console.log(`[Calendar Sync] Recreated event: ${event.title}`);
          } else {
            result.errors.push(`Échec recréation: ${event.title}`);
          }
        } else {
          // Nouvel événement : le créer
          const eventId = await nativeCalendar.createEvent({
            title: event.title,
            description: event.description,
            startDate: event.startDate,
            endDate: event.endDate,
            calendarId: config.selectedCalendarId,
            location: event.location,
            color: event.color,
            alerts: event.alerts
          });

          if (eventId) {
            syncedEvents[event.id] = eventId;
            result.eventsCreated++;
            console.log(`[Calendar Sync] Created event: ${event.title}`);
          } else {
            result.errors.push(`Échec création: ${event.title}`);
          }
        }
      }
      
      // Supprimer les événements qui n'existent plus dans l'app
      const eventsToDelete: string[] = [];
      for (const [appEventId, nativeEventId] of Object.entries(syncedEvents)) {
        if (!processedAppEventIds.has(appEventId)) {
          // Cet événement n'existe plus dans l'app, le supprimer du calendrier natif
          const deleted = await nativeCalendar.deleteEvent(nativeEventId);
          if (deleted) {
            eventsToDelete.push(appEventId);
            result.eventsDeleted++;
            console.log(`[Calendar Sync] Deleted event: ${appEventId}`);
          } else {
            result.errors.push(`Échec suppression: ${appEventId}`);
          }
        }
      }
      
      // Nettoyer le mapping des événements supprimés
      eventsToDelete.forEach(id => delete syncedEvents[id]);

      // Mettre à jour la config avec le mapping et la date de dernière synchro
      updateConfig({ 
        lastSyncDate: new Date().toISOString(),
        syncedEvents
      });

      result.success = result.errors.length === 0;
      console.log('[Calendar Sync] Sync completed:', result);

    } catch (error) {
      console.error('[Calendar Sync] Error during sync:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setSyncing(false);
      setLastSyncResult(result);
    }

    return result;
  };

  /**
   * Supprime TOUS les événements synchronisés du calendrier natif
   * Utile pour forcer une resynchronisation complète
   */
  const clearAllSyncedEvents = async (): Promise<{ success: boolean; deletedCount: number }> => {
    const syncedEvents = config.syncedEvents || {};
    const eventIds = Object.values(syncedEvents);
    let deletedCount = 0;

    console.log(`[Calendar Sync] Clearing ${eventIds.length} synced events...`);

    for (const nativeEventId of eventIds) {
      const deleted = await nativeCalendar.deleteEvent(nativeEventId);
      if (deleted) {
        deletedCount++;
      }
    }

    // Réinitialiser le mapping
    updateConfig({ syncedEvents: {} });

    console.log(`[Calendar Sync] Cleared ${deletedCount}/${eventIds.length} events`);
    return { success: true, deletedCount };
  };

  return {
    config,
    updateConfig,
    nativeCalendar,
    syncing,
    lastSyncResult,
    loadAppEvents,
    syncToNativeCalendar,
    clearAllSyncedEvents
  };
};
