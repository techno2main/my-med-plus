/**
 * Types pour la synchronisation du calendrier natif
 */

export type CalendarEventType = 'intake' | 'doctor_visit' | 'pharmacy_visit' | 'prescription_renewal';

export type IntakeStatus = 'on_time' | 'late' | 'missed' | 'upcoming';

export type SyncPeriodType = 'days' | 'weeks' | 'months';

export interface SyncPeriod {
  value: number;
  type: SyncPeriodType;
}

export interface HistoryOptions {
  keepHistory: boolean;
  deleteHistory: boolean;
  period?: SyncPeriod;
}

export interface FutureOptions {
  syncFuture: boolean;
  doNotSync: boolean;
  period?: SyncPeriod;
}

export interface IntakeSyncConfig {
  enabled: boolean;
  history: HistoryOptions;
  future: FutureOptions;
}

export interface AppointmentSyncConfig {
  enabled: boolean;
  syncDoctorVisits: boolean;
  syncLabVisits: boolean;
  syncPharmacyVisits: boolean;
  history: HistoryOptions;
  future: FutureOptions;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  eventType: CalendarEventType;
  color?: string;
  alerts?: number[];
  isReminder?: boolean; // TRUE = style rappel (court, 15min), FALSE = style événement (long, 1h)
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
  intakes: IntakeSyncConfig;
  appointments: AppointmentSyncConfig;
  lastSyncDate: string | null;
  syncedEvents: Record<string, string>; // app_event_id -> native_event_id mapping
}

export interface SyncResult {
  success: boolean;
  eventsCreated: number;
  eventsUpdated: number;
  eventsDeleted: number;
  errors: string[];
  details?: {
    intakesCreated: number;
    intakesUpdated: number;
    intakesDeleted: number;
    appointmentsCreated: number;
    appointmentsUpdated: number;
    appointmentsDeleted: number;
  };
}

export interface CalendarPermissionStatus {
  granted: boolean;
  canRequest: boolean;
}

export interface SyncSummary {
  totalEvents: number;
  intakesCount: number;
  appointmentsCount: number;
  periodStart: Date;
  periodEnd: Date;
  historyDays: number;
  futureDays: number;
}