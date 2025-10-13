import { NavLink, useLocation } from "react-router-dom"
import { Home, Pill, Package, Calendar, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", icon: Home, label: "Accueil" },
  { to: "/treatments", icon: Pill, label: "Traitements" },
  { to: "/stock", icon: Package, label: "Stock" },
  { to: "/calendar", icon: Calendar, label: "Agenda" },
  { to: "/settings", icon: Settings, label: "Plus" },
]

export function BottomNavigation() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to
          const Icon = item.icon
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[64px] transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110 transition-transform")} />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
