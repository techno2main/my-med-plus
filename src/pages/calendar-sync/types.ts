/**
 * Types pour la synchronisation du calendrier natif
 */

export type CalendarEventType = 'intake' | 'doctor_visit' | 'pharmacy_visit' | 'prescription_renewal';

export type IntakeStatus = 'on_time' | 'late' | 'missed' | 'upcoming';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  eventType: CalendarEventType;
  color?: string; // Couleur hex pour Android (ex: #10B981)
  alerts?: number[]; // Alertes en minutes avant l'événement
  metadata: {
    appId: string;
    status?: IntakeStatus;
    medicationName?: string;
    treatmentName?: string;
    professionalName?: string;
    pharmacyName?: string;
  };
}

export interface NativeCalendar {
  id: string;
  name: string;
  displayName: string;
  isPrimary: boolean;
  allowsModifications: boolean;
  color?: string;
}

export interface SyncConfig {
  selectedCalendarId: string | null;
  syncEnabled: boolean;
  syncIntakes: boolean;
  syncDoctorVisits: boolean;
  syncPharmacyVisits: boolean;
  syncPrescriptionRenewals: boolean;
  lastSyncDate: string | null;
  syncedEvents: Record<string, string>; // app_event_id -> native_event_id mapping
}

export interface SyncResult {
  success: boolean;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: string[];
}

export interface CalendarPermissionStatus {
  granted: boolean;
  canRequest: boolean;
}
