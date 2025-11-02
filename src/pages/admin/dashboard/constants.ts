import { Navigation, Bug } from "lucide-react";
import type { AdminRoute } from "./types";

export const adminRoutes: AdminRoute[] = [
  {
    title: "Menu de navigation",
    description: "Gérer la barre de navigation",
    icon: Navigation,
    path: "/settings/navigation",
  },
  {
    title: "Diagnostic des notifications",
    description: "Diagnostiquer les notifications",
    icon: Bug,
    path: "/notifications/debug",
  },
];
