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
  const activeItemRef = useRef<HTMLAnchorElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const { isAdmin } = useUserRole()

  // Scroll to active item when route changes
  useEffect(() => {
    if (activeItemRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const activeItem = activeItemRef.current
      
      const itemLeft = activeItem.offsetLeft
      const itemWidth = activeItem.offsetWidth
      const containerWidth = container.offsetWidth
      
      // Calculate scroll position to center the active item
      const scrollTo = itemLeft - (containerWidth / 2) + (itemWidth / 2)
      
      container.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      })
    }
  }, [location.pathname])

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
  console.log('BottomNavigation - isAdmin:', isAdmin);
  console.log('BottomNavigation - navItems:', navItems);
  
  const filteredNavItems = navItems?.filter(item => {
    console.log('Checking item:', item.name, item.path, 'isAdmin:', isAdmin);
    if (item.path === '/admin') {
      return isAdmin;
    }
    return true;
  });
  
  console.log('BottomNavigation - filteredNavItems:', filteredNavItems);

  if (!filteredNavItems?.length) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm pb-safe">
      <div 
        ref={scrollContainerRef}
        className={cn(
          "overflow-x-auto scrollbar-hide md:overflow-hidden",
          isDragging ? "cursor-grabbing" : "cursor-grab md:cursor-default"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center h-16 px-2 gap-2 md:justify-center md:max-w-4xl md:mx-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = getIconComponent(item.icon)
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                ref={isActive ? activeItemRef : null}
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
