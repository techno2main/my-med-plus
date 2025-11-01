import { useState, useEffect } from 'react';
import type { SyncConfig } from '../types';

const STORAGE_KEY = 'calendar_sync_config';

const DEFAULT_CONFIG: SyncConfig = {
  selectedCalendarId: null,
  syncEnabled: false,
  intakes: {
    enabled: true,
    history: {
      keepHistory: false,
      deleteHistory: false,
      period: { value: 7, type: 'days' }
    },
    future: {
      syncFuture: true,
      doNotSync: false,
      period: { value: 7, type: 'days' }
    }
  },
  appointments: {
    enabled: true,
    syncDoctorVisits: true,
    syncLabVisits: false,
    syncPharmacyVisits: true,
    history: {
      keepHistory: false,
      deleteHistory: false,
      period: { value: 30, type: 'days' }
    },
    future: {
      syncFuture: true,
      doNotSync: false,
      period: { value: 90, type: 'days' }
    }
  },
  lastSyncDate: null,
  syncedEvents: {}
};

/**
 * Hook de gestion de la configuration de synchronisation
 * Version mise à jour avec nouvelle structure
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
        const parsed = JSON.parse(stored) as any;
        
        // Migration depuis ancienne structure si nécessaire
        if ('syncIntakes' in parsed) {
          console.log('[Calendar Sync] Migrating old config format...');
          const migratedConfig: SyncConfig = {
            ...DEFAULT_CONFIG,
            selectedCalendarId: parsed.selectedCalendarId,
            syncEnabled: parsed.syncEnabled,
            lastSyncDate: parsed.lastSyncDate,
            syncedEvents: parsed.syncedEvents || {},
            intakes: {
              ...DEFAULT_CONFIG.intakes,
              enabled: parsed.syncIntakes
            },
            appointments: {
              ...DEFAULT_CONFIG.appointments,
              syncDoctorVisits: parsed.syncDoctorVisits,
              syncPharmacyVisits: parsed.syncPharmacyVisits
            }
          };
          setConfig(migratedConfig);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedConfig));
        } else {
          // Nouvelle structure
          setConfig({ ...DEFAULT_CONFIG, ...parsed });
        }
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