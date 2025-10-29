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
            pharmacies (name, address)
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

      // Synchroniser chaque événement
      for (const event of appEvents) {
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
          result.eventsCreated++;
        } else {
          result.errors.push(`Échec création: ${event.title}`);
        }
      }

      // Mettre à jour la date de dernière synchro
      updateConfig({ lastSyncDate: new Date().toISOString() });

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

  return {
    config,
    updateConfig,
    nativeCalendar,
    syncing,
    lastSyncResult,
    loadAppEvents,
    syncToNativeCalendar
  };
};
