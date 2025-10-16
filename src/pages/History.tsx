import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, Calendar as CalendarIcon, List, ClockAlert } from "lucide-react";
import { format, parseISO, startOfDay, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdherenceStats } from "@/hooks/useAdherenceStats";


interface MedicationIntake {
  id: string;
  medication_id: string;
  scheduled_time: string;
  taken_at: string | null;
  status: 'pending' | 'taken' | 'skipped';
  medications: {
    name: string;
    catalog_id?: string;
    medication_catalog?: {
      dosage_amount?: string;
      default_dosage?: string;
    };
  };
}

interface GroupedIntakes {
  date: Date;
  intakes: {
    id: string;
    time: string;
    medication: string;
    dosage: string;
    status: string;
    takenAt?: string;
    scheduledTimestamp?: string;
    takenAtTimestamp?: string;
    treatment: string;
    treatmentId: string;
    treatmentQspDays?: number | null;
    treatmentEndDate?: string | null;
  }[];
}

export default function History() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "history");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<GroupedIntakes[]>([]);
  const { stats, loading: statsLoading } = useAdherenceStats();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data: intakesData, error } = await supabase
        .from("medication_intakes")
        .select(`
          id,
          medication_id,
          scheduled_time,
          taken_at,
          status,
          medications (
            name,
            catalog_id,
            treatment_id,
            medication_catalog(dosage_amount, default_dosage),
            treatments(name, start_date, end_date, prescription_id)
          )
        `)
        .order("scheduled_time", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get unique treatment IDs and calculate QSP for each
      const treatmentIds = [...new Set((intakesData || []).map((i: any) => i.medications?.treatment_id).filter(Boolean))];
      const treatmentsQspMap = new Map();
      
      for (const treatmentId of treatmentIds) {
        const treatment = (intakesData || []).find((i: any) => i.medications?.treatment_id === treatmentId)?.medications?.treatments;
        if (treatment) {
          let qspDays: number | null = null;
          
          if (treatment.prescription_id) {
            const { data: prescriptionData } = await supabase
              .from("prescriptions")
              .select("duration_days")
              .eq("id", treatment.prescription_id)
              .maybeSingle();
            
            if (prescriptionData?.duration_days) {
              qspDays = prescriptionData.duration_days;
            }
          }
          
          if (!qspDays && treatment.start_date && treatment.end_date) {
            const startDate = new Date(treatment.start_date);
            const endDate = new Date(treatment.end_date);
            qspDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          }
          
          treatmentsQspMap.set(treatmentId, {
            qsp_days: qspDays,
            end_date: treatment.end_date
          });
        }
      }

      // Group by date
      const grouped = (intakesData || []).reduce((acc: Record<string, GroupedIntakes>, intake: any) => {
        const date = startOfDay(parseISO(intake.scheduled_time));
        const dateKey = date.toISOString();
        
        if (!acc[dateKey]) {
          acc[dateKey] = {
            date,
            intakes: []
          };
        }

        const dosage = intake.medications?.medication_catalog?.dosage_amount || 
                       intake.medications?.medication_catalog?.default_dosage || 
                       "";
        
        const treatmentId = intake.medications?.treatment_id || '';
        const treatmentInfo = treatmentsQspMap.get(treatmentId);
        
        acc[dateKey].intakes.push({
          id: intake.id,
          time: format(parseISO(intake.scheduled_time), 'HH:mm'),
          medication: intake.medications?.name || 'Médicament inconnu',
          dosage: dosage,
          status: intake.status,
          takenAt: intake.taken_at ? format(parseISO(intake.taken_at), 'HH:mm') : undefined,
          scheduledTimestamp: intake.scheduled_time,
          takenAtTimestamp: intake.taken_at,
          treatment: intake.medications?.treatments?.name || 'Traitement inconnu',
          treatmentId: treatmentId,
          treatmentQspDays: treatmentInfo?.qsp_days || null,
          treatmentEndDate: treatmentInfo?.end_date || null
        });

        return acc;
      }, {});

      setHistoryData(Object.values(grouped));

    } catch (error) {
      console.error("Error loading history:", error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = (filter: string) => {
    setFilterStatus(filter);
    setActiveTab("history");
    setSearchParams({ tab: "history" });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "taken":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "skipped":
        return <XCircle className="h-5 w-5 text-danger" />;
      case "pending":
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string, scheduledTimestamp?: string, takenAtTimestamp?: string) => {
    if (status === "taken" && scheduledTimestamp && takenAtTimestamp) {
      const scheduled = new Date(scheduledTimestamp);
      const taken = new Date(takenAtTimestamp);
      const differenceMinutes = (taken.getTime() - scheduled.getTime()) / (1000 * 60);
      
      // Vert : avant l'heure ou jusqu'à 30min après
      if (differenceMinutes <= 30) {
        return <Badge variant="success">Pris</Badge>;
      }
      // Jaune pâle : entre 30min et 1h après
      else if (differenceMinutes <= 60) {
        return <Badge className="bg-yellow-50 text-gray-900 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-100 dark:border-yellow-500/40">Pris</Badge>;
      }
      // Jaune foncé : plus d'1h après
      else {
        return <Badge className="bg-yellow-300 text-gray-900 border-yellow-400 dark:bg-yellow-500/40 dark:text-yellow-100 dark:border-yellow-500/60">Pris</Badge>;
      }
    }
    
    switch (status) {
      case "taken":
        return <Badge variant="success">Pris</Badge>;
      case "skipped":
        return <Badge variant="danger">Manqué</Badge>;
      case "pending":
        return <Badge variant="warning">À venir</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6">
          <p className="text-center text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        <PageHeader 
          title="Historique"
          subtitle="Suivez vos prises de médicaments"
        />

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          setSearchParams({ tab: value });
        }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="statistics">Statistiques</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            {/* Filtres */}
            <Card className="p-3">
              <div className="grid grid-cols-4 gap-2">
                <Button 
                  variant={filterStatus === "all" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                  className="h-10 w-full relative"
                >
                  <List className="h-5 w-5" />
                  {(stats.takenOnTime + stats.lateIntakes + stats.skipped) > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full bg-primary text-primary-foreground border-2 border-background">
                      {stats.takenOnTime + stats.lateIntakes + stats.skipped}
                    </span>
                  )}
                </Button>
                <Button 
                  variant={filterStatus === "ontime" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterStatus("ontime")}
                  className={`h-10 w-full relative ${filterStatus === "ontime" ? "" : "border-success/50 text-success hover:bg-success/10"}`}
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {stats.takenOnTime > 0 && (
                    <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full border-2 border-background ${filterStatus === "ontime" ? "bg-primary-foreground text-primary" : "bg-success text-white"}`}>
                      {stats.takenOnTime}
                    </span>
                  )}
                </Button>
                <Button 
                  variant={filterStatus === "late" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterStatus("late")}
                  className={`h-10 w-full relative ${filterStatus === "late" ? "" : "border-warning/50 text-warning hover:bg-warning/10"}`}
                >
                  <ClockAlert className="h-5 w-5" />
                  {stats.lateIntakes > 0 && (
                    <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full border-2 border-background ${filterStatus === "late" ? "bg-primary-foreground text-primary" : "bg-warning text-white"}`}>
                      {stats.lateIntakes}
                    </span>
                  )}
                </Button>
                <Button 
                  variant={filterStatus === "missed" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setFilterStatus("missed")}
                  className={`h-10 w-full relative ${filterStatus === "missed" ? "" : "border-danger/50 text-danger hover:bg-danger/10"}`}
                >
                  <XCircle className="h-5 w-5" />
                  {stats.skipped > 0 && (
                    <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full border-2 border-background ${filterStatus === "missed" ? "bg-primary-foreground text-primary" : "bg-danger text-white"}`}>
                      {stats.skipped}
                    </span>
                  )}
                </Button>
              </div>
            </Card>

            {historyData.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">Aucun historique disponible</p>
              </Card>
            ) : (
              historyData.map((day, dayIdx) => {
                // Group intakes by treatment
                const groupedByTreatment = day.intakes.reduce((acc, intake) => {
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
                }, {} as Record<string, { treatment: string; qspDays?: number | null; endDate?: string | null; intakes: typeof day.intakes }>);

                // Filter intakes based on selected filter
                const shouldShowIntake = (intake: any) => {
                  if (filterStatus === "all") return true;
                  
                  if (filterStatus === "missed") {
                    return intake.status === "skipped";
                  }
                  
                  if (intake.status !== "taken" || !intake.scheduledTimestamp || !intake.takenAtTimestamp) {
                    return false;
                  }
                  
                  const scheduled = new Date(intake.scheduledTimestamp);
                  const taken = new Date(intake.takenAtTimestamp);
                  const differenceMinutes = (taken.getTime() - scheduled.getTime()) / (1000 * 60);
                  
                  if (filterStatus === "ontime") {
                    return differenceMinutes <= 30;
                  }
                  
                  if (filterStatus === "late") {
                    return differenceMinutes > 30;
                  }
                  
                  return true;
                };

                // Filter treatments to only show those with matching intakes
                const filteredTreatments = Object.entries(groupedByTreatment).reduce((acc, [treatmentId, group]) => {
                  const filteredIntakes = group.intakes.filter(shouldShowIntake);
                  if (filteredIntakes.length > 0) {
                    acc[treatmentId] = {
                      treatment: group.treatment,
                      qspDays: group.qspDays,
                      endDate: group.endDate,
                      intakes: filteredIntakes
                    };
                  }
                  return acc;
                }, {} as Record<string, { treatment: string; qspDays?: number | null; endDate?: string | null; intakes: typeof day.intakes }>);

                // Skip this day if no intakes match the filter
                if (Object.keys(filteredTreatments).length === 0) {
                  return null;
                }

                return (
                  <Card key={dayIdx} className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <h3 className="font-semibold text-sm">
                        {format(day.date, "EEEE d MMMM yyyy", { locale: fr })}
                      </h3>
                      {isToday(day.date) && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">Aujourd'hui</span>
                      )}
                    </div>

                    <div className="space-y-4">
                      {Object.entries(filteredTreatments).map(([treatmentId, group]) => (
                        <div key={treatmentId} className="space-y-2">
                          <div className="flex items-baseline gap-2 px-1">
                            <p className="text-xs font-medium text-primary">
                              {group.treatment}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {group.qspDays && `QSP : ${Math.round(group.qspDays / 30)} mois`}
                            </p>
                          </div>
                          <div className="space-y-2">
                            {group.intakes.map((intake) => (
                              <div key={intake.id} className="flex items-center justify-between p-3 rounded-lg bg-surface">
                                <div className="flex items-center gap-3 flex-1">
                                  {getStatusIcon(intake.status)}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{intake.medication}</p>
                                      {intake.dosage && <span className="text-xs text-muted-foreground">{intake.dosage}</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      Prévu à {intake.time}
                                      {intake.takenAt && ` • Pris à ${intake.takenAt}`}
                                    </p>
                                  </div>
                                </div>
                                {getStatusBadge(intake.status, intake.scheduledTimestamp, intake.takenAtTimestamp)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Observance thérapeutique</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">7 jours</p>
                    <p className="text-xl font-bold text-primary">{stats.adherence7Days}%</p>
                  </div>
                  <div className="w-full bg-surface-elevated rounded-full h-3">
                    <div 
                      className="bg-gradient-primary h-3 rounded-full transition-all" 
                      style={{ width: `${stats.adherence7Days}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">30 jours</p>
                    <p className="text-xl font-bold text-primary">{stats.adherence30Days}%</p>
                  </div>
                  <div className="w-full bg-surface-elevated rounded-full h-3">
                    <div 
                      className="bg-gradient-primary h-3 rounded-full transition-all" 
                      style={{ width: `${stats.adherence30Days}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Résumé</h3>
              <div className="grid grid-cols-3 gap-3">
                <div 
                  className="p-3 rounded-lg bg-success/10 cursor-pointer hover:bg-success/20 transition-colors" 
                  onClick={() => handleFilterClick("ontime")}
                >
                  <p className="text-xs text-muted-foreground mb-1">À l'heure</p>
                  <p className="text-2xl font-bold text-success">{stats.takenOnTime}</p>
                </div>
                <div 
                  className="p-3 rounded-lg bg-warning/10 cursor-pointer hover:bg-warning/20 transition-colors" 
                  onClick={() => handleFilterClick("late")}
                >
                  <p className="text-xs text-muted-foreground mb-1">En retard</p>
                  <p className="text-2xl font-bold text-warning">{stats.lateIntakes}</p>
                </div>
                <div 
                  className="p-3 rounded-lg bg-danger/10 cursor-pointer hover:bg-danger/20 transition-colors" 
                  onClick={() => handleFilterClick("missed")}
                >
                  <p className="text-xs text-muted-foreground mb-1">Manquées</p>
                  <p className="text-2xl font-bold text-danger">{stats.skipped}</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}