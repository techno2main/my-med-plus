import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AvatarWithBadge } from "@/components/ui/avatar-with-badge"
import { Switch } from "@/components/ui/switch"
import { User, Moon, Sun } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { supabase } from "@/integrations/supabase/client"
import { useTheme } from "@/components/theme-provider"
import { useUserRole } from "@/hooks/useUserRole"
import { getAuthenticatedUser } from "@/lib/auth-guard"

export function AppHeader() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { isAdmin } = useUserRole()
  const currentDate = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })
  const currentTime = format(new Date(), "HH:mm")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const { data: user, error } = await getAuthenticatedUser()
      if (error || !user) {
        console.warn('[AppHeader] Utilisateur non authentifié:', error?.message)
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle()
      
      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url)
      }
    } catch (error) {
      console.error("[AppHeader] Error loading profile:", error)
    }
  }

  return (
    <header className="bg-background border-b border-border py-4 sticky top-0 z-50 pt-safe-android">
      <div className="container max-w-2xl mx-auto px-3 md:px-4 space-y-2">
        <div className="flex items-center justify-between">
          <h1 
            className="text-2xl font-bold gradient-primary bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
            MyHealth+
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                className="data-[state=checked]:bg-primary scale-75"
              />
              <Moon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <AvatarWithBadge
              src={avatarUrl || undefined}
              alt="Avatar utilisateur"
              fallback={<User className="h-5 w-5" />}
              isAdmin={isAdmin}
              className="cursor-pointer"
              onClick={() => navigate("/profile")}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground capitalize">{currentDate} • {currentTime}</p>
      </div>
    </header>
  )
}
