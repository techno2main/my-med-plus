import { useEffect, useState } from "react";
import { Capacitor } from '@capacitor/core';
import { useNotifications } from "./useNotifications";
import { useNativeNotifications } from "./useNativeNotifications";

// Mode debug pour les logs (false en production)
const DEBUG_NOTIFICATION_SYSTEM = false;

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
    
    // Sur mobile (même en PWA), privilégier le mode natif pour un meilleur message
    // (même si ça ne marche pas vraiment sans Capacitor, au moins pas de message d'erreur)
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const shouldUseNative = isCapacitorNative || isMobile;
    
    setIsNative(shouldUseNative);
    
    // Log uniquement si debug activé
    if (DEBUG_NOTIFICATION_SYSTEM) {
      console.log("Notification system detected:", {
        platform: shouldUseNative ? "Native (Capacitor)" : "PWA (Web)",
        isCapacitorNative,
        isMobile
      });
    }
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