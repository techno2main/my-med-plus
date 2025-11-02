import { Bug } from "lucide-react";
import type { AdminRoute } from "./types";

export const adminRoutes: AdminRoute[] = [
  {
    title: "Diagnostic des notifications",
    description: "Diagnostiquer les notifications",
    icon: Bug,
    path: "/notifications/debug",
    helpText: "Outil de diagnostic pour tester et déboguer le système de notifications. Permet de visualiser les notifications planifiées et de tester leur déclenchement.",
  },
];
