import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { User, Moon, Sun } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { supabase } from "@/integrations/supabase/client"
import { useTheme } from "@/components/theme-provider"

export function AppHeader() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const currentDate = format(new Date(), "EEEE d MMMM yyyy", { locale: fr })
  const currentTime = format(new Date(), "HH:mm")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .maybeSingle()
        
        if (profile?.avatar_url) {
          setAvatarUrl(profile.avatar_url)
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    }
  }

  return (
    <header className="bg-background border-b border-border px-4 py-4 sticky top-0 z-50">
      <div className="container max-w-3xl mx-auto space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
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
            <Avatar className="h-10 w-10 cursor-pointer" onClick={() => navigate("/profile")}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              )}
            </Avatar>
          </div>
        </div>
        <p className="text-sm text-muted-foreground capitalize">{currentDate} • {currentTime}</p>
      </div>
    </header>
  )
}
