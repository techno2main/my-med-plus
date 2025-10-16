import { useState, useEffect } from "react"
import { AppLayout } from "@/components/Layout/AppLayout"
import { PageHeader } from "@/components/Layout/PageHeader"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pill, Clock, Calendar, User, Download, Stethoscope, Calendar as CalendarIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface Treatment {
  id: string
  name: string
  pathology: string | null
  start_date: string
  end_date: string | null
  is_active: boolean
  qsp_days?: number | null
  medications: Array<{
    id: string
    name: string
    dosage: string
    times: string[]
    pathology: string | null
    currentStock: number
    minThreshold: number
  }>
  prescribing_doctor?: {
    name: string
  } | null
  prescription?: {
    file_path: string | null
  } | null
  next_pharmacy_visit?: {
    visit_date: string
  } | null
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

      if (treatmentsError) {
        console.error("Treatments error:", treatmentsError)
        throw treatmentsError
      }

      // Load medications for each treatment
      const treatmentsWithMeds = await Promise.all(
        (treatmentsData || []).map(async (treatment: any) => {
          // Load prescription and prescribing doctor if exists
          let prescribingDoctor = null
          let prescription = null
          
          if (treatment.prescription_id) {
            const { data: prescriptionData } = await supabase
              .from("prescriptions")
              .select("file_path, prescribing_doctor_id, duration_days")
              .eq("id", treatment.prescription_id)
              .maybeSingle()
            
            prescription = prescriptionData
            
            // Load prescribing doctor from prescription
            if (prescriptionData?.prescribing_doctor_id) {
              const { data: doctorData } = await supabase
                .from("health_professionals")
                .select("name")
                .eq("id", prescriptionData.prescribing_doctor_id)
                .maybeSingle()
              prescribingDoctor = doctorData
            }
          }

          // Calculate QSP in days
          let qspDays: number | null = null
          if (treatment.prescription_id) {
            const { data: prescriptionData } = await supabase
              .from("prescriptions")
              .select("duration_days")
              .eq("id", treatment.prescription_id)
              .maybeSingle()
            
            if (prescriptionData?.duration_days) {
              qspDays = prescriptionData.duration_days
            }
          }
          
          // If no prescription QSP, calculate from existing dates
          if (!qspDays && treatment.start_date && treatment.end_date) {
            const startDate = new Date(treatment.start_date)
            const endDate = new Date(treatment.end_date)
            qspDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          }

          // Load next pharmacy visit
          const { data: pharmacyVisits } = await supabase
            .from("pharmacy_visits")
            .select("visit_date, is_completed")
            .eq("treatment_id", treatment.id)
            .eq("is_completed", false)
            .order("visit_date", { ascending: true })
            .limit(1)

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

          // Load pathology and dosage from catalog for each medication
          const medsWithPathology = await Promise.all(
            (medications || []).map(async (med: any) => {
              let pathology = null;
              let catalogDosage = null;
              
              if (med.catalog_id) {
                const { data: catalogData } = await supabase
                  .from("medication_catalog")
                  .select("pathology, dosage_amount, default_dosage")
                  .eq("id", med.catalog_id)
                  .maybeSingle();
                
                pathology = catalogData?.pathology || null;
                catalogDosage = catalogData?.dosage_amount || catalogData?.default_dosage;
              }

              // Sort times in ascending order
              const sortedTimes = [...(med.times || [])].sort((a, b) => {
                const [hoursA, minutesA] = a.split(':').map(Number);
                const [hoursB, minutesB] = b.split(':').map(Number);
                return (hoursA * 60 + minutesA) - (hoursB * 60 + minutesB);
              });

              return {
                id: med.id,
                name: med.name,
                dosage: catalogDosage || med.dosage,
                times: sortedTimes,
                pathology,
                currentStock: med.current_stock || 0,
                minThreshold: med.min_threshold || 10
              };
            })
          );

          // Sort medications by earliest time, then alphabetically by name
          medsWithPathology.sort((a, b) => {
            // Get earliest time for each medication
            const getEarliestTime = (times: string[]) => {
              if (!times || times.length === 0) return 24 * 60; // Put at end if no times
              const [hours, minutes] = times[0].split(':').map(Number);
              return hours * 60 + minutes;
            };
            
            const timeA = getEarliestTime(a.times);
            const timeB = getEarliestTime(b.times);
            
            // First sort by time
            if (timeA !== timeB) {
              return timeA - timeB;
            }
            
            // Then sort alphabetically by name
            return a.name.localeCompare(b.name, 'fr');
          });

          return {
            ...treatment,
            medications: medsWithPathology,
            prescribing_doctor: prescribingDoctor,
            prescription: prescription,
            next_pharmacy_visit: pharmacyVisits && pharmacyVisits.length > 0 ? pharmacyVisits[0] : null,
            qsp_days: qspDays
          }
        })
      )


      setTreatments(treatmentsWithMeds as Treatment[])
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
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6">
          <p>Chargement...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        <PageHeader 
          title="Traitements"
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
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm">
                              {med.name} <span className="text-muted-foreground">• {med.dosage}</span>
                            </p>
                            {med.pathology && (
                              <Badge variant="secondary" className="text-xs flex-shrink-0">
                                {med.pathology}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{med.times.join(", ")}</span>
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getStockBgColor(med.currentStock, med.minThreshold)}`}>
                              <Pill className={`h-3 w-3 ${getStockColor(med.currentStock, med.minThreshold)}`} />
                              <span className={`text-xs font-semibold ${getStockColor(med.currentStock, med.minThreshold)}`}>
                                {med.currentStock}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Metadata Footer */}
                  <div className="pt-2 border-t border-border space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span className="whitespace-nowrap">
                        Début : {new Date(treatment.start_date).toLocaleDateString("fr-FR")}
                        {treatment.qsp_days && (
                          <span className="text-[10px]"> (QSP {Math.round(treatment.qsp_days / 30)} mois)</span>
                        )}
                        {treatment.end_date && (
                          <> • Fin : {new Date(treatment.end_date).toLocaleDateString("fr-FR")}</>
                        )}
                      </span>
                    </div>
                    {treatment.prescribing_doctor && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{treatment.prescribing_doctor.name}</span>
                      </div>
                    )}
                    {treatment.prescription?.file_path && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Download className="h-3 w-3" />
                        <a 
                          href={supabase.storage.from('prescriptions').getPublicUrl(treatment.prescription.file_path).data.publicUrl}
                          download
                          className="hover:text-primary underline"
                        >
                          Télécharger l'ordonnance
                        </a>
                      </div>
                    )}
                    {treatment.next_pharmacy_visit && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Pill className="h-3 w-3" />
                        <span>Prochain rechargement : {new Date(treatment.next_pharmacy_visit.visit_date).toLocaleDateString("fr-FR")}</span>
                      </div>
                    )}
                    {treatment.end_date && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Stethoscope className="h-3 w-3" />
                        <span>Prochaine visite : {new Date(treatment.end_date).toLocaleDateString("fr-FR")}</span>
                      </div>
                    )}
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
