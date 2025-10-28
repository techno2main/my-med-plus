import { useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Trash2, ChevronUp, ChevronDown, Pencil, ArrowLeft,
  Home, Pill, Package, Calendar, Settings,
  User, Heart, Bell, Shield, FileText,
  ClipboardList, Users, Database, Smartphone,
  Moon, Sun, Mail, Phone, MapPin, Search
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

const ICON_MAP: Record<string, any> = {
  Home, Pill, Package, Calendar, Settings,
  User, Heart, Bell, Shield, FileText,
  ClipboardList, Users, Database, Smartphone,
  Moon, Sun, Mail, Phone, MapPin, Search
};

const iconNames = Object.keys(ICON_MAP);

interface SortableItemProps {
  item: any;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

function SortableItem({ item, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: SortableItemProps) {
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
  };

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || Home;
  };

  const Icon = getIconComponent(item.icon);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <div className="flex items-center gap-3">
        <div 
          className="flex flex-col gap-1 cursor-move"
          {...attributes}
          {...listeners}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp(item.id);
            }}
            disabled={isFirst}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
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
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <ChevronDown className={cn(
              "h-4 w-4",
              isLast ? "text-muted-foreground/30" : "text-muted-foreground"
            )} />
          </Button>
        </div>
        
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 rounded-full ${item.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
            <Icon className={`h-5 w-5 ${item.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{item.name}</h3>
              {!item.is_active && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  Inactif
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{item.path}</p>
          </div>
        </div>

        <div className="flex gap-2" onPointerDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Êtes-vous sûr de vouloir supprimer cet item ?")) {
                onDelete(item.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function NavigationManager() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    icon: "Home",
    position: 1,
    is_active: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        tolerance: 5,
        delay: 0,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: navItems, isLoading } = useQuery({
    queryKey: ["navigation-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("navigation_items")
        .select("*")
        .order("position");
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (item: typeof formData) => {
      const { error } = await supabase
        .from("navigation_items")
        .insert([item]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
      toast({ title: "Item ajouté avec succès" });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'item",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, item }: { id: string; item: typeof formData }) => {
      const { error } = await supabase
        .from("navigation_items")
        .update(item)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
      toast({ title: "Item modifié avec succès" });
      resetForm();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("navigation_items")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
      toast({ title: "Item supprimé avec succès" });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'item",
        variant: "destructive",
      });
    },
  });

  const updatePositionsMutation = useMutation({
    mutationFn: async (items: Array<{ id: string; position: number }>) => {
      const updates = items.map(({ id, position }) =>
        supabase
          .from("navigation_items")
          .update({ position })
          .eq("id", id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de réorganiser les items",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      path: "",
      icon: "Home",
      position: 1,
      is_active: true,
    });
    setEditingId(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      path: item.path,
      icon: item.icon,
      position: item.position,
      is_active: item.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, item: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && navItems) {
      const oldIndex = navItems.findIndex((item) => item.id === active.id);
      const newIndex = navItems.findIndex((item) => item.id === over.id);

      const reorderedItems = arrayMove(navItems, oldIndex, newIndex);
      
      const updates = reorderedItems.map((item, index) => ({
        id: item.id,
        position: index + 1,
      }));

      queryClient.setQueryData(["navigation-items"], reorderedItems);
      updatePositionsMutation.mutate(updates);
    }
  };

  const handleMoveUp = (id: string) => {
    if (!navItems) return;
    const index = navItems.findIndex((item) => item.id === id);
    if (index <= 0) return;

    const reorderedItems = arrayMove(navItems, index, index - 1);
    const updates = reorderedItems.map((item, idx) => ({
      id: item.id,
      position: idx + 1,
    }));

    queryClient.setQueryData(["navigation-items"], reorderedItems);
    updatePositionsMutation.mutate(updates);
  };

  const handleMoveDown = (id: string) => {
    if (!navItems) return;
    const index = navItems.findIndex((item) => item.id === id);
    if (index === -1 || index >= navItems.length - 1) return;

    const reorderedItems = arrayMove(navItems, index, index + 1);
    const updates = reorderedItems.map((item, idx) => ({
      id: item.id,
      position: idx + 1,
    }));

    queryClient.setQueryData(["navigation-items"], reorderedItems);
    updatePositionsMutation.mutate(updates);
  };

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || Home;
  };

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader 
          title="Navigation"
          subtitle="Configurer la navigation"
          backTo="/admin"
          showAddButton
          onAdd={() => setIsDialogOpen(true)}
        />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={navItems?.map(item => item.id) || []}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {isLoading ? (
                <Card className="p-6 text-center text-muted-foreground">
                  Chargement...
                </Card>
              ) : navItems?.length === 0 ? (
                <Card className="p-6 text-center text-muted-foreground">
                  Aucun item de navigation
                </Card>
              ) : (
                navItems?.map((item, index) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={deleteMutation.mutate}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    isFirst={index === 0}
                    isLast={index === navItems.length - 1}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsDialogOpen(false)} 
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle>
                {editingId ? "Modifier" : "Ajouter"}
              </DialogTitle>
              <DialogDescription>
                {editingId ? "Modifier les paramètres de cet élément de navigation" : "Ajouter un nouvel élément au menu de navigation"}
              </DialogDescription>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom affiché</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Accueil"
                  className="bg-surface"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="path">Lien</Label>
                <Input
                  id="path"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="/"
                  className="bg-surface"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icône</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger className="bg-surface">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] bg-background">
                    {iconNames.map((iconName) => {
                      const Icon = getIconComponent(iconName);
                      return (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {iconName}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  type="number"
                  min="1"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                  className="bg-surface"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Actif</Label>
              </div>
            </div>
          </ScrollArea>

          <div className="px-6 py-4 border-t shrink-0 bg-background">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)} 
                className="flex-1 h-9"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1 gradient-primary h-9"
              >
                {editingId ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}