import { NavLink, useLocation } from "react-router-dom"
import { useRef, useEffect, useState } from "react"
import { 
  Home, Pill, Package, Calendar, Settings,
  User, Heart, Bell, Shield, FileText,
  ClipboardList, Users, Database, Smartphone,
  Moon, Sun, Mail, Phone, MapPin, Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { useUserRole } from "@/hooks/useUserRole"

const ICON_MAP: Record<string, any> = {
  Home, Pill, Package, Calendar, Settings,
  User, Heart, Bell, Shield, FileText,
  ClipboardList, Users, Database, Smartphone,
  Moon, Sun, Mail, Phone, MapPin, Search
};

export function BottomNavigation() {
  const location = useLocation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const { isAdmin } = useUserRole()

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
    return ICON_MAP[iconName] || Home;
  };

  // Handle mouse drag to scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Filter items based on admin status
  const filteredNavItems = navItems?.filter(item => {
    if (item.path === '/admin') {
      return isAdmin;
    }
    return true;
  });

  if (!filteredNavItems?.length) return null;

  const shouldScroll = filteredNavItems.length > 5;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm pb-safe">
      <div 
        ref={scrollContainerRef}
        className={cn(
          shouldScroll ? "overflow-x-auto scrollbar-hide" : "overflow-hidden",
          isDragging && shouldScroll ? "cursor-grabbing" : shouldScroll ? "cursor-grab" : ""
        )}
        onMouseDown={shouldScroll ? handleMouseDown : undefined}
        onMouseMove={shouldScroll ? handleMouseMove : undefined}
        onMouseUp={shouldScroll ? handleMouseUp : undefined}
        onMouseLeave={shouldScroll ? handleMouseLeave : undefined}
      >
        <div className={cn(
          "flex items-center h-16 px-2 gap-2",
          shouldScroll ? "w-max" : "justify-center max-w-2xl mx-auto"
        )}>
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = getIconComponent(item.icon)
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[80px] flex-shrink-0 transition-colors select-none",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onDragStart={(e) => e.preventDefault()}
              >
                <Icon className={cn("h-5 w-5", isActive && "scale-110 transition-transform")} />
                <span className="text-xs font-medium whitespace-nowrap">{item.name}</span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
