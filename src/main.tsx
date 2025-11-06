import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { autoCleanInvalidTokens } from './lib/auth-cleaner';

// Nettoyer les tokens invalides au démarrage (silencieux)
autoCleanInvalidTokens();

// Configure StatusBar for mobile platforms
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
  
  // Configurer la couleur de la barre de statut selon le thème au démarrage
  const updateStatusBar = async () => {
    try {
      const theme = localStorage.getItem('health-plus-theme') || 'dark';
      
      if (theme === 'dark') {
        // Mode sombre : fond bleu foncé, icônes blanches
        await StatusBar.setBackgroundColor({ color: '#0D1117' });
        await StatusBar.setStyle({ style: Style.Dark });
      } else {
        // Mode clair : fond bleu Material, icônes blanches
        await StatusBar.setBackgroundColor({ color: '#1976D2' });
        await StatusBar.setStyle({ style: Style.Dark });
      }
      
      console.log(`📱 StatusBar initialisée au démarrage: theme=${theme}`);
    } catch (error) {
      console.error('❌ Erreur initialisation StatusBar:', error);
    }
  };
  
  updateStatusBar();
  
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
