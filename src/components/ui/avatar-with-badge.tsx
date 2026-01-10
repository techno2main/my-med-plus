import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Shield } from "lucide-react"

interface AvatarData {
  src?: string
  alt?: string
  fallback?: React.ReactNode
}

interface BadgeConfig {
  isAdmin?: boolean
  notificationCount?: number
  className?: string
  onClick?: () => void
}

interface AvatarWithBadgeProps {
  avatar: AvatarData
  badge?: BadgeConfig
}

export function AvatarWithBadge({
  avatar,
  badge,
}: AvatarWithBadgeProps) {
  const { src, alt = "Avatar", fallback } = avatar
  const { isAdmin = false, notificationCount = 0, className, onClick } = badge || {}
  
  return (
    <div className="relative inline-block">
      <Avatar className={cn("h-10 w-10", className)} onClick={onClick}>
        {src ? (
          <AvatarImage src={src} alt={alt} />
        ) : (
          <AvatarFallback>{fallback}</AvatarFallback>
        )}
      </Avatar>
      
      {/* Badge de notification pour champs manquants */}
      {notificationCount > 0 && (
        <div className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-background text-xs font-bold animate-pulse">
          {notificationCount}
        </div>
      )}
      
      {/* Icône shield pour les admins (position différente si notification) */}
      {isAdmin && notificationCount === 0 && (
        <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-sm border border-background">
          <Shield className="h-2.5 w-2.5" />
        </div>
      )}
      
      {/* Afficher les deux badges si admin ET notification */}
      {isAdmin && notificationCount > 0 && (
        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-sm border border-background">
          <Shield className="h-2.5 w-2.5" />
        </div>
      )}
    </div>
  )
}
