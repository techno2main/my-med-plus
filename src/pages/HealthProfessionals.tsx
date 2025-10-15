import { useState, useEffect } from "react"
import { AppLayout } from "@/components/Layout/AppLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Edit, Search, Star, Phone, Mail, MapPin, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNavigate } from "react-router-dom"

interface HealthProfessional {
  id: string
  name: string
  type: string
  specialty: string | null
  phone: string | null
  email: string | null
  address: string | null
  is_primary_doctor: boolean | null
  user_id: string
}

const HealthProfessionals = () => {
  const [professionals, setProfessionals] = useState<HealthProfessional[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<HealthProfessional | null>(null)
  const [activeTab, setActiveTab] = useState("medecins")
  const [formData, setFormData] = useState({
    name: "",
    type: "medecin",
    specialty: "",
    phone: "",
    email: "",
    address: "",
    is_primary_doctor: false
  })

  useEffect(() => {
    loadProfessionals()
  }, [])

  const loadProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from("health_professionals")
        .select("*")
        .order("name")

      if (error) throw error
      setProfessionals(data || [])
    } catch (error) {
      console.error("Error loading professionals:", error)
      toast.error("Erreur lors du chargement des professionnels")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Le nom est obligatoire")
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not found")

      if (editingItem) {
        const { error } = await supabase
          .from("health_professionals")
          .update({
            name: formData.name,
            type: formData.type,
            specialty: formData.specialty || null,
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
            is_primary_doctor: formData.is_primary_doctor
          })
          .eq("id", editingItem.id)

        if (error) throw error
        toast.success("Professionnel modifié avec succès")
      } else {
        const { error } = await supabase
          .from("health_professionals")
          .insert({
            name: formData.name,
            type: formData.type,
            specialty: formData.specialty || null,
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
            is_primary_doctor: formData.is_primary_doctor,
            user_id: user.id
          })

        if (error) throw error
        toast.success("Professionnel ajouté avec succès")
      }

      loadProfessionals()
      closeDialog()
    } catch (error) {
      console.error("Error saving professional:", error)
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      const { error } = await supabase
        .from("health_professionals")
        .delete()
        .eq("id", deletingId)

      if (error) throw error
      toast.success("Professionnel supprimé")
      loadProfessionals()
    } catch (error) {
      console.error("Error deleting professional:", error)
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

  const openDialog = (type: string, item?: HealthProfessional) => {
    const typeMap: { [key: string]: string } = {
      'medecin': 'doctor',
      'pharmacie': 'pharmacy',
      'laboratoire': 'laboratory',
      'doctor': 'doctor',
      'pharmacy': 'pharmacy',
      'laboratory': 'laboratory'
    }
    
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        type: item.type,
        specialty: item.specialty || "",
        phone: item.phone || "",
        email: item.email || "",
        address: item.address || "",
        is_primary_doctor: item.is_primary_doctor || false
      })
    } else {
      setEditingItem(null)
      const mappedType = typeMap[type] || type
      setFormData({
        name: "",
        type: mappedType,
        specialty: "",
        phone: "",
        email: "",
        address: "",
        is_primary_doctor: false
      })
    }
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setEditingItem(null)
    setFormData({
      name: "",
      type: "medecin",
      specialty: "",
      phone: "",
      email: "",
      address: "",
      is_primary_doctor: false
    })
  }

  const filterByType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'medecins': 'doctor',
      'pharmacies': 'pharmacy',
      'laboratoires': 'laboratory',
      'doctor': 'doctor',
      'pharmacy': 'pharmacy',
      'laboratory': 'laboratory'
    }
    const mappedType = typeMap[type] || type
    
    return professionals.filter(p =>
      p.type === mappedType &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       p.specialty?.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }

  const ProfessionalCard = ({ item }: { item: HealthProfessional }) => (
    <Card className="p-4 surface-elevated hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{item.name}</h3>
            {item.is_primary_doctor && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            )}
          </div>
          {item.specialty && (
            <Badge variant="secondary" className="mt-1">
              {item.specialty}
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openDialog(item.type, item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmDelete(item.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {item.phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{item.phone}</span>
          </div>
        )}
        {item.email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{item.email}</span>
          </div>
        )}
        {item.address && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{item.address}</span>
          </div>
        )}
      </div>
    </Card>
  )

  const navigate = useNavigate()

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/referentials")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <header>
            <h1 className="text-xl font-bold">Professionnels</h1>
            <p className="text-sm text-muted-foreground">{professionals.length} professionnel(s)</p>
          </header>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-surface"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="medecins">Médecins</TabsTrigger>
            <TabsTrigger value="pharmacies">Pharmacies</TabsTrigger>
            <TabsTrigger value="laboratoires">Laboratoires</TabsTrigger>
          </TabsList>

          <TabsContent value="medecins" className="space-y-4">
            <Button className="gradient-primary w-full" onClick={() => openDialog("medecin")}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un médecin
            </Button>
            {loading ? (
              <p>Chargement...</p>
            ) : filterByType("medecins").length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Aucun médecin trouvé</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filterByType("medecins").map((item) => (
                  <ProfessionalCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pharmacies" className="space-y-4">
            <Button className="gradient-primary w-full" onClick={() => openDialog("pharmacie")}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une pharmacie
            </Button>
            {loading ? (
              <p>Chargement...</p>
            ) : filterByType("pharmacies").length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Aucune pharmacie trouvée</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filterByType("pharmacies").map((item) => (
                  <ProfessionalCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="laboratoires" className="space-y-4">
            <Button className="gradient-primary w-full" onClick={() => openDialog("laboratoire")}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un laboratoire
            </Button>
            {loading ? (
              <p>Chargement...</p>
            ) : filterByType("laboratoires").length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Aucun laboratoire trouvé</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filterByType("laboratoires").map((item) => (
                  <ProfessionalCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={showDialog} onOpenChange={closeDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={closeDialog} className="h-8 w-8 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle>
                  {editingItem ? "Modifier" : "Ajouter"}
                </DialogTitle>
              </div>
            </DialogHeader>
            
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nom complet"
                    className="bg-surface"
                  />
                </div>

                {(formData.type === "medecin" || formData.type === "doctor") && (
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Spécialité</Label>
                    <Input
                      id="specialty"
                      value={formData.specialty}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      placeholder="Ex: Cardiologue"
                      className="bg-surface"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ex: 01 23 45 67 89"
                    className="bg-surface"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemple.com"
                    className="bg-surface"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Adresse complète"
                    className="bg-surface"
                  />
                </div>

                {(formData.type === "medecin" || formData.type === "doctor") && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="primary"
                      checked={formData.is_primary_doctor}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, is_primary_doctor: checked as boolean })
                      }
                    />
                    <Label htmlFor="primary" className="cursor-pointer">
                      Médecin traitant
                    </Label>
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
                  {editingItem ? "Modifier" : "Ajouter"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Alert Dialog */}
        <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer ce professionnel de santé ? Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  )
}

export default HealthProfessionals
