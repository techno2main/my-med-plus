import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

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
      
      {/* Pastille verte pour les admins */}
      {isAdmin && (
        <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full shadow-sm">
          <div className="h-full w-full bg-emerald-400 rounded-full animate-ping opacity-75 absolute" />
          <div className="h-full w-full bg-emerald-500 rounded-full relative" />
        </div>
      )}
    </div>
  )
}