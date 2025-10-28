import { useEffect, useState } from "react";
import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from "sonner";

export interface NotificationPreferences {
  pushEnabled: boolean;
  medicationReminders: boolean;
  medicationReminderDelay: number;
  medicationReminderBefore: number;
  stockAlerts: boolean;
  prescriptionRenewal: boolean;
  prescriptionRenewalDays: number[];
  pharmacyVisitReminder: boolean;
  pharmacyVisitReminderDays: number;
  customMessages: {
    medicationReminder: string;
    delayedReminder: string;
    stockAlert: string;
    prescriptionRenewal: string;
    pharmacyVisit: string;
  };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  medicationReminders: true,
  medicationReminderDelay: 10,
  medicationReminderBefore: 5,
  stockAlerts: true,
  prescriptionRenewal: true,
  prescriptionRenewalDays: [10, 2],
  pharmacyVisitReminder: true,
  pharmacyVisitReminderDays: 1,
  customMessages: {
    medicationReminder: "💊 Rappel de prise",
    delayedReminder: "⏰ Rappel de prise manquée",
    stockAlert: "⚠️ Stock faible",
    prescriptionRenewal: "📅 Renouvellement d'ordonnance",
    pharmacyVisit: "💊 Rechargement pharmacie",
  },
};

export const useNativeNotifications = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Vérifier si Capacitor LocalNotifications est vraiment disponible
    const checkCapacitorAvailability = async () => {
      try {
        // Tenter d'appeler une méthode Capacitor pour vérifier qu'il existe
        await LocalNotifications.checkPermissions();
        setIsSupported(true);
        checkPermissions();
      } catch (error) {
        // Capacitor n'est pas disponible (PWA sans Capacitor)
        console.log("Capacitor LocalNotifications not available, falling back to Web API");
        setIsSupported(false);
      }
    };
    
    checkCapacitorAvailability();
    
    // Load preferences from localStorage
    const saved = localStorage.getItem("notificationPreferences");
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  const checkPermissions = async () => {
    try {
      const result = await LocalNotifications.checkPermissions();
      setIsSupported(true);
      setHasPermission(result.display === 'granted');
    } catch (error) {
      console.error("Error checking permissions:", error);
      setIsSupported(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const result = await LocalNotifications.requestPermissions();
      const granted = result.display === 'granted';
      setHasPermission(granted);
      
      if (granted) {
        toast.success("Notifications activées ✓");
        return true;
      } else {
        toast.error("Permission refusée pour les notifications");
        return false;
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      toast.error("Erreur lors de la demande de permission");
      return false;
    }
  };

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    localStorage.setItem("notificationPreferences", JSON.stringify(updated));
  };

  const showNotification = async (
    title: string,
    body: string,
    id?: number
  ): Promise<boolean> => {
    if (!hasPermission) {
      console.error("No notification permission");
      return false;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: id || new Date().getTime(),
            schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
            sound: undefined,
            attachments: undefined,
            actionTypeId: "",
            extra: null
          }
        ]
      });
      
      console.log("Notification scheduled:", title);
      return true;
    } catch (error) {
      console.error("Error showing notification:", error);
      return false;
    }
  };

  const sendTestNotification = async (): Promise<boolean> => {
    console.log("Test notification - hasPermission:", hasPermission);
    
    if (!hasPermission) {
      console.log("No permission, requesting...");
      const granted = await requestPermission();
      console.log("Permission granted:", granted);
      if (!granted) return false;
    }
    
    toast.success("Notification programmée dans 5 secondes...");
    
    const success = await LocalNotifications.schedule({
      notifications: [
        {
          title: "💊 Test de notification",
          body: "Si vous voyez ceci, les notifications fonctionnent parfaitement !",
          id: 1,
          schedule: { at: new Date(Date.now() + 5000) }, // 5 seconds from now
          sound: undefined,
          attachments: undefined,
          actionTypeId: "",
          extra: null
        }
      ]
    }).then(() => {
      console.log("Test notification scheduled successfully");
      return true;
    }).catch((error) => {
      console.error("Failed to schedule test notification:", error);
      return false;
    });
    
    if (success) {
      console.log("Test notification sent successfully");
    } else {
      console.error("Failed to send test notification");
      toast.error("Échec de l'envoi");
    }
    
    return success;
  };

  const scheduleBeforeMedicationReminder = async (
    medicationName: string,
    time: string,
    dosage: string
  ) => {
    if (!preferences.pushEnabled || !preferences.medicationReminders) return;

    const body = `${medicationName} - ${dosage}\nDans ${preferences.medicationReminderBefore} minutes (${time})`;
    
    await showNotification(preferences.customMessages.medicationReminder, body);
  };

  const scheduleMedicationReminder = async (
    medicationName: string,
    time: string,
    dosage: string
  ) => {
    if (!preferences.pushEnabled || !preferences.medicationReminders) return;

    const body = `${medicationName} - ${dosage}\nHeure: ${time}`;
    
    await showNotification(preferences.customMessages.medicationReminder, body);
  };

  const scheduleDelayedReminder = async (
    medicationName: string,
    time: string,
    dosage: string
  ) => {
    if (!preferences.pushEnabled || !preferences.medicationReminders) return;

    const body = `Avez-vous pris ${medicationName} (${time}) ?\n${dosage}`;
    
    await showNotification(preferences.customMessages.delayedReminder, body);
  };

  const notifyLowStock = async (
    medicationName: string,
    remaining: number,
    daysLeft: number
  ) => {
    if (!preferences.pushEnabled || !preferences.stockAlerts) return;

    const body = `${medicationName}\n${remaining} comprimés restants (~${daysLeft} jours)`;
    
    await showNotification(preferences.customMessages.stockAlert, body);
  };

  const notifyPrescriptionRenewal = async (
    treatmentName: string,
    daysUntilExpiry: number
  ) => {
    if (!preferences.pushEnabled || !preferences.prescriptionRenewal) return;

    const body = `${treatmentName}\nExpire dans ${daysUntilExpiry} jour(s)`;
    
    await showNotification(preferences.customMessages.prescriptionRenewal, body);
  };

  const notifyPharmacyVisit = async (
    visitDate: string,
    pharmacyName?: string
  ) => {
    if (!preferences.pushEnabled || !preferences.pharmacyVisitReminder) return;

    const body = pharmacyName 
      ? `Rendez-vous demain (${visitDate})\n${pharmacyName}`
      : `Rendez-vous demain (${visitDate})`;
    
    await showNotification(preferences.customMessages.pharmacyVisit, body);
  };

  return {
    preferences,
    updatePreferences,
    isSupported,
    hasPermission,
    requestPermission,
    sendTestNotification,
    scheduleBeforeMedicationReminder,
    scheduleMedicationReminder,
    scheduleDelayedReminder,
    notifyLowStock,
    notifyPrescriptionRenewal,
    notifyPharmacyVisit,
  };
};
