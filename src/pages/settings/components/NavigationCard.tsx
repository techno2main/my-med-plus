import { Card } from "@/components/ui/card";
import { ChevronRight, LucideIcon } from "lucide-react";

interface NavigationCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

export function NavigationCard({ icon: Icon, title, description, onClick }: NavigationCardProps) {
  return (
    <Card className="p-4" onClick={onClick}>
      <div className="flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Card>
  );
}
