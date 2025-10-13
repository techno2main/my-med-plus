import { useState, useEffect } from "react"
import { AppLayout } from "@/components/Layout/AppLayout"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pill, Plus, Clock, Calendar, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface Treatment {
  id: string
  name: string
  pathology: string | null
  start_date: string
  is_active: boolean
  medications: Array<{
    id: string
    name: string
    dosage: string
    times: string[]
    pathology: string | null
  }>
}

const Treatments = () => {
  const navigate = useNavigate()
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTreatments()
  }, [])

  const loadTreatments = async () => {
    try {
      const { data: treatmentsData, error: treatmentsError } = await supabase
        .from("treatments")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (treatmentsError) throw treatmentsError

      // Load medications for each treatment
      const treatmentsWithMeds = await Promise.all(
        (treatmentsData || []).map(async (treatment) => {
          const { data: medications } = await supabase
            .from("medications")
            .select("id, name, dosage, times")
            .eq("treatment_id", treatment.id)

          return {
            ...treatment,
            medications: (medications || []).map(med => ({
              ...med,
              pathology: null
            }))
          }
        })
      )


      setTreatments(treatmentsWithMeds)
    } catch (error) {
      console.error("Error loading treatments:", error)
      toast.error("Erreur lors du chargement des traitements")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-4 py-6">
          <p>Chargement...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <header className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Mes traitements</h1>
              <p className="text-sm text-muted-foreground">{treatments.length} traitement(s) actif(s)</p>
            </div>
            <Button className="gradient-primary" onClick={() => navigate("/treatments/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </header>

        {/* Treatments List */}
        <div className="space-y-4">
          {treatments.length === 0 ? (
            <Card className="p-12 text-center">
              <Pill className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun traitement actif</p>
            </Card>
          ) : (
            treatments.map((treatment) => (
              <Card key={treatment.id} className="p-4 surface-elevated hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  {/* Treatment Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{treatment.name}</h3>
                      <Badge variant="success" className="mt-1">
                        {treatment.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/treatments/${treatment.id}/edit`)}>
                      Modifier
                    </Button>
                  </div>

                  {/* Medications */}
                  <div className="space-y-2">
                    {treatment.medications.map((med, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <Pill className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{med.name}</p>
                            {med.pathology && (
                              <Badge variant="secondary" className="text-xs">
                                {med.pathology}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{med.times.join(", ")}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                    <Calendar className="h-3 w-3" />
                    <span>Depuis le {new Date(treatment.start_date).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default Treatments
