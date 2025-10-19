import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NotificationPreferences {
  pushEnabled: boolean;
  medicationReminders: boolean;
  medicationReminderDelay: number; // minutes after scheduled time
  medicationReminderBefore: number; // minutes before scheduled time
  stockAlerts: boolean;
  prescriptionRenewal: boolean;
  prescriptionRenewalDays: number[]; // e.g., [10, 2] for J-10 and J-2
  pharmacyVisitReminder: boolean;
  pharmacyVisitReminderDays: number; // days before visit
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
    pharmacyVisit: "💊 Visite pharmacie",
  },
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

  const showNotification = (title: string, options?: NotificationOptions): boolean => {
    console.log("showNotification called with:", { title, options });
    console.log("Current state:", { isSupported, permission });
    
    if (!isSupported || permission !== "granted") {
      console.error("Cannot show notification - isSupported:", isSupported, "permission:", permission);
      return false;
    }

    try {
      console.log("Creating new Notification...");
      const notification = new Notification(title, {
        // Retirer icône pour test mobile
        // icon: "/icon-192.png",
        // badge: "/icon-192.png",
        requireInteraction: true,
        ...options,
      });
      
      console.log("Notification created successfully:", notification);
      
      // Ajouter des event listeners pour debug
      notification.onshow = () => console.log("Notification shown");
      notification.onerror = (e) => console.error("Notification error:", e);
      notification.onclose = () => console.log("Notification closed");
      
      return true;
    } catch (error) {
      console.error("Error showing notification:", error);
      return false;
    }
  };

  const sendTestNotification = (): boolean => {
    console.log("PWA Test notification - permission:", permission);
    console.log("PWA Test notification - isSupported:", isSupported);
    console.log("🔄 VERSION TEST: 20-10-2025-01:00 - SANS ICONE");
    
    if (permission !== "granted") {
      console.error("Permission not granted:", permission);
      toast.error("Permission requise pour les notifications");
      return false;
    }
    
    console.log("Attempting to show PWA notification...");
    const success = showNotification("💊 Test de notification", {
      body: "Si vous voyez ceci, les notifications PWA fonctionnent parfaitement !",
      requireInteraction: true,
    });
    
    console.log("PWA notification result:", success);
    
    if (success) {
      toast.success("Notification PWA programmée ! Vérifiez vos notifications");
    } else {
      toast.error("Erreur lors de l'envoi PWA");
    }
    
    return success;
  };

  const scheduleBeforeMedicationReminder = (
    medicationName: string,
    time: string,
    dosage: string
  ) => {
    if (!preferences.pushEnabled || !preferences.medicationReminders) return;

    const title = preferences.customMessages.medicationReminder;
    const body = `${medicationName} - ${dosage}\nDans ${preferences.medicationReminderBefore} minutes (${time})`;

    showNotification(title, {
      body,
      tag: `before-medication-${medicationName}-${time}`,
      requireInteraction: true,
    });
  };

  const scheduleMedicationReminder = (
    medicationName: string,
    time: string,
    dosage: string
  ) => {
    if (!preferences.pushEnabled || !preferences.medicationReminders) return;

    const title = preferences.customMessages.medicationReminder;
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

    const title = preferences.customMessages.delayedReminder;
    const body = `Avez-vous pris ${medicationName} (${time}) ?\n${dosage}`;

    showNotification(title, {
      body,
      tag: `delayed-${medicationName}-${time}`,
      requireInteraction: true,
    });
  };

  const notifyLowStock = (medicationName: string, remaining: number, daysLeft: number) => {
    if (!preferences.pushEnabled || !preferences.stockAlerts) return;

    const title = preferences.customMessages.stockAlert;
    const body = `${medicationName}\n${remaining} comprimés restants (~${daysLeft} jours)`;

    showNotification(title, {
      body,
      tag: `stock-${medicationName}`,
      requireInteraction: false,
    });
  };

  const notifyPrescriptionRenewal = (treatmentName: string, daysUntilExpiry: number) => {
    if (!preferences.pushEnabled || !preferences.prescriptionRenewal) return;

    const title = preferences.customMessages.prescriptionRenewal;
    const body = `${treatmentName}\nExpire dans ${daysUntilExpiry} jour(s)`;

    showNotification(title, {
      body,
      tag: `renewal-${treatmentName}`,
      requireInteraction: false,
    });
  };

  const notifyPharmacyVisit = (visitDate: string, pharmacyName?: string) => {
    if (!preferences.pushEnabled || !preferences.pharmacyVisitReminder) return;

    const title = preferences.customMessages.pharmacyVisit;
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
    sendTestNotification,
    scheduleBeforeMedicationReminder,
    scheduleMedicationReminder,
    scheduleDelayedReminder,
    notifyLowStock,
    notifyPrescriptionRenewal,
    notifyPharmacyVisit,
  };
};
