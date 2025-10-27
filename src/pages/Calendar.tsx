import { useState, useEffect } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp, Calendar as CalendarIcon, Stethoscope, Pill, ClockAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIntakeOverdue } from "@/hooks/useIntakeOverdue";
import { formatToFrenchTime } from "../lib/dateUtils";

interface DayIntake {
  date: Date;
  total: number;
  taken: number;
  missed: number;
  upcoming: number;
}

interface IntakeDetail {
  id: string;
  medication: string;
  dosage: string;
  time: string;
  takenAt?: string;
  status: 'taken' | 'missed' | 'upcoming';
  treatment: string;
  scheduledTimestamp?: string;
  takenAtTimestamp?: string;
}

const Calendar = () => {
  const navigate = useNavigate();
  const { isIntakeOverdue } = useIntakeOverdue();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [monthIntakes, setMonthIntakes] = useState<DayIntake[]>([]);
  const [dayDetails, setDayDetails] = useState<IntakeDetail[]>([]);
  const [observanceRate, setObservanceRate] = useState(0);
  const [nextPharmacyVisit, setNextPharmacyVisit] = useState<Date | null>(null);
  const [nextDoctorVisit, setNextDoctorVisit] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [treatmentStartDate, setTreatmentStartDate] = useState<Date | null>(null);

  useEffect(() => {
    loadMonthData();
  }, [currentMonth]);

  useEffect(() => {
    loadDayDetails();
  }, [selectedDate]);

  const loadMonthData = async () => {
    try {
      setLoading(true);
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Extend range to include visible days from previous/next months (typically ±7 days)
      const extendedStart = new Date(monthStart);
      extendedStart.setDate(extendedStart.getDate() - 7);
      const extendedEnd = new Date(monthEnd);
      extendedEnd.setDate(extendedEnd.getDate() + 7);

      // Load active treatment start date and end date - get all active treatments and take the EARLIEST one
      const { data: activeTreatments, error: treatmentError } = await supabase
        .from("treatments")
        .select("start_date, end_date")
        .eq("is_active", true)
        .order("start_date", { ascending: true }); // Prendre le plus ancien, pas le plus récent

      if (treatmentError) {
        console.error("Error loading active treatment:", treatmentError);
      }

      const activeTreatment = activeTreatments && activeTreatments.length > 0 ? activeTreatments[0] : null;

      if (activeTreatment) {
        if (activeTreatment.start_date) {
          setTreatmentStartDate(new Date(activeTreatment.start_date));
        }
        
        if (activeTreatment.end_date) {
          const endDate = new Date(activeTreatment.end_date);
          setNextDoctorVisit(endDate);
        }
      }

      // Load intakes for the extended range to include visible days from adjacent months
      const { data: intakes } = await supabase
        .from("medication_intakes")
        .select(`
          *,
          medications!inner(
            treatment_id,
            treatments!inner(is_active)
          )
        `)
        .gte("scheduled_time", extendedStart.toISOString())
        .lte("scheduled_time", extendedEnd.toISOString())
        .eq("medications.treatments.is_active", true);

      // Process day by day using REAL intakes only (but now including adjacent month days)
      const daysData: DayIntake[] = [];
      const currentDate = new Date(extendedStart);
      const now = new Date();

      while (currentDate <= extendedEnd) {
        const dayIntakes = intakes?.filter((i: any) =>
          isSameDay(new Date(i.scheduled_time), currentDate)
        ) || [];

        if (dayIntakes.length > 0) {
          const dayTotal = dayIntakes.length;
          const dayTaken = dayIntakes.filter((i: any) => i.status === 'taken').length;

          // Count missed: either explicitly skipped OR pending but in the past
          const dayMissed = dayIntakes.filter((i: any) => {
            if (i.status === 'skipped') return true;
            // Only count as missed if it's a past day (not today)
            if (i.status === 'pending') {
              const scheduledTime = new Date(i.scheduled_time);
              const scheduledDateOnly = new Date(scheduledTime);
              scheduledDateOnly.setHours(0, 0, 0, 0);
              const nowDateOnly = new Date(now);
              nowDateOnly.setHours(0, 0, 0, 0);
              return scheduledDateOnly < nowDateOnly;
            }
            return false;
          }).length;

          // Count upcoming: pending and scheduled time is in the future (including today's future times)
          const dayUpcoming = dayIntakes.filter((i: any) => {
            const scheduledTime = new Date(i.scheduled_time);
            return i.status === 'pending' && scheduledTime > now;
          }).length;

          daysData.push({
            date: new Date(currentDate),
            total: dayTotal,
            taken: dayTaken,
            missed: dayMissed,
            upcoming: dayUpcoming
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      setMonthIntakes(daysData);

      // Calculate observance rate for the month
      const totalPast = daysData.reduce((sum, day) => sum + day.taken + day.missed, 0);
      const totalTaken = daysData.reduce((sum, day) => sum + day.taken, 0);
      setObservanceRate(totalPast > 0 ? Math.round((totalTaken / totalPast) * 100) : 100);

      // Load next pharmacy visit (uniquement pour traitements actifs)
      const { data: visits } = await supabase
        .from("pharmacy_visits")
        .select(`
          visit_date,
          treatments!inner(is_active)
        `)
        .gte("visit_date", format(now, "yyyy-MM-dd"))
        .eq("is_completed", false)
        .eq("treatments.is_active", true)
        .order("visit_date", { ascending: true })
        .limit(1);

      if (visits && visits.length > 0) {
        setNextPharmacyVisit(new Date(visits[0].visit_date));
      }

    } catch (error) {
      console.error("Error loading month data:", error);
      toast.error("Erreur lors du chargement du calendrier");
    } finally {
      setLoading(false);
    }
  };

  const loadDayDetails = async () => {
    try {
      // Check if selected date is before treatment start
      if (treatmentStartDate) {
        const selectedDateOnly = new Date(selectedDate);
        selectedDateOnly.setHours(0, 0, 0, 0);
        const treatmentStartDateOnly = new Date(treatmentStartDate);
        treatmentStartDateOnly.setHours(0, 0, 0, 0);

        if (selectedDateOnly < treatmentStartDateOnly) {
          setDayDetails([]);
          return;
        }
      }

      // Get start and end of selected day
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateOnly = new Date(selectedDate);
      selectedDateOnly.setHours(0, 0, 0, 0);
      const isPast = selectedDateOnly < today;

      // SYSTÈME UNIFIÉ : Lire UNIQUEMENT depuis medication_intakes
      // Plus de génération dynamique !
      const { data: intakes, error: intakesError } = await supabase
        .from("medication_intakes")
        .select(`
          id,
          medication_id,
          scheduled_time,
          taken_at,
          status,
          medications!inner (
            name,
            treatment_id,
            treatments!inner (name, is_active),
            medication_catalog (strength, default_posology)
          )
        `)
        .gte("scheduled_time", dayStart.toISOString())
        .lte("scheduled_time", dayEnd.toISOString())
        .eq("medications.treatments.is_active", true)
        .order("scheduled_time", { ascending: true });

      if (intakesError) throw intakesError;

      const details: IntakeDetail[] = [];

      // Traiter toutes les prises de la même manière
      (intakes || []).forEach((intake: any) => {
        const scheduledTime = new Date(intake.scheduled_time);
        
        let status: 'taken' | 'missed' | 'upcoming' = 'upcoming';
        if (intake.status === 'taken') {
          status = 'taken';
        } else if (intake.status === 'skipped') {
          status = 'missed';
        } else if (intake.status === 'pending') {
          if (isPast || scheduledTime < now) {
            status = 'missed';
          } else {
            status = 'upcoming';
          }
        }

        const catalogDosage = intake.medications?.medication_catalog?.strength || 
                              intake.medications?.medication_catalog?.default_posology || "";

        // Convertir UTC vers heure locale française
        const localTime = formatToFrenchTime(intake.scheduled_time);
        const localTakenAt = intake.taken_at ? formatToFrenchTime(intake.taken_at) : undefined;

        details.push({
          id: intake.id,
          medication: intake.medications?.name || '',
          dosage: catalogDosage,
          time: localTime,
          takenAt: localTakenAt,
          status: status,
          treatment: intake.medications?.treatments?.name || '',
          scheduledTimestamp: intake.scheduled_time,
          takenAtTimestamp: intake.taken_at || undefined
        });
      });

      // Sort details: 1) by scheduled time, 2) by medication name alphabetically
      details.sort((a, b) => {
        // Compare scheduled time first
        const timeCompare = a.time.localeCompare(b.time);
        if (timeCompare !== 0) return timeCompare;
        // If same time, compare medication names alphabetically
        return a.medication.localeCompare(b.medication);
      });

      setDayDetails(details);

    } catch (error) {
      console.error("Error loading day details:", error);
    }
  };

  const getDayIntake = (date: Date) => {
    return monthIntakes.find(intake => isSameDay(intake.date, date));
  };

  const getDayIndicator = (date: Date) => {
    const dayData = getDayIntake(date);
    
    // Check for special dates
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    // Check if it's pharmacy visit
    if (nextPharmacyVisit) {
      const pharmacyDate = new Date(nextPharmacyVisit);
      pharmacyDate.setHours(0, 0, 0, 0);
      if (dateOnly.getTime() === pharmacyDate.getTime()) {
        return <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-base">⚕️</div>;
      }
    }
    
    // Check if it's doctor visit
    if (nextDoctorVisit) {
      const doctorDate = new Date(nextDoctorVisit);
      doctorDate.setHours(0, 0, 0, 0);
      if (dateOnly.getTime() === doctorDate.getTime()) {
        return <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-base">🩺</div>;
      }
    }
    
    if (!dayData || dayData.total === 0) return null;

    const now = new Date();
    const nowDateOnly = new Date(now);
    nowDateOnly.setHours(0, 0, 0, 0);

    const isPastDay = dateOnly < nowDateOnly;
    const isToday = dateOnly.getTime() === nowDateOnly.getTime();

    // Only show green if ALL intakes are taken
    if (dayData.taken === dayData.total) {
      return <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-success" />;
    }
    // Show red if there are any missed intakes (past days only)
    else if (dayData.missed > 0 && isPastDay) {
      return <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-danger" />;
    }
    // Show blue only for future days with only upcoming intakes
    else if (!isPastDay && !isToday && dayData.upcoming > 0 && dayData.taken === 0) {
      return <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />;
    }
    // No indicator for partially completed days or today with pending items
    return null;
  };

  const getStatusIcon = (status: string) => {
    // Toujours afficher l'icône pilule blanche, peu importe le statut
    return <Pill className="h-4 w-4 text-white" />;
  };

  const getStatusBadge = (status: string, scheduledTimestamp?: string, takenAtTimestamp?: string) => {
    if (status === 'taken' && scheduledTimestamp && takenAtTimestamp) {
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
      case 'taken':
        return <CheckCircle2 className="h-6 w-6 text-success" />;
      case 'missed':
        return <XCircle className="h-6 w-6 text-danger" />;
      case 'upcoming':
        // Vérifier si la prise est en retard pour changer l'icône
        if (scheduledTimestamp) {
          const scheduledDate = new Date(scheduledTimestamp);
          if (isIntakeOverdue(scheduledDate)) {
            return <ClockAlert className="h-6 w-6 text-success" />;
          }
        }
        return <Clock className="h-6 w-6 text-warning" />;
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        <PageHeader 
          title="Calendrier" 
          subtitle="Suivi détaillé des prises"
        />

        {/* Stats Overview */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 surface-elevated cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/prescriptions')}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Recharge
                  </p>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {nextPharmacyVisit 
                      ? format(nextPharmacyVisit, "d MMM yyyy", { locale: fr }) 
                      : "Aucun planifié"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 surface-elevated cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Stethoscope className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    RDV Doc
                  </p>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {nextDoctorVisit 
                      ? format(nextDoctorVisit, "d MMM yyyy", { locale: fr }) 
                      : "Aucune planifiée"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6">
          {/* Calendar */}
          <Card className="p-6 surface-elevated">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-xl font-bold">
                    {format(currentMonth, "yyyy", { locale: fr })}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {format(currentMonth, "MMMM", { locale: fr })}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="h-8 w-8 p-0"
                  >
                    ←
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const today = new Date();
                      setCurrentMonth(today);
                      setSelectedDate(today);
                    }}
                    className="h-8 px-2 text-xs"
                  >
                    Aujourd'hui
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="h-8 w-8 p-0"
                  >
                    →
                  </Button>
                </div>
              </div>

              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date);
                    // Si la date sélectionnée est dans un mois différent, changer le mois affiché
                    if (date.getMonth() !== currentMonth.getMonth() || date.getFullYear() !== currentMonth.getFullYear()) {
                      setCurrentMonth(new Date(date.getFullYear(), date.getMonth()));
                    }
                  }
                }}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={fr}
                className="rounded-md border"
                modifiers={{
                  booked: (date) => !!getDayIntake(date),
                  today: (date) => isSameDay(date, new Date())
                }}
                modifiersClassNames={{
                  booked: "font-semibold",
                  today: "bg-primary/20 text-primary font-bold"
                }}
                components={{
                  DayContent: ({ date }) => (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {format(date, "d")}
                      {getDayIndicator(date)}
                    </div>
                  )
                }}
              />

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-muted-foreground">Effectuées</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-danger" />
                  <span className="text-muted-foreground">Manquées</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Prochaines</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⚕️</span>
                  <span className="text-muted-foreground">Pharmacie</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🩺</span>
                  <span className="text-muted-foreground">Médecin</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Day Details */}
          <Card className="p-6 surface-elevated">
            <div className="flex items-baseline gap-2 mb-4">
              <h3 className="text-lg font-semibold">
                {format(selectedDate, "d MMMM yyyy", { locale: fr })}
              </h3>
              {dayDetails.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {dayDetails.filter(d => d.status === 'taken').length}/{dayDetails.length}
                </span>
              )}
            </div>
            
            {treatmentStartDate && (() => {
              const selectedDateOnly = new Date(selectedDate);
              selectedDateOnly.setHours(0, 0, 0, 0);
              const treatmentStartDateOnly = new Date(treatmentStartDate);
              treatmentStartDateOnly.setHours(0, 0, 0, 0);
              return selectedDateOnly < treatmentStartDateOnly;
            })() ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun traitement à cette date
              </p>
            ) : dayDetails.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune prise planifiée
              </p>
            ) : (
              <div className="space-y-3">
                {dayDetails.map((detail) => (
                  <div key={detail.id} className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(detail.status)}
                        <span className={`text-sm font-medium ${
                          detail.status === 'upcoming' && detail.scheduledTimestamp && isIntakeOverdue(new Date(detail.scheduledTimestamp)) 
                            ? 'text-green-700' 
                            : ''
                        }`}>
                          {detail.time}
                          {detail.takenAt && detail.status === 'taken' && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({detail.takenAt})
                            </span>
                          )}
                        </span>
                      </div>
                      {getStatusBadge(detail.status, detail.scheduledTimestamp, detail.takenAtTimestamp)}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{detail.medication}</p>
                      {detail.dosage && (
                        <span className="text-xs text-muted-foreground">{detail.dosage}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{detail.treatment}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Calendar;
