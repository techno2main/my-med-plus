import { LucideIcon } from "lucide-react";

export interface AdminRoute {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  badge?: string;
  disabled?: boolean;
}

export interface AdminSection {
  name: string;
  routes: AdminRoute[];
}
