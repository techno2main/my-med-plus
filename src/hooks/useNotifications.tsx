import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NotificationPreferences {
  pushEnabled: boolean;
  medicationReminders: boolean;
  medicationReminderDelay: number; // minutes after scheduled time
  stockAlerts: boolean;
  prescriptionRenewal: boolean;
  prescriptionRenewalDays: number[]; // e.g., [10, 2] for J-10 and J-2
  pharmacyVisitReminder: boolean;
  pharmacyVisitReminderDays: number; // days before visit
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  medicationReminders: true,
  medicationReminderDelay: 10,
  stockAlerts: true,
  prescriptionRenewal: true,
  prescriptionRenewalDays: [10, 2],
  pharmacyVisitReminder: true,
  pharmacyVisitReminderDays: 1,
};

export const useNotifications = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    // Check if notifications are supported
    if ("Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }

    // Load preferences from localStorage
    const saved = localStorage.getItem("notificationPreferences");
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error("Les notifications ne sont pas supportées par votre navigateur");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        toast.success("Notifications activées ✓");
        return true;
      } else {
        toast.error("Permission refusée pour les notifications");
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);
    localStorage.setItem("notificationPreferences", JSON.stringify(updated));
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== "granted") {
      return;
    }

    new Notification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      ...options,
    } as NotificationOptions);
  };

  const scheduleMedicationReminder = (
    medicationName: string,
    time: string,
    dosage: string
  ) => {
    if (!preferences.pushEnabled || !preferences.medicationReminders) return;

    const title = `💊 Rappel de prise`;
    const body = `${medicationName} - ${dosage}\nHeure: ${time}`;

    showNotification(title, {
      body,
      tag: `medication-${medicationName}-${time}`,
      requireInteraction: true,
    });
  };

  const scheduleDelayedReminder = (
    medicationName: string,
    time: string,
    dosage: string
  ) => {
    if (!preferences.pushEnabled || !preferences.medicationReminders) return;

    const title = `⏰ Rappel de prise manquée`;
    const body = `Avez-vous pris ${medicationName} (${time}) ?\n${dosage}`;

    showNotification(title, {
      body,
      tag: `delayed-${medicationName}-${time}`,
      requireInteraction: true,
    });
  };

  const notifyLowStock = (medicationName: string, remaining: number, daysLeft: number) => {
    if (!preferences.pushEnabled || !preferences.stockAlerts) return;

    const title = `⚠️ Stock faible`;
    const body = `${medicationName}\n${remaining} comprimés restants (~${daysLeft} jours)`;

    showNotification(title, {
      body,
      tag: `stock-${medicationName}`,
      requireInteraction: false,
    });
  };

  const notifyPrescriptionRenewal = (treatmentName: string, daysUntilExpiry: number) => {
    if (!preferences.pushEnabled || !preferences.prescriptionRenewal) return;

    const title = `📅 Renouvellement d'ordonnance`;
    const body = `${treatmentName}\nExpire dans ${daysUntilExpiry} jour(s)`;

    showNotification(title, {
      body,
      tag: `renewal-${treatmentName}`,
      requireInteraction: false,
    });
  };

  const notifyPharmacyVisit = (visitDate: string, pharmacyName?: string) => {
    if (!preferences.pushEnabled || !preferences.pharmacyVisitReminder) return;

    const title = `💊 Visite pharmacie`;
    const body = pharmacyName 
      ? `Rendez-vous demain (${visitDate})\n${pharmacyName}`
      : `Rendez-vous demain (${visitDate})`;

    showNotification(title, {
      body,
      tag: `pharmacy-visit-${visitDate}`,
      requireInteraction: false,
    });
  };

  return {
    preferences,
    updatePreferences,
    isSupported,
    permission,
    requestPermission,
    scheduleMedicationReminder,
    scheduleDelayedReminder,
    notifyLowStock,
    notifyPrescriptionRenewal,
    notifyPharmacyVisit,
  };
};
