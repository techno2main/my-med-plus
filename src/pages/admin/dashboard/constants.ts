import { Navigation, Database, Bug, Clock, CalendarSync, Download } from "lucide-react";
import type { AdminRoute } from "./types";

export const adminRoutes: AdminRoute[] = [
  {
    title: "Menu de navigation",
    description: "Gérer la barre de navigation",
    icon: Navigation,
    path: "/settings/navigation",
  },
  {
    title: "Référentiels",
    description: "Gérer les données de référence",
    icon: Database,
    path: "/referentials",
  },
  {
    title: "Synchronisation calendrier",
    description: "Synchroniser avec le calendrier natif",
    icon: CalendarSync,
    path: "/calendar-sync",
  },
  {
    title: "Export de profil",
    description: "Exporter vos données de santé",
    icon: Download,
    path: "/profile-export",
  },
  {
    title: "Rattrapage des prises",
    description: "Gérer les prises manquées",
    icon: Clock,
    path: "/rattrapage",
  },
  {
    title: "Diagnostic des notifications",
    description: "Diagnostiquer les notifications",
    icon: Bug,
    path: "/notifications/debug",
  },
];
