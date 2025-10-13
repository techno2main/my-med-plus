import { useState, useEffect } from "react"
import { AppLayout } from "@/components/Layout/AppLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Trash2, Edit, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface Allergy {
  id: string
  name: string
  severity: string | null
  description: string | null
}

const Allergies = () => {
  const [allergies, setAllergies] = useState<Allergy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<Allergy | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    severity: "",
    description: ""
  })

  useEffect(() => {
    loadAllergies()
  }, [])

  const loadAllergies = async () => {
    try {
      const { data, error } = await supabase
        .from("allergies")
        .select("*")
        .order("name")

      if (error) throw error
      setAllergies(data || [])
    } catch (error) {
      console.error("Error loading allergies:", error)
      toast.error("Erreur lors du chargement des allergies")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Le nom de l'allergie est obligatoire")
      return
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from("allergies")
          .update({
            name: formData.name,
            severity: formData.severity || null,
            description: formData.description || null
          })
          .eq("id", editingItem.id)

        if (error) throw error
        toast.success("Allergie modifiée avec succès")
      } else {
        const { error } = await supabase
          .from("allergies")
          .insert({
            name: formData.name,
            severity: formData.severity || null,
            description: formData.description || null
          })

        if (error) throw error
        toast.success("Allergie ajoutée avec succès")
      }

      loadAllergies()
      closeDialog()
    } catch (error) {
      console.error("Error saving allergy:", error)
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette allergie ?")) return

    try {
      const { error } = await supabase
        .from("allergies")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast.success("Allergie supprimée")
      loadAllergies()
    } catch (error) {
      console.error("Error deleting allergy:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const openDialog = (item?: Allergy) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        severity: item.severity || "",
        description: item.description || ""
      })
    } else {
      setEditingItem(null)
      setFormData({ name: "", severity: "", description: "" })
    }
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setEditingItem(null)
    setFormData({ name: "", severity: "", description: "" })
  }

  const filteredAllergies = allergies.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSeverityVariant = (severity: string | null) => {
    switch (severity) {
      case "Légère": return "secondary"
      case "Modérée": return "default"
      case "Sévère": return "destructive"
      default: return "outline"
    }
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Allergies</h1>
            <p className="text-sm text-muted-foreground">{allergies.length} allergie(s) enregistrée(s)</p>
          </div>
          <Button className="gradient-primary" onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </header>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une allergie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-surface"
          />
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : filteredAllergies.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Aucune allergie trouvée</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredAllergies.map((item) => (
              <Card key={item.id} className="p-4 surface-elevated hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    {item.severity && (
                      <Badge variant={getSeverityVariant(item.severity)} className="mt-1">
                        {item.severity}
                      </Badge>
                    )}
                  </div>
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
                {editingItem ? "Modifier l'allergie" : "Ajouter une allergie"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'allergie *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Amoxicilline"
                  className="bg-surface"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Sévérité</Label>
                <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                  <SelectTrigger className="bg-surface">
                    <SelectValue placeholder="Sélectionner la sévérité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Légère">Légère</SelectItem>
                    <SelectItem value="Modérée">Modérée</SelectItem>
                    <SelectItem value="Sévère">Sévère</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Symptômes ou notes..."
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

export default Allergies
