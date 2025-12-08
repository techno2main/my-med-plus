import { Card } from "@/components/ui/card";
import { Moon, Sun, Monitor, Check, Eye, EyeOff } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";

const themeOptions = [
  { value: "light" as const, label: "Clair", icon: Sun },
  { value: "dark" as const, label: "Sombre", icon: Moon },
  { value: "system" as const, label: "Système", icon: Monitor },
];

export function ThemeCard() {
  const { theme, setTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4 space-y-4">
      <div 
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-3 rounded-full bg-primary/10">
          <Moon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Apparence</h3>
          <p className="text-sm text-muted-foreground">Thème de l'interface</p>
        </div>
        {isExpanded ? (
          <EyeOff className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Eye className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {isExpanded && (
        <div className="space-y-2 pl-15">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = theme === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
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
      )}
    </Card>
  );
}
