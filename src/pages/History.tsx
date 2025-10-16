import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO, startOfDay, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";


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
  }[];
}

export default function History() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "history");
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<GroupedIntakes[]>([]);
  const [stats, setStats] = useState({
    takenOnTime: 0,
    skipped: 0,
    lateIntakes: 0,
    adherence7Days: 0,
    adherence30Days: 0
  });

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
            treatments(name)
          )
        `)
        .order("scheduled_time", { ascending: false })
        .limit(100);

      if (error) throw error;

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
          treatmentId: intake.medications?.treatment_id || ''
        });

        return acc;
      }, {});

      setHistoryData(Object.values(grouped));

      // Calculate stats - Filter by date ranges
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const intakes7Days = (intakesData || []).filter(i => 
        new Date(i.scheduled_time) >= sevenDaysAgo && 
        (i.status === 'taken' || i.status === 'skipped')
      );
      
      const intakes30Days = (intakesData || []).filter(i => 
        new Date(i.scheduled_time) >= thirtyDaysAgo && 
        (i.status === 'taken' || i.status === 'skipped')
      );

      // Calculer les prises à l'heure (≤30min de retard)
      const takenOnTime = (intakesData || []).filter(i => {
        if (i.status !== 'taken' || !i.taken_at) return false;
        const scheduledTime = new Date(i.scheduled_time);
        const takenTime = new Date(i.taken_at);
        const differenceMinutes = (takenTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
        return differenceMinutes <= 30;
      }).length;

      const skipped = (intakesData || []).filter(i => i.status === 'skipped').length;
      
      // Count late intakes (taken between 30min and 1h late)
      const lateIntakes = (intakesData || []).filter(i => {
        if (i.status !== 'taken' || !i.taken_at) return false;
        const scheduledTime = new Date(i.scheduled_time);
        const takenTime = new Date(i.taken_at);
        const differenceMinutes = (takenTime.getTime() - scheduledTime.getTime()) / (1000 * 60);
        return differenceMinutes > 30 && differenceMinutes <= 60;
      }).length;
      
      const taken7 = intakes7Days.filter(i => i.status === 'taken').length;
      const total7 = intakes7Days.length;
      
      const taken30 = intakes30Days.filter(i => i.status === 'taken').length;
      const total30 = intakes30Days.length;
      
      setStats({
        takenOnTime,
        skipped,
        lateIntakes,
        adherence7Days: total7 > 0 ? Math.round((taken7 / total7) * 100) : 0,
        adherence30Days: total30 > 0 ? Math.round((taken30 / total30) * 100) : 0
      });

    } catch (error) {
      console.error("Error loading history:", error);
      toast.error("Erreur lors du chargement de l'historique");
    } finally {
      setLoading(false);
    }
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
      // Jaune : entre 30min et 1h après
      else if (differenceMinutes <= 60) {
        return <Badge variant="warning">Pris</Badge>;
      }
      // Orange : plus d'1h après
      else {
        return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">Pris</Badge>;
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
                      intakes: []
                    };
                  }
                  acc[intake.treatmentId].intakes.push(intake);
                  return acc;
                }, {} as Record<string, { treatment: string; intakes: typeof day.intakes }>);

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
                      {Object.entries(groupedByTreatment).map(([treatmentId, group]) => (
                        <div key={treatmentId} className="space-y-2">
                          <p className="text-xs font-medium text-primary px-1">
                            {group.treatment}
                          </p>
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
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className="p-4 rounded-lg bg-success/10 cursor-pointer hover:bg-success/20 transition-colors" 
                  onClick={() => setActiveTab("history")}
                >
                  <p className="text-sm text-muted-foreground mb-1">Prises à l'heure</p>
                  <p className="text-3xl font-bold text-success">{stats.takenOnTime}</p>
                </div>
                <div 
                  className="p-4 rounded-lg bg-danger/10 cursor-pointer hover:bg-danger/20 transition-colors" 
                  onClick={() => setActiveTab("history")}
                >
                  <p className="text-sm text-muted-foreground mb-1">Prises manquées</p>
                  <p className="text-3xl font-bold text-danger">{stats.skipped}</p>
                </div>
                <div 
                  className="p-4 rounded-lg bg-warning/10 cursor-pointer hover:bg-warning/20 transition-colors col-span-2" 
                  onClick={() => setActiveTab("history")}
                >
                  <p className="text-sm text-muted-foreground mb-1">Prises en retard</p>
                  <p className="text-3xl font-bold text-warning">{stats.lateIntakes}</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}