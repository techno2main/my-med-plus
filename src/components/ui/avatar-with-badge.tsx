import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Shield } from "lucide-react"

interface AvatarWithBadgeProps {
  src?: string
  alt?: string
  fallback?: React.ReactNode
  isAdmin?: boolean
  className?: string
  onClick?: () => void
}

export function AvatarWithBadge({
  src,
  alt = "Avatar",
  fallback,
  isAdmin = false,
  className,
  onClick
}: AvatarWithBadgeProps) {
  return (
    <div className="relative inline-block">
      <Avatar className={cn("h-10 w-10", className)} onClick={onClick}>
        {src ? (
          <AvatarImage src={src} alt={alt} />
        ) : (
          <AvatarFallback>{fallback}</AvatarFallback>
        )}
      </Avatar>
      
      {/* Icône shield pour les admins */}
      {isAdmin && (
        <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-sm border border-background">
          <Shield className="h-2.5 w-2.5" />
        </div>
      )}
    </div>
  )
}