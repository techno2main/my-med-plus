import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { autoCleanInvalidTokens } from './lib/auth-cleaner';

// Nettoyer les tokens invalides au démarrage (silencieux)
autoCleanInvalidTokens();

// Configure StatusBar for mobile platforms
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
  
  // Demander les permissions de notification au démarrage
  LocalNotifications.requestPermissions().then(result => {
    console.log("📱 Permissions notifications:", result.display);
  }).catch(err => {
    console.error("❌ Erreur permissions notifications:", err);
  });
  
  // Handle Android back button
  CapacitorApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      // On the root page, minimize app instead of closing
      CapacitorApp.minimizeApp();
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="health-plus-theme">
    <App />
  </ThemeProvider>
);
