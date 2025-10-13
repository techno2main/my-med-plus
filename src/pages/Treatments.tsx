import { useState, useEffect } from "react"
import { AppLayout } from "@/components/Layout/AppLayout"
import { PageHeader } from "@/components/Layout/PageHeader"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pill, Clock, Calendar } from "lucide-react"
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
    currentStock: number
    minThreshold: number
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
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false })

      if (treatmentsError) throw treatmentsError

      // Load medications for each treatment
      const treatmentsWithMeds = await Promise.all(
        (treatmentsData || []).map(async (treatment) => {
          const { data: medications } = await supabase
            .from("medications")
            .select(`
              id, 
              name, 
              dosage, 
              times,
              current_stock,
              min_threshold,
              catalog_id
            `)
            .eq("treatment_id", treatment.id)

          // Load pathology from catalog for each medication
          const medsWithPathology = await Promise.all(
            (medications || []).map(async (med: any) => {
              let pathology = null;
              
              if (med.catalog_id) {
                const { data: catalogData } = await supabase
                  .from("medication_catalog")
                  .select("pathology")
                  .eq("id", med.catalog_id)
                  .single();
                
                pathology = catalogData?.pathology || null;
              }

              return {
                id: med.id,
                name: med.name,
                dosage: med.dosage,
                times: med.times,
                pathology,
                currentStock: med.current_stock || 0,
                minThreshold: med.min_threshold || 10
              };
            })
          );

          return {
            ...treatment,
            medications: medsWithPathology
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
        <PageHeader 
          title="Mes traitements"
          subtitle={`${treatments.filter(t => t.is_active).length} traitement(s) actif(s)`}
          showAddButton
          onAdd={() => navigate("/treatments/new")}
        />

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
                      {treatment.is_active ? (
                        <Badge variant="default" className="mt-1 bg-success text-white">
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="mt-1 bg-muted text-muted-foreground">
                          Archivé
                        </Badge>
                      )}
                    </div>
                    {treatment.is_active && (
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/treatments/${treatment.id}/edit`)}>
                        Modifier
                      </Button>
                    )}
                  </div>

                  {/* Medications */}
                  <div className="space-y-2">
                    {treatment.medications.map((med, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <Pill className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{med.name}</p>
                            {med.pathology && (
                              <Badge variant="secondary" className="text-xs">
                                {med.pathology}
                              </Badge>
                            )}
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getStockBgColor(med.currentStock, med.minThreshold)}`}>
                              <Pill className={`h-3 w-3 ${getStockColor(med.currentStock, med.minThreshold)}`} />
                              <span className={`text-xs font-semibold ${getStockColor(med.currentStock, med.minThreshold)}`}>
                                {med.currentStock}
                              </span>
                            </div>
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
