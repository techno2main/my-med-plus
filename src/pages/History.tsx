import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, Calendar as CalendarIcon, List, ClockAlert, Pill, ChevronDown, ChevronUp } from "lucide-react";
import { format, parseISO, startOfDay, isToday } from "date-fns";
import { fr } from 'date-fns/locale';
import { formatToFrenchTime } from '../lib/dateUtils';
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
      strength?: string;
      default_posology?: string;
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
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const todayRef = useRef<HTMLDivElement>(null);
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

  // Auto-expand today's section without scrolling
  useEffect(() => {
    if (historyData.length > 0 && activeTab === "history") {
      // Find today's date in the data
      const todayData = historyData.find(day => isToday(day.date));
      if (todayData) {
        const todayKey = todayData.date.toISOString();
        setExpandedDays(new Set([todayKey])); // Only expand today
      }
    }
  }, [historyData, activeTab]);

  // Auto-expand first matching day when filter changes
  useEffect(() => {
    if (historyData.length > 0 && filterStatus !== "all") {
      // Helper function to check if intake matches filter
      const matchesFilter = (intake: any) => {
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
        
        return false;
      };

      // Find first day with matching intakes
      const filteredData = historyData
        .filter(day => {
          const today = startOfDay(new Date());
          const dayDate = startOfDay(day.date);
          return dayDate <= today;
        });

      for (const day of filteredData) {
        const hasMatchingIntake = day.intakes.some(matchesFilter);
        if (hasMatchingIntake) {
          const dayKey = day.date.toISOString();
          const newSet = new Set<string>();
          
          // Keep today if it exists
          const todayData = historyData.find(d => isToday(d.date));
          if (todayData) {
            newSet.add(todayData.date.toISOString());
          }
          
          // Add the first matching day
          newSet.add(dayKey);
          setExpandedDays(newSet);
          break;
        }
      }
    }
  }, [filterStatus, historyData]);

  const toggleDay = (dateKey: string, isTodaySection: boolean) => {
    setExpandedDays(prev => {
      const newSet = new Set<string>();
      
      // Keep today always in the set if it exists
      const todayData = historyData.find(day => isToday(day.date));
      if (todayData) {
        newSet.add(todayData.date.toISOString());
      }
      
      // Toggle the clicked day (only one non-today day can be open)
      if (!prev.has(dateKey)) {
        newSet.add(dateKey);
      }
      // If clicking the same day that's already open, close it (remove it from set)
      
      return newSet;
    });
  };

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
            medication_catalog(strength, default_posology),
            treatments(name, start_date, end_date, prescription_id)
          )
        `)
        .order("scheduled_time", { ascending: false });

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

        const dosage = intake.medications?.medication_catalog?.strength || 
                       intake.medications?.medication_catalog?.default_posology || 
                       "";
        
        const treatmentId = intake.medications?.treatment_id || '';
        const treatmentInfo = treatmentsQspMap.get(treatmentId);
        
        acc[dateKey].intakes.push({
          id: intake.id,
          time: formatToFrenchTime(intake.scheduled_time),
          medication: intake.medications?.name || 'Médicament inconnu',
          dosage: dosage,
          status: intake.status,
          takenAt: intake.taken_at ? formatToFrenchTime(intake.taken_at) : undefined,
          scheduledTimestamp: intake.scheduled_time,
          takenAtTimestamp: intake.taken_at,
          treatment: intake.medications?.treatments?.name || 'Traitement inconnu',
          treatmentId: treatmentId,
          treatmentQspDays: treatmentInfo?.qsp_days || null,
          treatmentEndDate: treatmentInfo?.end_date || null
        });

        return acc;
      }, {});

      // Sort intakes within each day: 1) by scheduled time, 2) by medication name
      Object.values(grouped).forEach(day => {
        day.intakes.sort((a, b) => {
          // Compare scheduled time first
          const timeCompare = a.time.localeCompare(b.time);
          if (timeCompare !== 0) return timeCompare;
          // If same time, compare medication names alphabetically
          return a.medication.localeCompare(b.medication);
        });
      });

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
    // Toujours afficher l'icône pilule blanche, peu importe le statut
    return <Pill className="h-5 w-5 text-white" />;
  };

  const getStatusBadge = (status: string, scheduledTimestamp?: string, takenAtTimestamp?: string) => {
    if (status === "taken" && scheduledTimestamp && takenAtTimestamp) {
      const scheduled = new Date(scheduledTimestamp);
      const taken = new Date(takenAtTimestamp);
      const differenceMinutes = (taken.getTime() - scheduled.getTime()) / (1000 * 60);
      
      // Vert : avant l'heure ou jusqu'à 30min après (à l'heure)
      if (differenceMinutes <= 30) {
        return <CheckCircle2 className="h-6 w-6 text-success" />;
      }
      // Vert : entre 30min et 1h après (léger retard)
      else if (differenceMinutes <= 60) {
        return <ClockAlert className="h-6 w-6 text-success" />;
      }
      // Vert : plus d'1h après (gros retard)
      else {
        return <ClockAlert className="h-6 w-6 text-success" />;
      }
    }
    
    switch (status) {
      case "taken":
        return <CheckCircle2 className="h-6 w-6 text-success" />;
      case "skipped":
        return <XCircle className="h-6 w-6 text-danger" />;
      case "pending":
        return <Clock className="h-6 w-6 text-warning" />;
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
          subtitle="Suivi des prises de médicaments"
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
                  className={`h-10 w-full relative ${filterStatus === "late" ? "" : "border-success/50 text-success hover:bg-success/10"}`}
                >
                  <ClockAlert className="h-5 w-5" />
                  {stats.lateIntakes > 0 && (
                    <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full border-2 border-background ${filterStatus === "late" ? "bg-primary-foreground text-primary" : "bg-success text-white"}`}>
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
              historyData
                .filter(day => {
                  // Ne garder que aujourd'hui et les jours passés
                  const today = startOfDay(new Date());
                  const dayDate = startOfDay(day.date);
                  return dayDate <= today;
                })
                .map((day, dayIdx) => {
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

                const isTodaySection = isToday(day.date);
                const dateKey = day.date.toISOString();
                const isExpanded = isTodaySection || expandedDays.has(dateKey);

                return (
                  <Card 
                    key={dayIdx} 
                    className="p-4"
                    ref={isTodaySection ? todayRef : null}
                  >
                    <div 
                      className={`flex items-center justify-between gap-2 mb-4 ${!isTodaySection ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}`}
                      onClick={() => !isTodaySection && toggleDay(dateKey, isTodaySection)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <h3 className="font-semibold text-sm">
                          {isTodaySection ? "Aujourd'hui" : format(day.date, "EEEE d MMMM yyyy", { locale: fr })}
                        </h3>
                        {isTodaySection && (
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {format(day.date, "d MMMM yyyy", { locale: fr })}
                          </span>
                        )}
                      </div>
                      {!isTodaySection && (
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>

                    {isExpanded && (
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
                    )}
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
              <h3 className="font-semibold mb-4">Résumé (depuis le 13/10/25)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div 
                  className="p-3 rounded-lg bg-success/10 cursor-pointer hover:bg-success/20 transition-colors" 
                  onClick={() => handleFilterClick("ontime")}
                >
                  <p className="text-xs text-muted-foreground mb-1">À l'heure</p>
                  <p className="text-2xl font-bold text-success">{stats.takenOnTime}</p>
                </div>
                <div 
                  className="p-3 rounded-lg bg-success/10 cursor-pointer hover:bg-success/20 transition-colors" 
                  onClick={() => handleFilterClick("late")}
                >
                  <p className="text-xs text-muted-foreground mb-1">En retard</p>
                  <p className="text-2xl font-bold text-success">{stats.lateIntakes}</p>
                </div>
                <div 
                  className="p-3 rounded-lg bg-danger/10 cursor-pointer hover:bg-danger/20 transition-colors" 
                  onClick={() => handleFilterClick("missed")}
                >
                  <p className="text-xs text-muted-foreground mb-1">Manquées</p>
                  <p className="text-2xl font-bold text-danger">{stats.skipped}</p>
                </div>
              </div>
              
              {/* Total des prises avec période */}
              {historyData.length > 0 && (() => {
                // Séparer les prises effectuées (taken/skipped) des prises à venir (pending)
                const completedDays = historyData
                  .map(day => ({
                    date: day.date,
                    intakes: day.intakes.filter(intake => intake.status !== 'pending')
                  }))
                  .filter(day => day.intakes.length > 0);
                
                const pendingDays = historyData
                  .map(day => ({
                    date: day.date,
                    intakes: day.intakes.filter(intake => intake.status === 'pending')
                  }))
                  .filter(day => day.intakes.length > 0);
                
                const completedIntakesCount = completedDays.reduce((sum, day) => sum + day.intakes.length, 0);
                const pendingIntakesCount = pendingDays.reduce((sum, day) => sum + day.intakes.length, 0);
                
                // Dates pour les prises effectuées
                const sortedCompletedDays = [...completedDays].sort((a, b) => a.date.getTime() - b.date.getTime());
                const completedFirstDate = sortedCompletedDays[0]?.date;
                const completedLastDate = sortedCompletedDays[sortedCompletedDays.length - 1]?.date;
                
                // Dates pour les prises prévues
                const sortedPendingDays = [...pendingDays].sort((a, b) => a.date.getTime() - b.date.getTime());
                const pendingFirstDate = sortedPendingDays[0]?.date;
                const pendingLastDate = sortedPendingDays[sortedPendingDays.length - 1]?.date;
                
                return (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground text-center space-y-1">
                      {completedIntakesCount > 0 && (
                        <p>
                          <span className="font-semibold text-foreground">{completedIntakesCount}</span> prises effectuées à ce jour
                        </p>
                      )}
                      {pendingIntakesCount > 0 && (
                        <p>
                          <span className="font-semibold text-foreground">{pendingIntakesCount}</span> prévues sur les 7 prochains jours
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}