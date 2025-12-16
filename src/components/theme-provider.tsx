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

// Helper functions extracted to reduce nesting
const updateStatusBar = (isDark: boolean) => {
  if (!Capacitor.isNativePlatform()) return;
  
  const style = isDark ? Style.Dark : Style.Light;
  const color = isDark ? '#000000' : '#ffffff';
  
  StatusBar.setStyle({ style }).catch(() => {});
  StatusBar.setBackgroundColor({ color }).catch(() => {});
};

const applyThemeToRoot = (themeClass: string) => {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(themeClass);
};

const getSystemTheme = (): "dark" | "light" => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const handleSystemThemeChange = (e: MediaQueryListEvent) => {
  const newTheme = e.matches ? "dark" : "light";
  applyThemeToRoot(newTheme);
  updateStatusBar(e.matches);
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(storageKey) as Theme;
    if (!stored) {
      localStorage.setItem(storageKey, "system");
      return "system";
    }
    return stored;
  })

  useEffect(() => {
    if (theme === "system") {
      const systemTheme = getSystemTheme();
      applyThemeToRoot(systemTheme);
      updateStatusBar(systemTheme === "dark");
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", handleSystemThemeChange);
      return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
    }

    applyThemeToRoot(theme);
    updateStatusBar(theme === "dark");
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
