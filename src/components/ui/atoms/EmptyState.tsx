import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateVisual {
  /**
   * Icon to display above the title (optional)
   */
  icon?: LucideIcon;
  /**
   * Optional icon color class (e.g., "text-success", "text-muted-foreground")
   */
  iconColor?: string;
  /**
   * Title/heading of the empty state (optional)
   */
  title?: string;
}

interface EmptyStateContent {
  /**
   * Description text explaining the empty state
   */
  description: string;
  /**
   * Custom children to render instead of default layout (optional)
   */
  children?: ReactNode;
}

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary";
}

interface EmptyStateProps {
  visual?: EmptyStateVisual;
  content: EmptyStateContent;
  action?: EmptyStateAction;
}

/**
 * Generic EmptyState component following Atomic Design principles.
 * Used to display empty states across the application with consistent styling.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   visual={{ icon: CheckCircle2, iconColor: "text-success", title: "Tout est à jour !" }}
 *   content={{ description: "Aucune prise manquée détectée" }}
 *   action={{ label: "Retour à l'accueil", onClick: () => navigate("/") }}
 * />
 * ```
 */
export function EmptyState({
  visual,
  content,
  action,
}: EmptyStateProps) {
  const Icon = visual?.icon;
  const iconColor = visual?.iconColor || "text-muted-foreground";
  
  return (
    <Card className="p-12 text-center">
      {content.children || (
        <>
          {Icon && <Icon className={`h-12 w-12 mx-auto mb-4 ${iconColor}`} />}
          {visual?.title && <h3 className="font-semibold text-lg mb-2">{visual.title}</h3>}
          <p className="text-muted-foreground mb-4">{content.description}</p>
          {action && (
            <Button variant={action.variant || "default"} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </>
      )}
    </Card>
  );
}
