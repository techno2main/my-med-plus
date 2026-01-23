import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";
import { getIconComponent } from "../constants/navigationConfig";

interface SortableNavigationItemProps {
  item: any;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  isAdmin: boolean;
  getItemVisibility: (itemId: string, originalIsActive: boolean) => boolean;
  hasUnsavedChanges: boolean;
  isToggleDisabled?: boolean;
}

export function SortableNavigationItem({ 
  item, 
  onEdit, 
  onDelete, 
  onToggleVisibility, 
  onMoveUp, 
  onMoveDown, 
  isFirst, 
  isLast, 
  isAdmin, 
  getItemVisibility, 
  hasUnsavedChanges,
  isToggleDisabled = false
}: SortableNavigationItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = getIconComponent(item.icon);
  const currentVisibility = getItemVisibility(item.id, item.is_active);
  const hasChange = currentVisibility !== item.is_active;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3",
        isDragging && "shadow-lg ring-2 ring-primary/20",
        hasChange && "ring-2 ring-blue-500/50"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Zone de drag séparée des boutons */}
        <div 
          className="cursor-grab active:cursor-grabbing p-2 -m-2 hover:bg-muted/50 rounded"
          {...attributes}
          {...listeners}
        >
          <div className="flex flex-col gap-0.5">
            <div className="w-4 h-0.5 bg-muted-foreground/40 rounded"></div>
            <div className="w-4 h-0.5 bg-muted-foreground/40 rounded"></div>
            <div className="w-4 h-0.5 bg-muted-foreground/40 rounded"></div>
          </div>
        </div>
        
        {/* Boutons de réorganisation - accessibles à tous */}
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp(item.id);
            }}
            disabled={isFirst}
          >
            <ChevronUp className={cn(
              "h-4 w-4",
              isFirst ? "text-muted-foreground/30" : "text-muted-foreground"
            )} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown(item.id);
            }}
            disabled={isLast}
          >
            <ChevronDown className={cn(
              "h-4 w-4",
              isLast ? "text-muted-foreground/30" : "text-muted-foreground"
            )} />
          </Button>
        </div>
        
        <div className={cn(
          "flex gap-3 flex-1 min-w-0",
          isAdmin ? "items-start" : "items-center"
        )}>
          <div className={`p-2 rounded-full shrink-0 ${currentVisibility ? 'bg-primary/10' : 'bg-muted'}`}>
            <Icon className={`h-5 w-5 ${currentVisibility ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          
          <div className={cn("flex-1 min-w-0", isAdmin && "space-y-2")}>
            {/* Ligne 1 : Titre + Toggle Affiché/Masqué */}
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{item.name}</h3>
              
              {/* Toggle comme pour les médicaments - désactivé pour le menu Plus */}
              {!isToggleDisabled && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "text-sm",
                    currentVisibility 
                      ? "text-green-500" 
                      : "text-orange-500"
                  )}>
                    {currentVisibility ? "Affiché" : "Masqué"}
                  </span>
                  <button
                    type="button"
                    aria-pressed={currentVisibility}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(item.id);
                    }}
                    className={cn(
                    "relative w-8 h-5 flex items-center rounded-full transition-colors focus:outline-none border-2",
                    currentVisibility ? "bg-green-100 border-green-400" : "bg-orange-100 border-orange-400"
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-4 h-4 rounded-full shadow-md transform transition-transform",
                      currentVisibility ? "translate-x-3 bg-green-500" : "translate-x-0 bg-orange-500"
                    )}
                  />
                </button>
              </div>
              )}
            </div>
            
            {/* Ligne 2 : Chemin à gauche + Icônes à droite */}
            <div className="flex items-center justify-between gap-3">
              {isAdmin && (
                <p className="text-sm text-muted-foreground truncate flex-1">{item.path}</p>
              )}
              
              {/* Icônes d'action */}
              <div className={cn("flex gap-1 shrink-0", !isAdmin && "ml-auto")}>
                {/* Boutons Éditer et Supprimer - admin uniquement */}
                {isAdmin && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(item);
                      }}
                      title="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
