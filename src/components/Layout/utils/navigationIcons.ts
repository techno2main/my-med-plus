import { 
  Home, Pill, Package, Calendar, Settings,
  User, Heart, Bell, Shield, FileText,
  ClipboardList, Users, Database, Smartphone,
  Moon, Sun, Mail, Phone, MapPin, Search, ListPlus
} from "lucide-react"

/**
 * Mapping des noms d'icônes (stockés en DB) vers leurs composants Lucide React
 */
export const ICON_MAP: Record<string, any> = {
  Home,
  Pill,
  Package,
  Calendar,
  Settings,
  User,
  Heart,
  Bell,
  Shield,
  FileText,
  ClipboardList,
  Users,
  Database,
  Smartphone,
  Moon,
  Sun,
  Mail,
  Phone,
  MapPin,
  Search,
  ListPlus,
}

/**
 * Récupère le composant d'icône correspondant au nom
 * @param iconName - Nom de l'icône (ex: "Home", "Pill")
 * @returns Composant Lucide React ou Home par défaut
 */
export function getIconComponent(iconName: string) {
  return ICON_MAP[iconName] || Home
}
