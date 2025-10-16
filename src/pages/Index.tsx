import { useState, useEffect } from "react"
import { AppLayout } from "@/components/Layout/AppLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Pill, AlertCircle, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useAdherenceStats } from "@/hooks/useAdherenceStats"

interface UpcomingIntake {
  id: string
  medicationId: string
  medication: string
  dosage: string
  time: string
  date: Date
  treatment: string
  treatmentId: string
  pathology: string
  currentStock: number
  minThreshold: number
}

interface StockAlert {
  id: string
  medication: string
  remaining: number
  daysLeft: number
}

const Index = () => {
  const navigate = useNavigate()
  const [upcomingIntakes, setUpcomingIntakes] = useState<UpcomingIntake[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [activeTreatmentsCount, setActiveTreatmentsCount] = useState(0)
  const [activeTreatmentName, setActiveTreatmentName] = useState("")
  const [loading, setLoading] = useState(true)
  const { stats: adherenceStats } = useAdherenceStats()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load active treatments count
      const { data: treatments, error: treatmentsError } = await supabase
        .from("treatments")
        .select("*")
        .eq("is_active", true)

      if (treatmentsError) throw treatmentsError
      setActiveTreatmentsCount(treatments?.length || 0)

      // Load medications with their times and pathology from catalog
      const { data: medications, error: medsError } = await supabase
        .from("medications")
        .select(`
          id,
          name,
          dosage_amount,
          dosage,
          times,
          current_stock,
          initial_stock,
          min_threshold,
          treatment_id,
          treatments!inner(name, is_active, pathology),
          medication_catalog(pathology, dosage_amount, default_dosage)
        `)
        .eq("treatments.is_active", true)
      
      if (treatments && treatments.length > 0) {
        setActiveTreatmentName(treatments[0].name)
      }

      if (medsError) throw medsError

      // Load today's intakes to exclude already taken medications
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data: takenIntakes } = await supabase
        .from("medication_intakes")
        .select("medication_id, scheduled_time")
        .eq("status", "taken")
        .gte("scheduled_time", today.toISOString())
        .lt("scheduled_time", tomorrow.toISOString())

      const takenIntakesSet = new Set(
        (takenIntakes || []).map((intake: any) => {
          const scheduledDate = new Date(intake.scheduled_time)
          const date = format(scheduledDate, "yyyy-MM-dd")
          const time = format(scheduledDate, "HH:mm")
          return `${intake.medication_id}-${date}-${time}`
        })
      )

      // Process upcoming intakes (today and tomorrow)
      const now = new Date()
      const intakes: UpcomingIntake[] = []

      medications?.forEach((med: any) => {
        med.times?.forEach((time: string) => {
          // Check today's times
          const todayDate = format(new Date(), "yyyy-MM-dd")
          const todayKey = `${med.id}-${todayDate}-${time}`
          if (!takenIntakesSet.has(todayKey)) {
            const [hours, minutes] = time.split(':')
            const scheduledDate = new Date()
            scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

            // Show all of today's intakes that haven't been taken
            const catalogDosage = med.medication_catalog?.dosage_amount || med.medication_catalog?.default_dosage
            intakes.push({
              id: `${med.id}-${time}-today`,
              medicationId: med.id,
              medication: med.name,
              dosage: catalogDosage || med.dosage_amount || med.dosage,
              time: time,
              date: scheduledDate,
              treatment: med.treatments.name,
              treatmentId: med.treatment_id,
              pathology: med.medication_catalog?.pathology || "",
              currentStock: med.current_stock || 0,
              minThreshold: med.min_threshold || 10
            })
          }

          // Add tomorrow's first occurrences if we don't have enough today
          const tomorrowDate = new Date()
          tomorrowDate.setDate(tomorrowDate.getDate() + 1)
          const [hours, minutes] = time.split(':')
          tomorrowDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
          
          const catalogDosage = med.medication_catalog?.dosage_amount || med.medication_catalog?.default_dosage
          intakes.push({
            id: `${med.id}-${time}-tomorrow`,
            medicationId: med.id,
            medication: med.name,
            dosage: catalogDosage || med.dosage_amount || med.dosage,
            time: time,
            date: tomorrowDate,
            treatment: med.treatments.name,
            treatmentId: med.treatment_id,
            pathology: med.medication_catalog?.pathology || "",
            currentStock: med.current_stock || 0,
            minThreshold: med.min_threshold || 10
          })
        })
      })

      // Sort by date first, then by time
      intakes.sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        dateA.setHours(0, 0, 0, 0)
        dateB.setHours(0, 0, 0, 0)
        
        // Compare dates first
        const dateDiff = dateA.getTime() - dateB.getTime()
        if (dateDiff !== 0) return dateDiff
        
        // If same date, compare times
        return a.date.getTime() - b.date.getTime()
      })
      setUpcomingIntakes(intakes.slice(0, 10))

      // Process stock alerts
      const alerts: StockAlert[] = []
      medications?.forEach((med: any) => {
        if (med.current_stock <= med.min_threshold) {
          const dailyConsumption = med.times?.length || 1
          const daysLeft = Math.floor(med.current_stock / dailyConsumption)
          
          alerts.push({
            id: med.id,
            medication: med.name,
            remaining: med.current_stock,
            daysLeft: daysLeft
          })
        }
      })
      setStockAlerts(alerts)

    } catch (error) {
      console.error("Error loading dashboard data:", error)
      toast.error("Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  const handleTakeIntake = async (intake: UpcomingIntake) => {
    try {
      // Create intake record
      const { error: intakeError } = await supabase
        .from("medication_intakes")
        .insert({
          medication_id: intake.medicationId,
          scheduled_time: intake.date.toISOString(),
          taken_at: new Date().toISOString(),
          status: 'taken'
        })

      if (intakeError) throw intakeError

      // Update medication stock
      const { error: stockError } = await supabase
        .from("medications")
        .update({
          current_stock: intake.currentStock - 1
        })
        .eq("id", intake.medicationId)

      if (stockError) throw stockError

      toast.success("Prise enregistrée ✓")
      loadDashboardData() // Reload data
    } catch (error) {
      console.error("Error recording intake:", error)
      toast.error("Erreur lors de l'enregistrement")
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

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 surface-elevated cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/treatments")}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Pill className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeTreatmentsCount}</p>
                <p className="text-xs text-muted-foreground">Actif{activeTreatmentsCount > 1 ? 's' : ''}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 surface-elevated cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/history?tab=statistics")}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{adherenceStats.adherence7Days}%</p>
                <p className="text-xs text-muted-foreground">Observance 7j</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Stock Alerts */}
        {stockAlerts.length > 0 && (
          <Card className="p-4 border-warning/20 bg-warning/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-sm">Alertes de stock</h3>
                {stockAlerts.map((alert) => (
                  <div key={alert.id} className="text-sm">
                    <p className="font-medium">{alert.medication}</p>
                    <p className="text-muted-foreground">
                      {alert.remaining} comprimés restants • ~{alert.daysLeft} jours
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Upcoming Intakes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Prochaines prises</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/history")}>
              Tout voir
            </Button>
          </div>

          <div className="space-y-6">
            {/* Today's Section */}
            {upcomingIntakes.some(intake => {
              const intakeDate = new Date(intake.date);
              const today = new Date();
              intakeDate.setHours(0, 0, 0, 0);
              today.setHours(0, 0, 0, 0);
              return intakeDate.getTime() === today.getTime();
            }) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Aujourd'hui
                </h3>
                {(() => {
                  const todayIntakes = upcomingIntakes.filter(intake => {
                    const intakeDate = new Date(intake.date);
                    const today = new Date();
                    intakeDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);
                    return intakeDate.getTime() === today.getTime();
                  });
                  
                  // Group by treatment
                  const groupedByTreatment = todayIntakes.reduce((acc, intake) => {
                    if (!acc[intake.treatmentId]) {
                      acc[intake.treatmentId] = {
                        treatment: intake.treatment,
                        intakes: []
                      };
                    }
                    acc[intake.treatmentId].intakes.push(intake);
                    return acc;
                  }, {} as Record<string, { treatment: string; intakes: UpcomingIntake[] }>);

                  return Object.entries(groupedByTreatment).map(([treatmentId, group]) => (
                    <div key={treatmentId} className="space-y-2">
                      <p className="text-xs font-medium text-primary px-1">
                        {group.treatment}
                      </p>
                      {group.intakes.map((intake) => (
                        <Card key={intake.id} className="p-3 surface-elevated hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center min-w-[60px] p-1.5 rounded-lg bg-primary/10">
                              <Clock className="h-3.5 w-3.5 text-primary mb-0.5" />
                              <span className="text-xs font-semibold text-primary">{intake.time}</span>
                              <span className="text-[10px] text-muted-foreground">{format(intake.date, "dd/MM")}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{intake.medication}</p>
                                <span className="text-xs text-muted-foreground flex-shrink-0">{intake.dosage}</span>
                              </div>
                              {intake.pathology && (
                                <p className="text-xs text-muted-foreground truncate">{intake.pathology}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getStockBgColor(intake.currentStock, intake.minThreshold)}`}>
                                <Pill className={`h-3 w-3 ${getStockColor(intake.currentStock, intake.minThreshold)}`} />
                                <span className={`text-xs font-semibold ${getStockColor(intake.currentStock, intake.minThreshold)}`}>
                                  {intake.currentStock}
                                </span>
                              </div>
                              
                              <Button 
                                size="sm" 
                                className="gradient-primary h-8 w-8 p-0"
                                onClick={() => handleTakeIntake(intake)}
                                disabled={intake.currentStock === 0}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            )}

            {/* Tomorrow's Section */}
            {upcomingIntakes.some(intake => {
              const intakeDate = new Date(intake.date);
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              intakeDate.setHours(0, 0, 0, 0);
              tomorrow.setHours(0, 0, 0, 0);
              return intakeDate.getTime() === tomorrow.getTime();
            }) && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Demain
                </h3>
                {(() => {
                  const tomorrowIntakes = upcomingIntakes.filter(intake => {
                    const intakeDate = new Date(intake.date);
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    intakeDate.setHours(0, 0, 0, 0);
                    tomorrow.setHours(0, 0, 0, 0);
                    return intakeDate.getTime() === tomorrow.getTime();
                  });
                  
                  // Group by treatment
                  const groupedByTreatment = tomorrowIntakes.reduce((acc, intake) => {
                    if (!acc[intake.treatmentId]) {
                      acc[intake.treatmentId] = {
                        treatment: intake.treatment,
                        intakes: []
                      };
                    }
                    acc[intake.treatmentId].intakes.push(intake);
                    return acc;
                  }, {} as Record<string, { treatment: string; intakes: UpcomingIntake[] }>);

                  return Object.entries(groupedByTreatment).map(([treatmentId, group]) => (
                    <div key={treatmentId} className="space-y-2">
                      <p className="text-xs font-medium text-primary px-1">
                        {group.treatment}
                      </p>
                      {group.intakes.map((intake) => (
                        <Card key={intake.id} className="p-3 surface-elevated hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center min-w-[60px] p-1.5 rounded-lg bg-primary/10">
                              <Clock className="h-3.5 w-3.5 text-primary mb-0.5" />
                              <span className="text-xs font-semibold text-primary">{intake.time}</span>
                              <span className="text-[10px] text-muted-foreground">{format(intake.date, "dd/MM")}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate">{intake.medication}</p>
                                <span className="text-xs text-muted-foreground flex-shrink-0">{intake.dosage}</span>
                              </div>
                              {intake.pathology && (
                                <p className="text-xs text-muted-foreground truncate">{intake.pathology}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getStockBgColor(intake.currentStock, intake.minThreshold)}`}>
                                <Pill className={`h-3 w-3 ${getStockColor(intake.currentStock, intake.minThreshold)}`} />
                                <span className={`text-xs font-semibold ${getStockColor(intake.currentStock, intake.minThreshold)}`}>
                                  {intake.currentStock}
                                </span>
                              </div>
                              
                              <Button 
                                size="sm" 
                                className="gradient-primary h-8 w-8 p-0"
                                onClick={() => handleTakeIntake(intake)}
                                disabled={intake.currentStock === 0}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Actions rapides</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate("/treatments/new")}>
              <Pill className="h-5 w-5" />
              <span className="text-sm">Ajouter un traitement</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => navigate("/history")}>
              <Clock className="h-5 w-5" />
              <span className="text-sm">Historique</span>
            </Button>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}

export default Index
