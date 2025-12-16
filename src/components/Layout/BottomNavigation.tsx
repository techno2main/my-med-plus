import { useLocation } from "react-router-dom"
import { useNavigationScroll } from "./hooks/useNavigationScroll"
import { useNavigationItems } from "./hooks/useNavigationItems"
import { NavItem } from "./components/NavItem"

export function BottomNavigation() {
  const location = useLocation()
  const {
    scrollContainerRef,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
  } = useNavigationScroll()

  const { data: navItems } = useNavigationItems()

  if (!navItems || navItems.length === 0) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm pb-safe">
      <div className="flex items-center justify-around h-16 px-1 max-w-4xl mx-auto">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            path={item.path}
            icon={item.icon}
            name={item.name}
            isActive={location.pathname === item.path}
          />
        ))}
      </div>
    </nav>
  )
}
