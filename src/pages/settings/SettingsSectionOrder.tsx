import { useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { GripVertical } from "lucide-react";
import { useSettingsSectionOrder } from "@/hooks/useSettingsSectionOrder";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";
import type { SettingsSection } from "@/hooks/useSettingsSectionOrder";

interface SortableItemProps {
  section: SettingsSection;
  onToggle: (id: string) => void;
}

function SortableItem({ section, onToggle }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-4 bg-card rounded-lg border",
        isDragging && "opacity-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1">
        <p className="font-medium">{section.title}</p>
      </div>

      <Switch
        checked={section.visible}
        onCheckedChange={() => onToggle(section.id)}
      />
    </div>
  );
}

export default function SettingsSectionOrder() {
  const navigate = useNavigate();
  const { sections, loading, reorderSections, toggleSectionVisibility } = useSettingsSectionOrder();
  const [localSections, setLocalSections] = useState(sections);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localSections.findIndex((s) => s.id === active.id);
      const newIndex = localSections.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(localSections, oldIndex, newIndex);
      setLocalSections(newOrder);
      reorderSections(newOrder);
    }
  };

  const handleToggle = (id: string) => {
    const updated = localSections.map(s =>
      s.id === id ? { ...s, visible: !s.visible } : s
    );
    setLocalSections(updated);
    toggleSectionVisibility(id);
  };

  // Mettre à jour localSections quand sections change
  if (sections !== localSections && !loading) {
    setLocalSections(sections);
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 pb-6">
        <div className="sticky top-0 z-20 bg-background pt-6 pb-4">
          <PageHeader 
            title="Ordre des sections"
            subtitle="Réorganisez les sections des paramètres"
            backTo="/settings"
          />
        </div>

        <div className="mt-4 space-y-6">

        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold">Instructions</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Glisser-déposer pour réorganiser
            </p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localSections.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localSections.map((section) => (
                  <SortableItem
                    key={section.id}
                    section={section}
                    onToggle={handleToggle}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </Card>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Astuce :</strong> Les sections masquées n'apparaîtront pas dans la page Paramètres. 
            Pour y accéder à nouveau, il faut les réactiver ici.
          </p>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}
