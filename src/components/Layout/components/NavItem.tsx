import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { getIconComponent } from "../utils/navigationIcons"

interface NavItemProps {
  path: string
  icon: string
  name: string
  isActive: boolean
}

/**
 * Composant représentant un élément de la barre de navigation
 * Affiche une icône et un label avec état actif/inactif
 */
export function NavItem({ path, icon, name, isActive }: NavItemProps) {
  const Icon = getIconComponent(icon)
  
  return (
    <NavLink
      to={path}
      className={cn(
        "flex flex-col items-center justify-center gap-1 py-2 flex-1 transition-colors select-none",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5", isActive && "scale-110 transition-transform")} />
      <span className="text-xs font-medium whitespace-nowrap">{name}</span>
    </NavLink>
  )
}
