import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  onAdd?: () => void;
  showAddButton?: boolean;
}

export function PageHeader({ 
  title, 
  subtitle, 
  backTo = "/",
  onAdd,
  showAddButton = false 
}: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" onClick={() => navigate(backTo)}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex-1">
        <h1 className="text-lg font-bold">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {showAddButton && onAdd && (
        <Button onClick={onAdd} size="icon" className="h-10 w-10">
          <Plus className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
