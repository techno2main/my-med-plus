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
import { useProfileCompletion } from "@/hooks/useProfileCompletion"
import { generateUserInitials } from "./helpers"
import { getAuthenticatedUser } from "@/lib/auth-guard"
import { useStatusBarTheme } from "@/hooks/useStatusBarTheme"

export function AppHeader() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { isAdmin } = useUserRole()
  const { missingFieldsCount, isComplete, isLoading: profileLoading, firstMissingField } = useProfileCompletion()
  
  // Mettre à jour la barre de statut selon le thème
  useStatusBarTheme(theme)
  const currentDate = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })
  const currentTime = format(new Date(), "HH:mm")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userInitials, setUserInitials] = useState<string>("")

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
        .select("avatar_url, first_name, last_name")
        .eq("id", user.id)
        .maybeSingle()
      
      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url)
      }
      
      // Générer les initiales
      const initials = generateUserInitials(profile, user.email)
      if (initials) {
        setUserInitials(initials)
      }
    } catch (error) {
      console.error("[AppHeader] Error loading profile:", error)
    }
  }

  return (
    <header className="border-b border-border fixed top-0 left-0 right-0 z-50 bg-[#1976D2] dark:bg-[#0D1117]">
      <div className="pt-safe pt-14 pb-4 container max-w-2xl mx-auto px-3 md:px-4 space-y-2">
        <div className="flex items-center justify-between">
          <h1 
            className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity text-white"
            onClick={() => navigate("/")}
          >
            MyHealth+
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5 text-white/70" />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                className="data-[state=checked]:bg-blue-300 scale-75"
              />
              <Moon className="h-3.5 w-3.5 text-white/70" />
            </div>
            <AvatarWithBadge
              avatar={{
                src: avatarUrl || undefined,
                alt: "Avatar utilisateur",
                fallback: (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-400 to-green-600 text-white font-semibold text-sm">
                    {userInitials || <User className="h-5 w-5" />}
                  </div>
                ),
              }}
              badge={{
                isAdmin,
                // Ne pas afficher de notification pendant le chargement ou si profil complet
                notificationCount: profileLoading || isComplete ? 0 : missingFieldsCount,
                className: "cursor-pointer touch-manipulation",
                onClick: () => {
                  // Naviguer vers le profil avec le champ à focus
                  const params = new URLSearchParams();
                  params.set('edit', 'true');
                  if (firstMissingField) {
                    params.set('focus', firstMissingField);
                  }
                  navigate(`/profile?${params.toString()}`);
                },
              }}
            />
          </div>
        </div>
        <p className="text-sm capitalize text-white/90">{currentDate} • {currentTime}</p>
      </div>
    </header>
  )
}
