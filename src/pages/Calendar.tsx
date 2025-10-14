import { useState, useEffect } from "react"
import { AppLayout } from "@/components/Layout/AppLayout"
import { PageHeader } from "@/components/Layout/PageHeader"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp, Calendar as CalendarIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { format, startOfMonth, endOfMonth, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface DayIntake {
  date: Date
  total: number
  taken: number
  missed: number
  upcoming: number
}

interface IntakeDetail {
  id: string
  medication: string
  dosage: string
  time: string
  status: 'taken' | 'missed' | 'upcoming'
  treatment: string
}

const Calendar = () => {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [monthIntakes, setMonthIntakes] = useState<DayIntake[]>([])
  const [dayDetails, setDayDetails] = useState<IntakeDetail[]>([])
  const [observanceRate, setObservanceRate] = useState(0)
  const [nextPharmacyVisit, setNextPharmacyVisit] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [treatmentStartDate, setTreatmentStartDate] = useState<Date | null>(null)

  useEffect(() => {
    loadMonthData()
  }, [currentMonth])

  useEffect(() => {
    loadDayDetails()
  }, [selectedDate])

  const loadMonthData = async () => {
    try {
      setLoading(true)
      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)

      // Load active treatment start date
      const { data: activeTreatment } = await supabase
        .from("treatments")
        .select("start_date")
        .eq("is_active", true)
        .order("start_date", { ascending: true })
        .limit(1)
        .maybeSingle()

      if (activeTreatment?.start_date) {
        setTreatmentStartDate(new Date(activeTreatment.start_date))
      }

      // Load intakes for the month
      const { data: intakes } = await supabase
        .from("medication_intakes")
        .select("*")
        .gte("scheduled_time", monthStart.toISOString())
        .lte("scheduled_time", monthEnd.toISOString())

      // Process day by day using REAL intakes only
      const daysData: DayIntake[] = []
      const currentDate = new Date(monthStart)
      const now = new Date()

      while (currentDate <= monthEnd) {
        const dayIntakes = intakes?.filter((i: any) => 
          isSameDay(new Date(i.scheduled_time), currentDate)
        ) || []

        if (dayIntakes.length > 0) {
          const dayTotal = dayIntakes.length
          const dayTaken = dayIntakes.filter((i: any) => i.status === 'taken').length
          const daySkipped = dayIntakes.filter((i: any) => i.status === 'skipped').length
          
          // Count upcoming only if scheduled time is in the future
          const dayUpcoming = dayIntakes.filter((i: any) => {
            const scheduledTime = new Date(i.scheduled_time)
            return i.status === 'pending' && scheduledTime > now
          }).length

          daysData.push({
            date: new Date(currentDate),
            total: dayTotal,
            taken: dayTaken,
            missed: daySkipped,
            upcoming: dayUpcoming
          })
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      setMonthIntakes(daysData)

      // Calculate observance rate for the month
      const totalPast = daysData.reduce((sum, day) => sum + day.taken + day.missed, 0)
      const totalTaken = daysData.reduce((sum, day) => sum + day.taken, 0)
      setObservanceRate(totalPast > 0 ? Math.round((totalTaken / totalPast) * 100) : 100)

      // Load next pharmacy visit
      const { data: visits } = await supabase
        .from("pharmacy_visits")
        .select("visit_date")
        .gte("visit_date", format(now, "yyyy-MM-dd"))
        .eq("is_completed", false)
        .order("visit_date", { ascending: true })
        .limit(1)

      if (visits && visits.length > 0) {
        setNextPharmacyVisit(new Date(visits[0].visit_date))
      }

    } catch (error) {
      console.error("Error loading month data:", error)
      toast.error("Erreur lors du chargement du calendrier")
    } finally {
      setLoading(false)
    }
  }

  const loadDayDetails = async () => {
    try {
      // Check if selected date is before treatment start (compare only dates, not times)
      if (treatmentStartDate) {
        const selectedDateOnly = new Date(selectedDate)
        selectedDateOnly.setHours(0, 0, 0, 0)
        const treatmentStartDateOnly = new Date(treatmentStartDate)
        treatmentStartDateOnly.setHours(0, 0, 0, 0)
        
        if (selectedDateOnly < treatmentStartDateOnly) {
          setDayDetails([])
          return
        }
      }

      // Get medications from active treatments
      const { data: medications } = await supabase
        .from("medications")
        .select(`
          id,
          name,
          times,
          treatment_id,
          catalog_id,
          treatments!inner(name, is_active),
          medication_catalog(dosage_amount, default_dosage)
        `)
        .eq("treatments.is_active", true)

      // Get start and end of selected day
      const dayStart = new Date(selectedDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(selectedDate)
      dayEnd.setHours(23, 59, 59, 999)

      // Get ALL medications (including from inactive treatments) to match intakes
      const { data: allMedications } = await supabase
        .from("medications")
        .select("id, name")

      const { data: intakes } = await supabase
        .from("medication_intakes")
        .select("*")
        .gte("scheduled_time", dayStart.toISOString())
        .lte("scheduled_time", dayEnd.toISOString())

      const details: IntakeDetail[] = []
      const now = new Date()

      medications?.forEach((med: any) => {
        med.times?.forEach((time: string) => {
          const [hours, minutes] = time.split(':')
          const scheduledTime = new Date(selectedDate)
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

          // Find matching intake by medication name and time (not just ID)
          const intake = intakes?.find((i: any) => {
            const intakeTime = format(new Date(i.scheduled_time), 'HH:mm')
            const intakeMed = allMedications?.find(m => m.id === i.medication_id)
            return intakeMed?.name === med.name && intakeTime === time
          })

          let status: 'taken' | 'missed' | 'upcoming' = 'upcoming'
          
          if (intake?.status === 'taken') {
            status = 'taken'
          } else if (scheduledTime < now && selectedDate.setHours(0,0,0,0) < new Date().setHours(0,0,0,0)) {
            // Only mark as missed if it's a past day, not today
            status = 'missed'
          } else if (scheduledTime < now) {
            // For today, if time passed but not taken, still show as upcoming
            status = 'upcoming'
          }

          const catalogDosage = med.medication_catalog?.dosage_amount || med.medication_catalog?.default_dosage || ""
          
          details.push({
            id: intake?.id || `${med.id}-${time}`,
            medication: med.name,
            dosage: catalogDosage,
            time: time,
            status: status,
            treatment: med.treatments.name
          })
        })
      })

      details.sort((a, b) => a.time.localeCompare(b.time))
      setDayDetails(details)

    } catch (error) {
      console.error("Error loading day details:", error)
    }
  }

  const getDayIntake = (date: Date) => {
    return monthIntakes.find(intake => isSameDay(intake.date, date))
  }

  const getDayIndicator = (date: Date) => {
    const dayData = getDayIntake(date)
    if (!dayData) return null

    if (dayData.taken === dayData.total) {
      return <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-success" />
    } else if (dayData.missed > 0) {
      return <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-danger" />
    } else if (dayData.upcoming > 0) {
      return <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
    }
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <CheckCircle2 className="h-4 w-4 text-success" />
      case 'missed':
        return <XCircle className="h-4 w-4 text-danger" />
      case 'upcoming':
        return <Clock className="h-4 w-4 text-primary" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'taken':
        return <Badge variant="success" className="text-xs">Pris</Badge>
      case 'missed':
        return <Badge variant="danger" className="text-xs">Manqué</Badge>
      case 'upcoming':
        return <Badge className="text-xs">À venir</Badge>
      default:
        return null
    }
  }

  return (
    <AppLayout>
      <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
        <PageHeader 
          title="Calendrier"
          subtitle="Suivi mensuel des prises"
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 surface-elevated">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{observanceRate}%</p>
                <p className="text-xs text-muted-foreground">Observance ce mois</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 surface-elevated">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Prochaine visite</p>
                <p className="text-xs text-muted-foreground">
                  {nextPharmacyVisit ? format(nextPharmacyVisit, "d MMMM yyyy", { locale: fr }) : "Aucune planifiée"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 surface-elevated">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium">Prises du jour</p>
                <p className="text-xs text-muted-foreground">
                  {dayDetails.filter(d => d.status === 'taken').length}/{dayDetails.length} effectuées
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2 p-6 surface-elevated">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {format(currentMonth, "MMMM yyyy", { locale: fr })}
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date())}
                  >
                    Aujourd'hui
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  >
                    →
                  </Button>
                </div>
              </div>

              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={fr}
                className="rounded-md border"
                modifiers={{
                  booked: (date) => !!getDayIntake(date)
                }}
                modifiersClassNames={{
                  booked: "font-semibold"
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
              </div>
            </div>
          </Card>

          {/* Day Details */}
          <Card className="p-6 surface-elevated">
            <h3 className="text-lg font-semibold mb-4">
              {format(selectedDate, "d MMMM yyyy", { locale: fr })}
            </h3>
            
            {treatmentStartDate && (() => {
              const selectedDateOnly = new Date(selectedDate)
              selectedDateOnly.setHours(0, 0, 0, 0)
              const treatmentStartDateOnly = new Date(treatmentStartDate)
              treatmentStartDateOnly.setHours(0, 0, 0, 0)
              return selectedDateOnly < treatmentStartDateOnly
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
                        <span className="text-sm font-medium">{detail.time}</span>
                      </div>
                      {getStatusBadge(detail.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{detail.medication}</p>
                      {detail.dosage && <span className="text-xs text-muted-foreground">{detail.dosage}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{detail.treatment}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

export default Calendar
