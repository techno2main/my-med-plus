import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import type { AdminRoute } from "../types";

interface QuickAccessCardProps {
  route: AdminRoute;
  onClick: () => void;
}

export const QuickAccessCard = ({ route, onClick }: QuickAccessCardProps) => {
  const Icon = route.icon;

  return (
    <Card 
      className={`p-4 ${route.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md transition-shadow'}`}
      onClick={route.disabled ? undefined : onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{route.title}</h3>
            <p className="text-sm text-muted-foreground">{route.description}</p>
          </div>
        </div>
        {!route.disabled && (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      {route.badge && (
        <div className="mt-2">
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
            {route.badge}
          </span>
        </div>
      )}
    </Card>
  );
};
