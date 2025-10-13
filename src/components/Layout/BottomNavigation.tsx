import { NavLink, useLocation } from "react-router-dom"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"

export function BottomNavigation() {
  const location = useLocation()

  const { data: navItems } = useQuery({
    queryKey: ["navigation-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("navigation_items")
        .select("*")
        .eq("is_active", true)
        .order("position");
      
      if (error) throw error;
      return data;
    },
  });

  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.Home;
  };

  if (!navItems?.length) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = getIconComponent(item.icon)
          
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[64px] transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110 transition-transform")} />
              <span className="text-xs font-medium">{item.name}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
