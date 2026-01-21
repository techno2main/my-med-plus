import { ReactNode } from "react"
import { ScrollToTop } from "@/components/ScrollToTop"
import { BottomNavigation } from "./BottomNavigation"
import { AppHeader } from "./AppHeader"
import { ProfileCompletionBanner } from "@/components/Profile/ProfileCompletionBanner"
import { usePullToRefresh } from "@/hooks/usePullToRefresh"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: ReactNode
  className?: string
  showBottomNav?: boolean
  showHeader?: boolean
}

export function AppLayout({ children, className, showBottomNav = true, showHeader = true }: AppLayoutProps) {
  // Activer le pull-to-refresh pour vérifier les mises à jour
  usePullToRefresh();
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showHeader && <AppHeader />}
      <main className={cn("flex-1 pb-24", showHeader && "pt-[120px]", className)}>
        {children}
      </main>
      {showBottomNav && <BottomNavigation />}
      <ScrollToTop />
      <ProfileCompletionBanner />
    </div>
  )
}
