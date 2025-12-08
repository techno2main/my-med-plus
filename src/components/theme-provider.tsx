import { createContext, useContext, useEffect, useState } from "react"
import { StatusBar, Style } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(storageKey) as Theme;
    // Si aucune valeur stockée, on utilise "system" par défaut
    if (!stored) {
      localStorage.setItem(storageKey, "system");
      return "system";
    }
    return stored;
  })

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      
      // Update status bar for system theme
      if (Capacitor.isNativePlatform()) {
        if (systemTheme === "dark") {
          StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
          StatusBar.setBackgroundColor({ color: '#000000' }).catch(() => {})
        } else {
          StatusBar.setStyle({ style: Style.Light }).catch(() => {})
          StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {})
        }
      }
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove("light", "dark")
        root.classList.add(e.matches ? "dark" : "light")
        
        // Update status bar on system theme change
        if (Capacitor.isNativePlatform()) {
          if (e.matches) {
            StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
            StatusBar.setBackgroundColor({ color: '#000000' }).catch(() => {})
          } else {
            StatusBar.setStyle({ style: Style.Light }).catch(() => {})
            StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {})
          }
        }
      }
      
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }

    root.classList.add(theme)
    
    // Update status bar based on selected theme
    if (Capacitor.isNativePlatform()) {
      if (theme === "dark") {
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
        StatusBar.setBackgroundColor({ color: '#000000' }).catch(() => {})
      } else {
        StatusBar.setStyle({ style: Style.Light }).catch(() => {})
        StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {})
      }
    }
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
