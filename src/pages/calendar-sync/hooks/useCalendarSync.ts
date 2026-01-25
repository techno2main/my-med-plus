import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNativeCalendar } from './useNativeCalendar';
import { useSyncConfig } from './useSyncConfig';
import { filterEventsByDateRange, calculateDateRange, filterEventsFromStartDate } from '../utils/dateUtils';
import {
  mapIntakesToEvents,
  mapPharmacyVisitsToEvents,
  mapDoctorVisitsToEvents,
  mapPrescriptionRenewalsToEvents
} from '../utils/eventMapper';
import type { SyncResult, CalendarEvent, SyncSummary } from '../types';

/**
 * Hook principal de synchronisation calendrier
 */
export const useCalendarSync = () => {
  const { config, updateConfig } = useSyncConfig();
  const nativeCalendar = useNativeCalendar();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummary | null>(null);

  const loadAppEvents = async (): Promise<CalendarEvent[]> => {
    const allEvents: CalendarEvent[] = [];

    try {
      // Calculer les plages de dates basées sur la config
      const historyRange = config.intakes.history.keepHistory 
        ? calculateDateRange(config.intakes.history.period, false)
        : null;
      
      const futureRange = config.intakes.future.syncFuture
        ? calculateDateRange(config.intakes.future.period, true)
        : null;
      
      // Déterminer la plage globale
      const globalStart = historyRange ? historyRange.start : (futureRange ? futureRange.start : new Date());
      const globalEnd = futureRange ? futureRange.end : (historyRange ? historyRange.end : new Date());
      
      console.log('[Calendar Sync] Date range:', {
        start: globalStart.toISOString(),
        end: globalEnd.toISOString(),
        historyDays: config.intakes.history.period.value,
        futureDays: config.intakes.future.period.value
      });

      // 1. Charger les prises de médicaments si activé
      if (config.intakes.enabled && (config.intakes.history.keepHistory || config.intakes.future.syncFuture)) {
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
          .gte('scheduled_time', globalStart.toISOString())
          .lte('scheduled_time', globalEnd.toISOString())
          .order('scheduled_time', { ascending: true });

        if (intakes) {
          console.log(`[Calendar Sync] Loaded ${intakes.length} intakes from DB`);
          const intakeEvents = mapIntakesToEvents(intakes);
          allEvents.push(...intakeEvents);
        }
      }

      // 2. Charger les visites pharmacie si activé
      if (config.appointments.enabled && config.appointments.syncPharmacyVisits) {
        const apptHistoryRange = config.appointments.history.keepHistory
          ? calculateDateRange(config.appointments.history.period, false)
          : null;
        const apptFutureRange = config.appointments.future.syncFuture
          ? calculateDateRange(config.appointments.future.period, true)
          : null;
        
        const apptStart = apptHistoryRange ? apptHistoryRange.start : (apptFutureRange ? apptFutureRange.start : new Date());
        const apptEnd = apptFutureRange ? apptFutureRange.end : (apptHistoryRange ? apptHistoryRange.end : new Date());

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
          .gte('visit_date', apptStart.toISOString().split('T')[0])
          .lte('visit_date', apptEnd.toISOString().split('T')[0])
          .order('visit_date', { ascending: true });

        if (visits) {
          console.log(`[Calendar Sync] Loaded ${visits.length} pharmacy visits from DB`);
          const visitEvents = mapPharmacyVisitsToEvents(visits);
          allEvents.push(...visitEvents);
        }
      }

      // 3. Charger les RDV médecin (fin de traitement) si activé
      if (config.appointments.enabled && config.appointments.syncDoctorVisits) {
        const apptHistoryRange = config.appointments.history.keepHistory
          ? calculateDateRange(config.appointments.history.period, false)
          : null;
        const apptFutureRange = config.appointments.future.syncFuture
          ? calculateDateRange(config.appointments.future.period, true)
          : null;
        
        const apptStart = apptHistoryRange ? apptHistoryRange.start : (apptFutureRange ? apptFutureRange.start : new Date());
        const apptEnd = apptFutureRange ? apptFutureRange.end : (apptHistoryRange ? apptHistoryRange.end : new Date());

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
          .not('end_date', 'is', null)
          .gte('end_date', apptStart.toISOString().split('T')[0])
          .lte('end_date', apptEnd.toISOString().split('T')[0])
          .order('end_date', { ascending: true });

        if (treatments) {
          console.log(`[Calendar Sync] Loaded ${treatments.length} doctor appointments from DB`);
          const doctorEvents = mapDoctorVisitsToEvents(treatments);
          allEvents.push(...doctorEvents);
        }
      }

      // 4. Charger les renouvellements ordonnance si activé (désactivé pour l'instant)
      if (false) {
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
          // Note: filterEventsFromStartDate est un alias de filterEventsByDateRange
          const renewalEvents = mapPrescriptionRenewalsToEvents(prescriptions);
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

  const generateSyncSummary = async () => {
    const events = await loadAppEvents();
    
    const intakes = events.filter(e => e.eventType === 'intake');
    const appointments = events.filter(e => 
      e.eventType === 'doctor_visit' || 
      e.eventType === 'pharmacy_visit'
    );

    // Calculer les vraies périodes basées sur la config
    const historyDays = config.intakes.history.keepHistory 
      ? (config.intakes.history.period.type === 'days' ? config.intakes.history.period.value 
         : config.intakes.history.period.type === 'weeks' ? config.intakes.history.period.value * 7
         : config.intakes.history.period.value * 30)
      : 0;
    
    const futureDays = config.intakes.future.syncFuture
      ? (config.intakes.future.period.type === 'days' ? config.intakes.future.period.value 
         : config.intakes.future.period.type === 'weeks' ? config.intakes.future.period.value * 7
         : config.intakes.future.period.value * 30)
      : 0;
    
    const summary: SyncSummary = {
      totalEvents: events.length,
      intakesCount: intakes.length,
      appointmentsCount: appointments.length,
      periodStart: events.length > 0 ? new Date(Math.min(...events.map(e => e.startDate.getTime()))) : new Date(),
      periodEnd: events.length > 0 ? new Date(Math.max(...events.map(e => e.startDate.getTime()))) : new Date(),
      historyDays,
      futureDays
    };

    console.log('[Calendar Sync] Summary:', summary);
    setSyncSummary(summary);
  };

  return {
    config,
    updateConfig,
    nativeCalendar,
    syncing,
    lastSyncResult,
    syncSummary,
    loadAppEvents,
    syncToNativeCalendar,
    clearAllSyncedEvents,
    generateSyncSummary
  };
};