import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeaderWithHelp } from "@/components/Layout/PageHeaderWithHelp";
import { useActiveTab } from "@/pages/settings/components/PersonnalisationTabs";
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableNavigationItem } from "./components/SortableNavigationItem";
import { NavigationItemDialog } from "./components/NavigationItemDialog";
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog";
import { useNavigationManager } from "./hooks/useNavigationManager";

export function NavigationManagerContent() {
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const activeTab = useActiveTab();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    icon: "",
    position: 0,
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

  const showUnsavedChangesAlert = () => {
    const { dismiss } = toast({
      description: (
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex flex-col">
            <span className="font-medium">Enregistrez d'abord</span>
            <span className="text-sm">les modifications de visibilité</span>
          </div>
        </div>
      ),
      action: (
        <button
          onClick={() => dismiss()}
          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          OK
        </button>
      ),
    });
  };

  const { data: navItems, isLoading } = useQuery({
    queryKey: ["navigation-items", isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("navigation_items")
        .select("*")
        .order("position");
      
      if (error) throw error;
      
      // ADMIN : retourne la config globale sans préférences personnelles
      if (isAdmin) {
        return data;
      }
      
      // NON-ADMIN : charge et applique les préférences personnelles
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userPrefs } = await supabase
          .from("user_preferences")
          .select("navigation_menu_preferences")
          .eq("user_id", user.id)
          .maybeSingle() as { data: { navigation_menu_preferences?: Array<{id: string, is_active: boolean, position?: number}> } | null };
        
        const preferences = userPrefs?.navigation_menu_preferences || [];
        
        // Appliquer les préférences utilisateur (is_active + position personnalisée)
        const itemsWithPrefs = data.map(item => {
          const userPref = preferences.find(p => p.id === item.id);
          return {
            ...item,
            is_active: userPref !== undefined ? userPref.is_active : item.is_active,
            position: userPref?.position !== undefined ? userPref.position : item.position
          };
        });
        
        // Trier par position personnalisée
        return itemsWithPrefs.sort((a, b) => a.position - b.position);
      }
      
      return data;
    },
  });

  const {
    createMutation,
    updateMutation,
    deleteMutation,
    toggleVisibilityMutation,
    updatePositionsMutation,
  } = useNavigationManager();

  const resetForm = () => {
    setFormData({
      name: "",
      path: "",
      icon: "",
      position: 0,
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

  const handleSubmit = () => {
    if (!formData.name || !formData.path || !formData.icon || !formData.position) {
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, item: formData }, {
        onSuccess: () => resetForm(),
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => resetForm(),
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id || !navItems) return;
    
    // Bloquer si changements non enregistrés
    if (hasUnsavedChanges) {
      showUnsavedChangesAlert();
      return;
    }
    
    const oldIndex = navItems.findIndex((item) => item.id === active.id);
    const newIndex = navItems.findIndex((item) => item.id === over.id);
    
    const reorderedItems = arrayMove(navItems, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      position: idx + 1
    }));
    const updates = reorderedItems.map((item) => ({
      id: item.id,
      position: item.position,
    }));

    queryClient.setQueryData(["navigation-items"], reorderedItems);
    updatePositionsMutation.mutate(updates);
  };

  const handleMoveUp = (id: string) => {
    if (!navItems) return;
    
    // Bloquer si changements non enregistrés
    if (hasUnsavedChanges) {
      showUnsavedChangesAlert();
      return;
    }
    
    const index = navItems.findIndex((item) => item.id === id);
    if (index === -1 || index === 0) return;

    const reorderedItems = arrayMove(navItems, index, index - 1).map((item, idx) => ({
      ...item,
      position: idx + 1
    }));
    const updates = reorderedItems.map((item) => ({
      id: item.id,
      position: item.position,
    }));

    queryClient.setQueryData(["navigation-items"], reorderedItems);
    updatePositionsMutation.mutate(updates);
  };

  const handleMoveDown = (id: string) => {
    if (!navItems) return;
    
    // Bloquer si changements non enregistrés
    if (hasUnsavedChanges) {
      showUnsavedChangesAlert();
      return;
    }
    
    const index = navItems.findIndex((item) => item.id === id);
    if (index === -1 || index >= navItems.length - 1) return;

    const reorderedItems = arrayMove(navItems, index, index + 1).map((item, idx) => ({
      ...item,
      position: idx + 1
    }));
    const updates = reorderedItems.map((item) => ({
      id: item.id,
      position: item.position,
    }));

    queryClient.setQueryData(["navigation-items"], reorderedItems);
    updatePositionsMutation.mutate(updates);
  };

  const handleToggleVisibility = (id: string) => {
    const item = navItems?.find((item) => item.id === id);
    if (!item) return;
    
    setPendingChanges(prev => {
      const currentPendingState = prev[id];
      const newState = currentPendingState !== undefined ? !currentPendingState : !item.is_active;
      
      let newPendingChanges;
      
      if (newState === item.is_active) {
        const { [id]: _, ...rest } = prev;
        newPendingChanges = rest;
      } else {
        newPendingChanges = {
          ...prev,
          [id]: newState
        };
      }
      
      setHasUnsavedChanges(Object.keys(newPendingChanges).length > 0);
      return newPendingChanges;
    });
  };

  const handleSaveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    
    const updates = Object.entries(pendingChanges).map(([id, is_active]) => ({
      id,
      is_active
    }));
    
    toggleVisibilityMutation.mutate(updates, {
      onSuccess: async () => {
        setPendingChanges({});
        setHasUnsavedChanges(false);
        // Forcer le rechargement des données
        await queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
      }
    });
  };

  const handleCancelChanges = () => {
    setPendingChanges({});
    setHasUnsavedChanges(false);
  };

  const getItemVisibility = (itemId: string, originalIsActive: boolean): boolean => {
    return pendingChanges[itemId] !== undefined ? pendingChanges[itemId] : originalIsActive;
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
      setItemToDelete(null);
    }
  };

  const tabLabel = activeTab === "menus" ? "Menus" : "Apparence";
  
  return (
    <div className="space-y-4">
      <PageHeaderWithHelp
        title="Gestion des menus"
        subtitle={tabLabel}
        helpText={isAdmin 
          ? "Réorganisez les éléments par glisser-déposer ou avec les flèches, ajoutez, modifiez ou supprimez des sections selon vos besoins. Le menu Plus ne peut pas être masqué car c'est le centre névralgique de l'application." 
          : "Personnalisez votre barre de navigation : réorganisez les éléments et masquez les sections que vous n'utilisez pas. Le menu Plus reste toujours visible."
        }
        className="pl-9"
      />

      {isAdmin && (
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="w-full"
          size="lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un élément
        </Button>
      )}

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
                <SortableNavigationItem
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={(id) => {
                    setItemToDelete(id);
                    setDeleteDialogOpen(true);
                  }}
                  onToggleVisibility={handleToggleVisibility}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  isFirst={index === 0}
                  isLast={index === navItems.length - 1}
                  isAdmin={isAdmin}
                  getItemVisibility={getItemVisibility}
                  hasUnsavedChanges={hasUnsavedChanges}
                  isToggleDisabled={item.path === '/settings'}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {hasUnsavedChanges && (
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancelChanges}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSaveChanges}
            className="flex-1 gradient-primary"
          >
            Enregistrer
          </Button>
        </div>
      )}

      {isAdmin && (
        <NavigationItemDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          editingId={editingId}
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handleSubmit}
          onReset={resetForm}
        />
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
