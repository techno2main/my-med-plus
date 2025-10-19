import { useEffect, useState } from "react";
import { Capacitor } from '@capacitor/core';
import { useNotifications } from "./useNotifications";
import { useNativeNotifications } from "./useNativeNotifications";

/**
 * Hook de détection automatique du mode notifications
 * - Mode PWA : utilise useNotifications (API Web Notifications)  
 * - Mode Native : utilise useNativeNotifications (Capacitor Local Notifications)
 */
export const useNotificationSystem = () => {
  const [isNative, setIsNative] = useState(false);
  
  // Hook PWA (Web Notifications)
  const pwaNotifications = useNotifications();
  
  // Hook Native (Capacitor Local Notifications)
  const nativeNotifications = useNativeNotifications();

  useEffect(() => {
    // Détection du mode d'exécution
    const isCapacitorNative = Capacitor.isNativePlatform();
    setIsNative(isCapacitorNative);
    
    console.log("Notification system detected:", isCapacitorNative ? "Native (Capacitor)" : "PWA (Web)");
  }, []);

  // Retourne le hook approprié selon le mode détecté avec interface unifiée
  if (isNative) {
    return {
      ...nativeNotifications,
      mode: 'native' as const,
      // Uniformisation de l'interface
      permission: nativeNotifications.hasPermission ? 'granted' : 'default' as NotificationPermission
    };
  } else {
    return {
      ...pwaNotifications,
      mode: 'pwa' as const,
      // Uniformisation de l'interface  
      hasPermission: pwaNotifications.permission === 'granted'
    };
  }
};