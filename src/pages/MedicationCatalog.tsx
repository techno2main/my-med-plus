import { useState, useEffect } from "react"
import { AppLayout } from "@/components/Layout/AppLayout"
import { Pill } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Edit, Search, ArrowLeft } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNavigate } from "react-router-dom"

interface MedicationCatalog {
  id: string
  name: string
  pathology: string | null
  default_dosage: string | null
  description: string | null
  initial_stock: number
  min_threshold: number
  default_times: string[] | null
  total_stock?: number
}

const MedicationCatalog = () => {
  const navigate = useNavigate()
  const [medications, setMedications] = useState<MedicationCatalog[]>([])
  const [pathologies, setPathologies] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingMed, setEditingMed] = useState<MedicationCatalog | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    pathology: "",
    default_dosage: "",
    description: "",
    initial_stock: "0",
    min_threshold: "10",
    default_times: [] as string[]
  })

  useEffect(() => {
    loadMedications()
    loadPathologies()
  }, [])

  const loadPathologies = async () => {
    try {
      const { data, error } = await supabase
        .from("pathologies")
        .select("id, name")
        .order("name")

      if (error) throw error
      setPathologies(data || [])
    } catch (error) {
      console.error("Error loading pathologies:", error)
    }
  }

  const loadMedications = async () => {
    try {
      const { data, error } = await supabase
        .from("medication_catalog")
        .select("*")
        .order("name")

      if (error) throw error
      
      // Pour chaque médicament du catalogue, calculer le stock total
      const medsWithStock = await Promise.all(
        (data || []).map(async (med) => {
          const { data: stockData } = await supabase
            .from("medications")
            .select("current_stock")
            .eq("catalog_id", med.id);
          
          const totalStock = stockData?.reduce((sum, item) => sum + (item.current_stock || 0), 0) || 0;
          
          return {
            ...med,
            total_stock: totalStock
          };
        })
      );
      
      setMedications(medsWithStock)
    } catch (error) {
      console.error("Error loading medications:", error)
      toast.error("Erreur lors du chargement du référentiel")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Le nom du médicament est obligatoire")
      return
    }

    try {
      if (editingMed) {
        const { error } = await supabase
          .from("medication_catalog")
          .update({
            name: formData.name,
            pathology: formData.pathology || null,
            default_dosage: formData.default_dosage || null,
            description: formData.description || null,
            initial_stock: parseInt(formData.initial_stock) || 0,
            min_threshold: parseInt(formData.min_threshold) || 10,
            default_times: formData.default_times.length > 0 ? formData.default_times : null
          })
          .eq("id", editingMed.id)

        if (error) throw error
        toast.success("Médicament modifié avec succès")
      } else {
        const { error } = await supabase
          .from("medication_catalog")
          .insert({
            name: formData.name,
            pathology: formData.pathology || null,
            default_dosage: formData.default_dosage || null,
            description: formData.description || null,
            initial_stock: parseInt(formData.initial_stock) || 0,
            min_threshold: parseInt(formData.min_threshold) || 10,
            default_times: formData.default_times.length > 0 ? formData.default_times : null
          })

        if (error) throw error
        toast.success("Médicament ajouté avec succès")
      }

      loadMedications()
      closeDialog()
    } catch (error) {
      console.error("Error saving medication:", error)
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      const { error } = await supabase
        .from("medication_catalog")
        .delete()
        .eq("id", deletingId)

      if (error) throw error
      toast.success("Médicament supprimé")
      loadMedications()
    } catch (error) {
      console.error("Error deleting medication:", error)
      toast.error("Erreur lors de la suppression")
    } finally {
      setShowDeleteAlert(false)
      setDeletingId(null)
    }
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
    setShowDeleteAlert(true)
  }

  const openDialog = (med?: MedicationCatalog) => {
    if (med) {
      setEditingMed(med)
      setFormData({
        name: med.name,
        pathology: med.pathology || "",
        default_dosage: med.default_dosage || "",
        description: med.description || "",
        initial_stock: String(med.initial_stock || 0),
        min_threshold: String(med.min_threshold || 10),
        default_times: med.default_times || []
      })
    } else {
      setEditingMed(null)
      setFormData({ 
        name: "", 
        pathology: "", 
        default_dosage: "", 
        description: "",
        initial_stock: "0",
        min_threshold: "10",
        default_times: []
      })
    }
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setEditingMed(null)
    setFormData({ 
      name: "", 
      pathology: "", 
      default_dosage: "", 
      description: "",
      initial_stock: "0",
      min_threshold: "10",
      default_times: []
    })
  }

  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.pathology?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleStockClick = async (catalogId: string) => {
    // Trouver le premier médicament dans les traitements qui utilise ce catalog_id
    const { data } = await supabase
      .from("medications")
      .select("id")
      .eq("catalog_id", catalogId)
      .limit(1)
      .single();
    
    if (data) {
      navigate(`/stock/${data.id}`);
    } else {
      navigate("/stock");
    }
  }


  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/referentials")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <header className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Référentiel de médicaments</h1>
              <p className="text-sm text-muted-foreground">{medications.length} médicament(s) dans le référentiel</p>
            </div>
            <Button className="gradient-primary" onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </header>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un médicament..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-surface"
          />
        </div>

        {/* Medications Grid */}
        {loading ? (
          <p>Chargement...</p>
        ) : filteredMedications.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Aucun médicament trouvé</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredMedications.map((med) => (
              <Card key={med.id} className="p-4 surface-elevated hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  {/* Ligne 1: Nom + Stock */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      <h3 className="font-semibold text-lg">{med.name}</h3>
                      {med.total_stock !== undefined && (
                        <button
                          onClick={() => handleStockClick(med.id)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                          <Pill className="h-3 w-3 text-primary" />
                          <span className="text-xs font-semibold text-primary">
                            {med.total_stock}
                          </span>
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(med)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDelete(med.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Ligne 2: Pathologie */}
                  {med.pathology && (
                    <div>
                      <Badge variant="secondary">
                        {med.pathology}
                      </Badge>
                    </div>
                  )}

                  {/* Ligne 3: Posologie */}
                  {med.default_dosage && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Posologie :</span> {med.default_dosage}
                    </p>
                  )}

                  {/* Ligne 4: Description */}
                  {med.description && (
                    <p className="text-sm text-muted-foreground">
                      {med.description}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={closeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMed ? "Modifier le médicament" : "Ajouter un médicament"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du médicament *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Doliprane 1000mg"
                  className="bg-surface"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pathology">Pathologie</Label>
                <Select value={formData.pathology} onValueChange={(value) => setFormData({ ...formData, pathology: value })}>
                  <SelectTrigger className="bg-surface">
                    <SelectValue placeholder="Sélectionner une pathologie" />
                  </SelectTrigger>
                  <SelectContent>
                    {pathologies.map((pathology) => (
                      <SelectItem key={pathology.id} value={pathology.name}>
                        {pathology.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosage">Posologie par défaut</Label>
                <Input
                  id="dosage"
                  value={formData.default_dosage}
                  onChange={(e) => setFormData({ ...formData, default_dosage: e.target.value })}
                  placeholder="Ex: 1 comprimé jusqu'à 3 fois par jour"
                  className="bg-surface"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Antalgique et antipyrétique"
                  className="bg-surface"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initial_stock">Stock initial</Label>
                  <Input
                    id="initial_stock"
                    type="number"
                    min="0"
                    value={formData.initial_stock}
                    onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
                    placeholder="0"
                    className="bg-surface"
                    disabled={!!editingMed}
                  />
                  <p className="text-xs text-muted-foreground">Stock par défaut lors de l'ajout</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_threshold">Seuil minimum</Label>
                  <Input
                    id="min_threshold"
                    type="number"
                    min="0"
                    value={formData.min_threshold}
                    onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                    placeholder="10"
                    className="bg-surface"
                    disabled={!!editingMed}
                  />
                  <p className="text-xs text-muted-foreground">Seuil d'alerte par défaut</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Heures de prises par défaut</Label>
                <div className="space-y-2">
                  {formData.default_times.map((time, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => {
                          const newTimes = [...formData.default_times];
                          newTimes[index] = e.target.value;
                          setFormData({ ...formData, default_times: newTimes });
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newTimes = formData.default_times.filter((_, i) => i !== index);
                          setFormData({ ...formData, default_times: newTimes });
                        }}
                      >
                        Supprimer
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({ ...formData, default_times: [...formData.default_times, "09:00"] });
                    }}
                  >
                    + Ajouter une heure
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Ces heures seront pré-remplies automatiquement lors de l'ajout d'un traitement
                  </p>
                </div>
              </div>

              {editingMed && editingMed.total_stock !== undefined && (
                <div className="p-3 rounded-lg bg-muted/30 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Stock actuel total</p>
                  <button 
                    onClick={() => handleStockClick(editingMed.id)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <Pill className="h-4 w-4 text-primary" />
                    <p className="text-lg font-semibold text-primary">{editingMed.total_stock} unités</p>
                  </button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Somme de tous les stocks dans vos traitements
                  </p>
                </div>
              )}

              <Button onClick={handleSubmit} className="w-full gradient-primary">
                {editingMed ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert */}
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer ce médicament ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  )
}

export default MedicationCatalog
