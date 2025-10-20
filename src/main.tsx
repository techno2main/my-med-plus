import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

// Configure StatusBar for mobile platforms
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="health-plus-theme">
    <App />
  </ThemeProvider>
);
