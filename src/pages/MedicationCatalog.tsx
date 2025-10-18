import { useState, useEffect } from "react"
import { AppLayout } from "@/components/Layout/AppLayout"
import { Pill } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TimeSelect } from "@/components/ui/time-select"
import { Plus, Trash2, Edit, Search, ArrowLeft } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNavigate } from "react-router-dom"

// Fonctions utilitaires pour la détection automatique des prises
const detectTakesFromDosage = (dosage: string): { count: number; moments: string[] } => {
  const text = dosage.toLowerCase().trim();
  
  // 1. Priorité aux indications numériques explicites
  const numericMatch = text.match(/(\d+)\s*(fois|x)\s*(par\s*jour|\/jour)/i);
  if (numericMatch) return { count: parseInt(numericMatch[1]), moments: [] };
  
  // 2. Détection par moments de la journée
  const moments = [];
  if (/matin|matinée|lever|réveil/i.test(text)) moments.push('matin');
  if (/midi|déjeuner/i.test(text)) moments.push('midi');
  if (/après.midi|après midi|aprem|apm/i.test(text)) moments.push('apres-midi');
  if (/soir|soirée/i.test(text)) moments.push('soir');
  if (/coucher/i.test(text)) moments.push('coucher');
  if (/nuit|nocturne/i.test(text)) moments.push('nuit');
  
  if (moments.length > 0) return { count: moments.length, moments };
  
  // 3. Détection par conjonctions
  if (/ et | puis | avec /i.test(text)) {
    return { count: text.split(/ et | puis | avec /i).length, moments: [] };
  }
  
  // 4. Par défaut : 1 prise
  return { count: 1, moments: [] };
};

const getDefaultTimes = (numberOfTakes: number, detectedMoments: string[] = []): string[] => {
  // Si des moments spécifiques ont été détectés, les utiliser
  if (detectedMoments.length > 0) {
    const timeMap: { [key: string]: string } = {
      'matin': '09:30',      // 06:00-11:59 → 09:30
      'midi': '12:30',       // 12:00-12:59 → 12:30
      'apres-midi': '16:00', // 13:00-18:59 → 16:00
      'soir': '19:30',       // 19:00-22:00 → 19:30
      'coucher': '22:30',    // 22:01-23:59 → 22:30
      'nuit': '03:00'        // 00:00-05:59 → 03:00
    };
    
    return detectedMoments.map(moment => timeMap[moment] || '09:00');
  }
  
  // Sinon, utiliser la répartition par défaut
  switch(numberOfTakes) {
    case 1: return ['09:30'];
    case 2: return ['09:30', '19:30'];
    case 3: return ['09:30', '12:30', '19:30'];
    case 4: return ['09:30', '12:30', '16:00', '19:30'];
    default: return Array(numberOfTakes).fill(0).map((_, i) => {
      const hour = 8 + (i * 12 / numberOfTakes);
      return `${Math.floor(hour).toString().padStart(2, '0')}:00`;
    });
  }
};

interface MedicationCatalog {
  id: string
  name: string
  pathology: string | null
  default_dosage: string | null
  dosage_amount: string | null
  description: string | null
  initial_stock: number
  min_threshold: number
  default_times: string[] | null
  total_stock?: number
  effective_threshold?: number
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
    dosage_amount: "",
    description: "",
    initial_stock: "0",
    min_threshold: "10",
    default_times: [] as string[]
  })

  useEffect(() => {
    loadMedications()
    loadPathologies()
  }, [])

  const getStockColor = (stock: number, threshold: number) => {
    if (stock === 0) return "text-danger"
    if (stock <= threshold) return "text-warning"
    return "text-success"
  }

  const getStockBgColor = (stock: number, threshold: number) => {
    if (stock === 0) return "bg-danger/10"
    if (stock <= threshold) return "bg-warning/10"
    return "bg-success/10"
  }

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
      
      // Pour chaque médicament du catalogue, calculer le stock total et le seuil minimal
      const medsWithStock = await Promise.all(
        (data || []).map(async (med) => {
          const { data: stockData } = await supabase
            .from("medications")
            .select("current_stock, min_threshold")
            .eq("catalog_id", med.id);
          
          const totalStock = stockData?.reduce((sum, item) => sum + (item.current_stock || 0), 0) || 0;
          
          // Calculer le seuil minimal moyen ou utiliser celui du catalogue
          const avgThreshold = stockData && stockData.length > 0 
            ? Math.round(stockData.reduce((sum, item) => sum + (item.min_threshold || 10), 0) / stockData.length)
            : med.min_threshold || 10;
          
          return {
            ...med,
            total_stock: totalStock,
            effective_threshold: avgThreshold
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
            dosage_amount: formData.dosage_amount || null,
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
            dosage_amount: formData.dosage_amount || null,
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
        dosage_amount: med.dosage_amount || "",
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
        dosage_amount: "",
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
      dosage_amount: "",
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
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/referentials")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <header className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Médicaments</h1>
              <p className="text-sm text-muted-foreground">{medications.length} médicament(s)</p>
            </div>
            <Button className="gradient-primary" onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-1" />
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
                  {/* Ligne 1: Nom + Dosage */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{med.name}</h3>
                      {med.dosage_amount && (
                        <span className="text-sm text-muted-foreground">
                          {med.dosage_amount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(med)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDelete(med.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Ligne 2: Pathologie + Stock */}
                  {(med.pathology || med.total_stock !== undefined) && (
                    <div className="flex items-center justify-between">
                      <div>
                        {med.pathology && (
                          <Badge variant="secondary">
                            {med.pathology}
                          </Badge>
                        )}
                      </div>
                      {med.total_stock !== undefined && (
                        <button
                          onClick={() => handleStockClick(med.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getStockBgColor(med.total_stock, med.effective_threshold || 10)} hover:opacity-80 transition-opacity cursor-pointer`}
                        >
                          <Pill className={`h-3 w-3 ${getStockColor(med.total_stock, med.effective_threshold || 10)}`} />
                          <span className={`text-xs font-semibold ${getStockColor(med.total_stock, med.effective_threshold || 10)}`}>
                            {med.total_stock}
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Ligne 3: Posologie */}
                  {med.default_dosage && (
                    <p className="text-sm text-muted-foreground">
                      {med.default_dosage}
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
          <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={closeDialog} className="h-8 w-8 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle>
                  {editingMed ? "Modifier" : "Ajouter"}
                </DialogTitle>
              </div>
              <DialogDescription className="text-muted-foreground">
                {editingMed 
                  ? "Modifier les informations du médicament"
                  : "Ajoutez un nouveau médicament au référentiel"
                }
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 py-4 pb-8">
                {/* Première ligne : Nom + Dosage */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du médicament *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Xigduo"
                      className="bg-surface"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dosage_amount">Dosage</Label>
                    <Input
                      id="dosage_amount"
                      value={formData.dosage_amount}
                      onChange={(e) => setFormData({ ...formData, dosage_amount: e.target.value })}
                      placeholder="Ex: 5mg/1000mg"
                      className="bg-surface"
                    />
                  </div>
                </div>

                {/* Deuxième ligne : Pathologie seule */}
                <div className="space-y-2">
                  <Label htmlFor="pathology">Pathologie</Label>
                  <Select value={formData.pathology} onValueChange={(value) => setFormData({ ...formData, pathology: value })}>
                    <SelectTrigger className="bg-surface">
                      <SelectValue placeholder="Sélectionner une pathologie" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {pathologies.map((pathology) => (
                        <SelectItem key={pathology.id} value={pathology.name}>
                          {pathology.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Metformine"
                    className="bg-surface"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dosage">Posologie</Label>
                  <Input
                    id="dosage"
                    value={formData.default_dosage}
                    onChange={(e) => {
                      const newDosage = e.target.value;
                      const detectedTakes = detectTakesFromDosage(newDosage);
                      const newTimes = getDefaultTimes(detectedTakes.count, detectedTakes.moments);
                      setFormData({ 
                        ...formData, 
                        default_dosage: newDosage,
                        default_times: newTimes
                      });
                    }}
                    placeholder="Ex: 1 comprimé matin et soir"
                    className="bg-surface"
                  />
                </div>

                {/* Heures de prises - Design compact */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Heures de prises par défaut</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({ ...formData, default_times: [...formData.default_times, "09:00"] });
                      }}
                    >
                      + Ajouter
                    </Button>
                  </div>
                  
                  {formData.default_times.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3 border border-dashed rounded-md">
                      Aucune heure de prise définie
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {formData.default_times.map((time, index) => (
                        <div key={index} className="flex items-center gap-1 p-2 rounded-md border bg-muted/30">
                          <TimeSelect
                            value={time}
                            onValueChange={(value) => {
                              const newTimes = [...formData.default_times];
                              newTimes[index] = value;
                              setFormData({ ...formData, default_times: newTimes });
                            }}
                            className="bg-surface w-24 h-8 text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newTimes = formData.default_times.filter((_, i) => i !== index);
                              setFormData({ ...formData, default_times: newTimes });
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Ces heures seront pré-remplies lors de l'ajout d'un traitement
                  </p>
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
                  </div>
                </div>

                {editingMed && editingMed.total_stock !== undefined && (
                  <div className={`p-3 rounded-lg border ${
                    editingMed.total_stock === 0 
                      ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30'
                      : editingMed.total_stock <= (editingMed.min_threshold || 10)
                      ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/30'
                      : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30'
                  }`}>
                    <p className="text-sm text-muted-foreground mb-1">Stock actuel total</p>
                    <button 
                      onClick={() => handleStockClick(editingMed.id)}
                      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <Pill className={`h-4 w-4 ${
                        editingMed.total_stock === 0 
                          ? 'text-red-600 dark:text-red-400'
                          : editingMed.total_stock <= (editingMed.min_threshold || 10)
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-green-600 dark:text-green-400'
                      }`} />
                      <span className={`text-base font-semibold ${
                        editingMed.total_stock === 0 
                          ? 'text-red-600 dark:text-red-400'
                          : editingMed.total_stock <= (editingMed.min_threshold || 10)
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>{editingMed.total_stock} unités</span>
                    </button>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="px-6 py-4 border-t shrink-0 bg-background">
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeDialog} className="flex-1 h-9">
                  Annuler
                </Button>
                <Button onClick={handleSubmit} className="flex-1 gradient-primary h-9">
                  {editingMed ? "Modifier" : "Ajouter"}
                </Button>
              </div>
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
