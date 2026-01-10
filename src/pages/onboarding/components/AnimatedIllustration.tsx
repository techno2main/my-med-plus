import { Heart, Pill, ClipboardList, Bell, Check, Package, Rocket, TrendingDown, Calendar, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedIllustrationProps {
  type: "welcome" | "treatments" | "reminders" | "stocks" | "start";
  className?: string;
}

export function AnimatedIllustration({ type, className }: AnimatedIllustrationProps) {
  const illustrations = {
    welcome: (
      <div className="relative flex items-center justify-center">
        {/* Cercles pulsants */}
        <div className="absolute w-32 h-32 rounded-full bg-primary/20 animate-pulse-ring" />
        <div className="absolute w-24 h-24 rounded-full bg-primary/30 animate-pulse-ring animation-delay-200" />
        <div className="absolute w-16 h-16 rounded-full bg-primary/40 animate-pulse-ring animation-delay-400" />
        {/* Icône centrale */}
        <div className="relative z-10 p-6 rounded-full bg-gradient-to-br from-primary to-accent shadow-glow">
          <Heart className="h-16 w-16 text-primary-foreground animate-float" />
        </div>
      </div>
    ),
    treatments: (
      <div className="relative flex items-center justify-center gap-4">
        {/* Pilule animée */}
        <div className="animate-slide-in-left p-5 rounded-2xl bg-success/20 shadow-lg">
          <Pill className="h-14 w-14 text-success animate-float" />
        </div>
        {/* Clipboard animé */}
        <div className="animate-slide-in-right animation-delay-200 p-5 rounded-2xl bg-primary/20 shadow-lg">
          <ClipboardList className="h-14 w-14 text-primary animate-float animation-delay-300" />
        </div>
        {/* Calendrier en arrière-plan */}
        <div className="absolute -bottom-4 animate-bounce-in animation-delay-400 p-3 rounded-xl bg-accent/20 shadow-md">
          <Calendar className="h-8 w-8 text-accent" />
        </div>
      </div>
    ),
    reminders: (
      <div className="relative flex items-center justify-center">
        {/* Cloche avec animation shake */}
        <div className="relative p-6 rounded-full bg-warning/20 shadow-lg">
          <Bell className="h-16 w-16 text-warning animate-shake" />
          {/* Badge notification */}
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-danger flex items-center justify-center animate-bounce-in animation-delay-300">
            <span className="text-xs font-bold text-danger-foreground">3</span>
          </div>
        </div>
        {/* Check qui apparaît */}
        <div className="absolute -right-8 bottom-0 animate-bounce-in animation-delay-500 p-3 rounded-full bg-success/20 shadow-md">
          <Check className="h-8 w-8 text-success" />
        </div>
      </div>
    ),
    stocks: (
      <div className="relative flex flex-col items-center justify-center gap-4">
        {/* Package avec animation */}
        <div className="p-6 rounded-2xl bg-accent/20 shadow-lg animate-float">
          <Package className="h-14 w-14 text-accent" />
        </div>
        {/* Barre de progression animée */}
        <div className="w-48 h-3 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-danger via-warning to-success animate-stock-bar" />
        </div>
        {/* Icône d'alerte */}
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 animate-slide-in-left animation-delay-300 p-2 rounded-full bg-warning/20">
          <TrendingDown className="h-6 w-6 text-warning" />
        </div>
      </div>
    ),
    start: (
      <div className="relative flex items-center justify-center">
        {/* Fond décoratif */}
        <div className="absolute w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
        {/* Fusée animée */}
        <div className="relative z-10 p-6 rounded-full bg-gradient-to-br from-primary to-accent shadow-glow animate-bounce-in">
          <Rocket className="h-16 w-16 text-primary-foreground animate-float" />
        </div>
        {/* Bouclier sécurité */}
        <div className="absolute -right-6 -bottom-4 animate-slide-in-right animation-delay-400 p-3 rounded-xl bg-success/20 shadow-md">
          <Shield className="h-8 w-8 text-success" />
        </div>
      </div>
    ),
  };

  return (
    <div className={cn("w-full h-64 flex items-center justify-center", className)}>
      {illustrations[type]}
    </div>
  );
}
