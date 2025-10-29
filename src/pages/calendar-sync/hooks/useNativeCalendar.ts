import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar, CalendarPermissionScope } from '@ebarooni/capacitor-calendar';
import type { NativeCalendar, CalendarPermissionStatus } from '../types';

/**
 * Hook de gestion du calendrier natif
 * Utilise @ebarooni/capacitor-calendar pour iOS et Android
 */
export const useNativeCalendar = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<CalendarPermissionStatus>({
    granted: false,
    canRequest: true
  });
  const [availableCalendars, setAvailableCalendars] = useState<NativeCalendar[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSupport();
  }, []);

  const checkSupport = () => {
    // Vérifier si on est sur une plateforme native
    const isNative = Capacitor.isNativePlatform();
    setIsSupported(isNative);
    
    if (isNative) {
      checkPermission();
    }
  };

  const checkPermission = async () => {
    try {
      // Vérifier les permissions de lecture et écriture
      const readStatus = await CapacitorCalendar.checkPermission({
        scope: CalendarPermissionScope.READ_CALENDAR
      });
      const writeStatus = await CapacitorCalendar.checkPermission({
        scope: CalendarPermissionScope.WRITE_CALENDAR
      });
      
      const granted = readStatus.result === 'granted' && writeStatus.result === 'granted';
      const canRequest = readStatus.result === 'prompt' || writeStatus.result === 'prompt';
      
      console.log('[Calendar Sync] Permission status:', { read: readStatus.result, write: writeStatus.result });
      setPermission({ granted, canRequest });
    } catch (error) {
      console.error('[Calendar Sync] Error checking permission:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('[Calendar Sync] Calendar not supported on this platform');
      return false;
    }

    setLoading(true);
    try {
      // Demander l'accès complet (lecture + écriture)
      const result = await CapacitorCalendar.requestFullCalendarAccess();
      
      const granted = result.result === 'granted';
      setPermission({ 
        granted, 
        canRequest: result.result === 'prompt'
      });
      
      console.log('[Calendar Sync] Permission request result:', result.result);
      
      if (granted) {
        // Charger les calendriers immédiatement
        await loadCalendars();
      }
      
      return granted;
    } catch (error) {
      console.error('[Calendar Sync] Error requesting permission:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadCalendars = async (): Promise<NativeCalendar[]> => {
    if (!isSupported || !permission.granted) {
      console.warn('[Calendar Sync] Cannot load calendars without permission');
      return [];
    }

    setLoading(true);
    try {
      const result = await CapacitorCalendar.listCalendars();
      const calendars = result.result;
      
      const mapped: NativeCalendar[] = calendars.map(cal => ({
        id: cal.id,
        name: cal.title,
        displayName: cal.title,
        isPrimary: cal.accountName === cal.ownerAccount, // Android
        allowsModifications: !cal.isImmutable, // iOS
        color: cal.color
      }));
      
      console.log('[Calendar Sync] Loaded calendars:', mapped.length);
      setAvailableCalendars(mapped);
      return mapped;
    } catch (error) {
      console.error('[Calendar Sync] Error loading calendars:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (event: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    calendarId: string;
    location?: string;
  }): Promise<string | null> => {
    if (!isSupported || !permission.granted) {
      console.warn('[Calendar Sync] Cannot create event without permission');
      return null;
    }

    try {
      const result = await CapacitorCalendar.createEvent({
        title: event.title,
        description: event.description,
        startDate: event.startDate.getTime(),
        endDate: event.endDate.getTime(),
        calendarId: event.calendarId,
        location: event.location,
        isAllDay: false
      });
      
      console.log('[Calendar Sync] Event created:', result.id);
      return result.id;
    } catch (error) {
      console.error('[Calendar Sync] Error creating event:', error);
      return null;
    }
  };

  const updateEvent = async (eventId: string, updates: {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    location?: string;
  }): Promise<boolean> => {
    if (!isSupported || !permission.granted) {
      console.warn('[Calendar Sync] Cannot update event without permission');
      return false;
    }

    try {
      await CapacitorCalendar.modifyEvent({
        id: eventId,
        title: updates.title,
        description: updates.description,
        startDate: updates.startDate?.getTime(),
        endDate: updates.endDate?.getTime(),
        location: updates.location
      });
      
      console.log('[Calendar Sync] Event updated:', eventId);
      return true;
    } catch (error) {
      console.error('[Calendar Sync] Error updating event:', error);
      return false;
    }
  };

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    if (!isSupported || !permission.granted) {
      console.warn('[Calendar Sync] Cannot delete event without permission');
      return false;
    }

    try {
      await CapacitorCalendar.deleteEvent({ id: eventId });
      
      console.log('[Calendar Sync] Event deleted:', eventId);
      return true;
    } catch (error) {
      console.error('[Calendar Sync] Error deleting event:', error);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    availableCalendars,
    loading,
    requestPermission,
    loadCalendars,
    createEvent,
    updateEvent,
    deleteEvent
  };
};
