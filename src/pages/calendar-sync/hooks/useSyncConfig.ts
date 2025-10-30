import { useState, useEffect } from 'react';
import type { SyncConfig } from '../types';

const STORAGE_KEY = 'calendar_sync_config';

const DEFAULT_CONFIG: SyncConfig = {
  selectedCalendarId: null,
  syncEnabled: false,
  syncIntakes: true,
  syncDoctorVisits: false, // DÉSACTIVÉ : Pas de table doctor_visits dans la BDD
  syncPharmacyVisits: true,
  syncPrescriptionRenewals: true,
  lastSyncDate: null,
  syncedEvents: {} // Mapping app_event_id -> native_event_id
};

/**
 * Hook de gestion de la configuration de synchronisation
 */
export const useSyncConfig = () => {
  const [config, setConfig] = useState<SyncConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SyncConfig;
        setConfig(parsed);
      }
    } catch (error) {
      console.error('[Calendar Sync] Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (updates: Partial<SyncConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (error) {
      console.error('[Calendar Sync] Error saving config:', error);
    }
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[Calendar Sync] Error resetting config:', error);
    }
  };

  return {
    config,
    loading,
    updateConfig,
    resetConfig
  };
};
