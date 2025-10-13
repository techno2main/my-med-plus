import { useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, GripVertical, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import * as LucideIcons from "lucide-react";

const iconNames = [
  "Home", "Pill", "Package", "Calendar", "Settings",
  "User", "Heart", "Bell", "Shield", "FileText",
  "ClipboardList", "Users", "Database", "Smartphone",
  "Moon", "Sun", "Mail", "Phone", "MapPin", "Search"
];

export default function NavigationManager() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    icon: "Home",
    position: 1,
    is_active: true,
  });

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

  const resetForm = () => {
    setFormData({
      name: "",
      path: "",
      icon: "Home",
      position: 1,
      is_active: true,
    });
    setEditingId(null);
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, item: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || LucideIcons.Home;
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Gestion de la navigation</h1>
            <p className="text-muted-foreground">Configurez les items de votre barre de navigation</p>
          </div>
        </div>

        {/* Formulaire */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? "Modifier l'item" : "Ajouter un item"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom affiché</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Accueil"
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
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icône</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
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
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Actif</Label>
              </div>

              <div className="flex gap-2">
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                )}
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {editingId ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Liste des items */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Items de navigation</h3>
          
          {isLoading ? (
            <Card className="p-6 text-center text-muted-foreground">
              Chargement...
            </Card>
          ) : navItems?.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              Aucun item de navigation
            </Card>
          ) : (
            navItems?.map((item) => {
              const Icon = getIconComponent(item.icon);
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    
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
                        <p className="text-sm text-muted-foreground">
                          {item.path} • Position {item.position}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Êtes-vous sûr de vouloir supprimer cet item ?")) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
