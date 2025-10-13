import { useState, useEffect } from "react"
import { AppLayout } from "@/components/Layout/AppLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2, Edit, Search } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface Pathology {
  id: string
  name: string
  description: string | null
}

const Pathologies = () => {
  const [pathologies, setPathologies] = useState<Pathology[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<Pathology | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })

  useEffect(() => {
    loadPathologies()
  }, [])

  const loadPathologies = async () => {
    try {
      const { data, error } = await supabase
        .from("pathologies")
        .select("*")
        .order("name")

      if (error) throw error
      setPathologies(data || [])
    } catch (error) {
      console.error("Error loading pathologies:", error)
      toast.error("Erreur lors du chargement des pathologies")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Le nom de la pathologie est obligatoire")
      return
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from("pathologies")
          .update({
            name: formData.name,
            description: formData.description || null
          })
          .eq("id", editingItem.id)

        if (error) throw error
        toast.success("Pathologie modifiée avec succès")
      } else {
        const { error } = await supabase
          .from("pathologies")
          .insert({
            name: formData.name,
            description: formData.description || null
          })

        if (error) throw error
        toast.success("Pathologie ajoutée avec succès")
      }

      loadPathologies()
      closeDialog()
    } catch (error) {
      console.error("Error saving pathology:", error)
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette pathologie ?")) return

    try {
      const { error } = await supabase
        .from("pathologies")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast.success("Pathologie supprimée")
      loadPathologies()
    } catch (error) {
      console.error("Error deleting pathology:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const openDialog = (item?: Pathology) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        description: item.description || ""
      })
    } else {
      setEditingItem(null)
      setFormData({ name: "", description: "" })
    }
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setEditingItem(null)
    setFormData({ name: "", description: "" })
  }

  const filteredPathologies = pathologies.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pathologies</h1>
            <p className="text-sm text-muted-foreground">{pathologies.length} pathologie(s) enregistrée(s)</p>
          </div>
          <Button className="gradient-primary" onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une pathologie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-surface"
          />
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : filteredPathologies.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Aucune pathologie trouvée</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredPathologies.map((item) => (
              <Card key={item.id} className="p-4 surface-elevated hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold flex-1">{item.name}</h3>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDialog(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {item.description && (
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showDialog} onOpenChange={closeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Modifier la pathologie" : "Ajouter une pathologie"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la pathologie *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Diabète Type 2"
                  className="bg-surface"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la pathologie..."
                  className="bg-surface"
                />
              </div>

              <Button onClick={handleSubmit} className="w-full gradient-primary">
                {editingItem ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}

export default Pathologies
