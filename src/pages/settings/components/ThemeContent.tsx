import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const themeOptions = [
  { value: "light" as const, label: "Clair", icon: Sun },
  { value: "dark" as const, label: "Sombre", icon: Moon },
  { value: "system" as const, label: "Système", icon: Monitor },
];

export function ThemeContent() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Choisissez le thème de l'interface. Le mode "Système" s'adapte automatiquement aux préférences de votre appareil.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3">
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isSelected = theme === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
              isSelected 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                {option.label}
              </span>
            </div>
            {isSelected && <Check className="h-5 w-5 text-primary" />}
          </button>
        );
      })}
      </div>
    </div>
  );
}
