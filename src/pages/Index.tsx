import { useState, useEffect } from "react"
import { AppLayout } from "@/components/Layout/AppLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Clock, Pill, AlertCircle, CheckCircle2, X } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useAdherenceStats } from "@/hooks/useAdherenceStats"
import { useMissedIntakesDetection } from "@/hooks/useMissedIntakesDetection"
import { formatToFrenchTime, convertFrenchToUTC } from "../lib/dateUtils"
import { useIntakeOverdue } from "@/hooks/useIntakeOverdue"

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
  treatmentQspDays?: number | null
  treatmentEndDate?: string | null
}

interface StockAlert {
  id: string
  medication: string
  remaining: number
  daysLeft: number
}

// Règles de tolérance identiques à celles du hook de détection
const Index = () => {
  const navigate = useNavigate()
  const { isIntakeOverdue } = useIntakeOverdue()
  const [upcomingIntakes, setUpcomingIntakes] = useState<UpcomingIntake[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [activeTreatmentsCount, setActiveTreatmentsCount] = useState(0)
  const [activeTreatmentName, setActiveTreatmentName] = useState("")
  const [loading, setLoading] = useState(true)
  // States for confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [selectedIntake, setSelectedIntake] = useState<UpcomingIntake | null>(null)
  const { stats: adherenceStats } = useAdherenceStats()
  const { missedIntakes, totalMissed, loading: missedLoading } = useMissedIntakesDetection()

  // Fonction pour détecter si une prise est en retard


  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load active treatments with QSP and end date info
      const { data: treatments, error: treatmentsError } = await supabase
        .from("treatments")
        .select("id, name, start_date, end_date, prescription_id")
        .eq("is_active", true)

      if (treatmentsError) throw treatmentsError
      setActiveTreatmentsCount(treatments?.length || 0)

      // Calculate QSP for each treatment
      const treatmentsWithQsp = await Promise.all(
        (treatments || []).map(async (treatment: any) => {
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
          
          if (!qspDays && treatment.start_date && treatment.end_date) {
            const startDate = new Date(treatment.start_date)
            const endDate = new Date(treatment.end_date)
            qspDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
          }
          
          return {
            ...treatment,
            qsp_days: qspDays
          }
        })
      )
      
      const treatmentsMap = new Map(treatmentsWithQsp.map(t => [t.id, t]))

      // Load medications info for stock alerts
      const { data: medications, error: medsError } = await supabase
        .from("medications")
        .select(`
          id,
          name,
          times,
          current_stock,
          min_threshold,
          treatment_id,
          treatments!inner(name, is_active)
        `)
        .eq("treatments.is_active", true)
      
      if (treatments && treatments.length > 0) {
        setActiveTreatmentName(treatments[0].name)
      }

      if (medsError) throw medsError

      // SYSTÈME UNIFIÉ : Lire les prises depuis medication_intakes uniquement
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayAfterTomorrow = new Date(today)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

      const { data: upcomingIntakesData, error: intakesError } = await supabase
        .from("medication_intakes")
        .select(`
          id,
          medication_id,
          scheduled_time,
          status,
          medications (
            id,
            name,
            current_stock,
            min_threshold,
            treatment_id,
            treatments (name),
            medication_catalog (pathology, strength, default_posology)
          )
        `)
        .gte("scheduled_time", today.toISOString())
        .lt("scheduled_time", dayAfterTomorrow.toISOString())
        .eq("status", "pending")
        .order("scheduled_time", { ascending: true })

      if (intakesError) throw intakesError

      const intakes: UpcomingIntake[] = [];
      const now = new Date();

      (upcomingIntakesData || []).forEach((intake: any) => {
        const scheduledDate = new Date(intake.scheduled_time)
        
        // Afficher toutes les prises pending (aujourd'hui + demain)
        const treatmentInfo = treatmentsMap.get(intake.medications.treatment_id)
        const catalogDosage = intake.medications?.medication_catalog?.strength || 
                             intake.medications?.medication_catalog?.default_posology || ""

        // Convertir en heure locale française
        const localTime = formatToFrenchTime(intake.scheduled_time, 'HH:mm')

        intakes.push({
          id: intake.id,
          medicationId: intake.medication_id,
          medication: intake.medications.name,
          dosage: catalogDosage,
          time: localTime,
          date: scheduledDate,
          treatment: intake.medications.treatments.name,
          treatmentId: intake.medications.treatment_id,
          pathology: intake.medications?.medication_catalog?.pathology || "",
          currentStock: intake.medications.current_stock || 0,
          minThreshold: intake.medications.min_threshold || 10,
          treatmentQspDays: treatmentInfo?.qsp_days || null,
          treatmentEndDate: treatmentInfo?.end_date || null
        })
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

  const handleTakeIntake = (intake: UpcomingIntake) => {
    setSelectedIntake(intake)
    setShowConfirmDialog(true)
  }

  const confirmTakeIntake = async () => {
    if (!selectedIntake) return

    try {
      // Update existing intake record
      const { error: intakeError } = await supabase
        .from("medication_intakes")
        .update({
          taken_at: convertFrenchToUTC(new Date()).toISOString(),
          status: 'taken'
        })
        .eq("id", selectedIntake.id)

      if (intakeError) throw intakeError

      // Update medication stock
      const { error: stockError } = await supabase
        .from("medications")
        .update({
          current_stock: selectedIntake.currentStock - 1
        })
        .eq("id", selectedIntake.medicationId)

      if (stockError) throw stockError

      toast.success("Prise enregistrée ✓")
      setShowConfirmDialog(false)
      setSelectedIntake(null)
      loadDashboardData() // Reload data
    } catch (error) {
      console.error("Error recording intake:", error)
      toast.error("Erreur lors de l'enregistrement")
    }
  }

  const cancelTakeIntake = () => {
    setShowConfirmDialog(false)
    setSelectedIntake(null)
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
                <p className="text-xs text-muted-foreground">Observance</p>
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

        {/* Missed Intakes Alert */}
        {!missedLoading && totalMissed > 0 && (
          <Card className="p-4 border-orange-200 bg-orange-50">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="space-y-2">
                  {(() => {
                    // Grouper par jour
                    const groupedByDay = missedIntakes.reduce((acc, intake) => {
                      const dayKey = intake.status === 'missed_yesterday' ? 'yesterday' : 'today';
                      if (!acc[dayKey]) acc[dayKey] = [];
                      acc[dayKey].push(intake);
                      return acc;
                    }, {} as Record<string, typeof missedIntakes>);

                    // Calculer le retard pour aujourd'hui
                    const calculateDelay = (scheduledTime: string) => {
                      const now = new Date();
                      const scheduled = new Date(scheduledTime);
                      const diffMs = now.getTime() - scheduled.getTime();
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      
                      if (diffHours > 0) {
                        return `${diffHours}h${diffMinutes > 0 ? diffMinutes.toString().padStart(2, '0') : ''}`;
                      } else {
                        return `${diffMinutes}min`;
                      }
                    };

                    return (
                      <>
                        {groupedByDay.yesterday && (
                          <div>
                            <h3 className="font-semibold text-sm text-orange-800">
                              {groupedByDay.yesterday.length === 1 
                                ? `1 prise à rattraper hier (18/10/25) :` 
                                : `${groupedByDay.yesterday.length} prises à rattraper hier (18/10/25) :`
                              }
                            </h3>
                            <div className="ml-2 space-y-1">
                              {groupedByDay.yesterday.slice(0, 3).map((intake) => (
                                <p key={intake.id} className="text-xs text-orange-700">
                                  • {intake.medication} à {intake.displayTime}
                                </p>
                              ))}
                              {groupedByDay.yesterday.length > 3 && (
                                <p className="text-xs text-orange-700">
                                  • et {groupedByDay.yesterday.length - 3} autre{groupedByDay.yesterday.length - 3 > 1 ? 's' : ''}...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {groupedByDay.today && (
                          <div>
                            <h3 className="font-semibold text-sm text-orange-800">
                              {groupedByDay.today.length === 1 
                                ? `1 prise à rattraper aujourd'hui (19/10/25) :` 
                                : `${groupedByDay.today.length} prises à rattraper aujourd'hui (19/10/25) :`
                              }
                            </h3>
                            <div className="ml-2 space-y-1">
                              {groupedByDay.today.slice(0, 3).map((intake) => (
                                <p key={intake.id} className="text-xs text-orange-700">
                                  • {intake.medication} à {intake.displayTime} (retard de {calculateDelay(intake.scheduledTime)})
                                </p>
                              ))}
                              {groupedByDay.today.length > 3 && (
                                <p className="text-xs text-orange-700">
                                  • et {groupedByDay.today.length - 3} autre{groupedByDay.today.length - 3 > 1 ? 's' : ''}...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                <Button 
                  size="sm" 
                  className="mt-3 bg-gray-800 text-white hover:bg-gray-900 border-0"
                  onClick={() => navigate("/rattrapage")}
                >
                  Gérer les rattrapages
                </Button>
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
                        qspDays: intake.treatmentQspDays,
                        endDate: intake.treatmentEndDate,
                        intakes: []
                      };
                    }
                    acc[intake.treatmentId].intakes.push(intake);
                    return acc;
                  }, {} as Record<string, { treatment: string; qspDays?: number | null; endDate?: string | null; intakes: UpcomingIntake[] }>);

                  // Sort intakes within each treatment: 1) by time, 2) by medication name
                  Object.values(groupedByTreatment).forEach(group => {
                    group.intakes.sort((a, b) => {
                      // Compare times first
                      const timeCompare = a.time.localeCompare(b.time);
                      if (timeCompare !== 0) return timeCompare;
                      // If same time, compare medication names alphabetically
                      return a.medication.localeCompare(b.medication);
                    });
                  });

                  return Object.entries(groupedByTreatment).map(([treatmentId, group]) => (
                    <div key={treatmentId} className="space-y-2">
                      <div className="flex items-baseline gap-2 px-1">
                        <p className="text-xs font-medium text-primary">
                          {group.treatment}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {group.qspDays && `QSP : ${Math.round(group.qspDays / 30)} mois`}
                          {group.endDate && ` • Fin : ${new Date(group.endDate).toLocaleDateString("fr-FR")}`}
                        </p>
                      </div>
                      {group.intakes.map((intake) => {
                        const isOverdue = isIntakeOverdue(intake.date);
                        return (
                          <Card key={intake.id} className="p-3 surface-elevated hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                              <div className={`flex flex-col items-center justify-center min-w-[60px] p-1.5 rounded-lg ${isOverdue ? 'bg-orange-100' : 'bg-primary/10'}`}>
                                <Clock className={`h-3.5 w-3.5 mb-0.5 ${isOverdue ? 'text-orange-600' : 'text-primary'}`} />
                                <span className={`text-xs font-semibold ${isOverdue ? 'text-orange-700' : 'text-primary'}`}>{intake.time}</span>
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
                                  className={
                                    intake.currentStock === 0 
                                      ? "gradient-primary h-8 w-8 p-0" 
                                      : isOverdue
                                        ? "bg-orange-500 hover:bg-orange-600 text-white h-8 w-8 p-0"
                                        : "gradient-primary h-8 w-8 p-0"
                                  }
                                  onClick={() => handleTakeIntake(intake)}
                                  disabled={intake.currentStock === 0 || isOverdue}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
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
                        qspDays: intake.treatmentQspDays,
                        endDate: intake.treatmentEndDate,
                        intakes: []
                      };
                    }
                    acc[intake.treatmentId].intakes.push(intake);
                    return acc;
                  }, {} as Record<string, { treatment: string; qspDays?: number | null; endDate?: string | null; intakes: UpcomingIntake[] }>);

                  // Sort intakes within each treatment: 1) by time, 2) by medication name
                  Object.values(groupedByTreatment).forEach(group => {
                    group.intakes.sort((a, b) => {
                      // Compare times first
                      const timeCompare = a.time.localeCompare(b.time);
                      if (timeCompare !== 0) return timeCompare;
                      // If same time, compare medication names alphabetically
                      return a.medication.localeCompare(b.medication);
                    });
                  });

                  return Object.entries(groupedByTreatment).map(([treatmentId, group]) => (
                    <div key={treatmentId} className="space-y-2">
                      <div className="flex items-baseline gap-2 px-1">
                        <p className="text-xs font-medium text-primary">
                          {group.treatment}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {group.qspDays && `QSP : ${Math.round(group.qspDays / 30)} mois`}
                          {group.endDate && ` • Fin : ${new Date(group.endDate).toLocaleDateString("fr-FR")}`}
                        </p>
                      </div>
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
                                className="gradient-primary h-8 w-8 p-0 opacity-50 cursor-not-allowed"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toast.error("Prises de demain non disponibles", {
                                    description: "Attendez le jour J pour valider"
                                  });
                                }}
                                disabled={true}
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

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Confirmer la prise
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Valider la prise de ce médicament ?
            </DialogDescription>
          </DialogHeader>
          
          {selectedIntake && (
            <div className="space-y-4">
              <div className="bg-card border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">{selectedIntake.medication}</h4>
                  <span className="text-sm font-medium text-muted-foreground">{selectedIntake.dosage}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Prévu à {selectedIntake.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Maintenant : {format(new Date(), 'HH:mm', { locale: fr })}</span>
                  </div>
                </div>
                {selectedIntake.pathology && (
                  <p className="text-sm text-muted-foreground">
                    Traitement : {selectedIntake.pathology}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Stock actuel : <span className="font-medium">{selectedIntake.currentStock}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row gap-3 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={cancelTakeIntake}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button 
              onClick={confirmTakeIntake}
              className="flex-1 gradient-primary"
              disabled={selectedIntake?.currentStock === 0}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}

export default Index
