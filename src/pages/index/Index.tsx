import { useState, useEffect, useRef } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { AppLayout } from "@/components/Layout/AppLayout"
import { Loader2 } from "lucide-react"
import { useMissedIntakesDetection } from "@/hooks/useMissedIntakesDetection"
import { useIntakeOverdue } from "@/hooks/useIntakeOverdue"
import { useDashboardData } from "./hooks/useDashboardData"
import { useTakeIntake } from "./hooks/useTakeIntake"
import { useSkipIntake } from "./hooks/useSkipIntake"
import { useAccordionState } from "./hooks/useAccordionState"
import { getLocalDateString, isIntakeValidationAllowed, getCurrentDateInParis } from "@/lib/dateUtils"
import { ActiveTreatmentsCard } from "./components/ActiveTreatmentsCard"
import { StockAlertsCard } from "./components/StockAlertsCard"
import { MissedIntakesCard } from "./components/MissedIntakesCard"
import { TodaySection } from "./components/TodaySection"
import { TomorrowSection } from "./components/TomorrowSection"
import { IntakeActionDialog } from "./components/IntakeActionDialog"
import { TakeIntakeDialog } from "./components/TakeIntakeDialog"
import { SkipIntakeDialog } from "./components/SkipIntakeDialog"
import { QuickActions } from "./components/QuickActions"
import { UpcomingIntake } from "./types"

const Index = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isIntakeOverdue } = useIntakeOverdue()
  const { missedIntakes, totalMissed, loading: missedLoading } = useMissedIntakesDetection()
  
  // Data loading
  const { upcomingIntakes, stockAlerts, activeTreatments, loading, reload } = useDashboardData()
  
  // Dialog states - 3 dialogs: action choice, take confirm, skip confirm
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [showTakeDialog, setShowTakeDialog] = useState(false)
  const [showSkipDialog, setShowSkipDialog] = useState(false)
  const [selectedIntake, setSelectedIntake] = useState<UpcomingIntake | null>(null)
  
  // Accordion state
  const { openAccordions, setOpenAccordions, setDefaultOpen } = useAccordionState()
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null)
  
  // Refs for scrolling
  const todaySectionRef = useRef<HTMLDivElement>(null)
  const tomorrowSectionRef = useRef<HTMLDivElement>(null)
  
  // Take intake hook
  const { takeIntake, processing: takeProcessing } = useTakeIntake(() => {
    setShowTakeDialog(false)
    setSelectedIntake(null)
    reload()
  })

  // Skip intake hook
  const { skipIntake, processing: skipProcessing } = useSkipIntake(() => {
    setShowSkipDialog(false)
    setSelectedIntake(null)
    reload()
  })

  // Auto-open today's accordions on load
  useEffect(() => {
    if (!loading && upcomingIntakes.length > 0) {
      // CRITIQUE: Utiliser l'heure de Paris pour éviter bugs sur émulateurs
      const today = getCurrentDateInParis()
      const todayDateString = getLocalDateString(today)
      
      const todayTreatmentIds = upcomingIntakes
        .filter(intake => {
          const intakeDateString = getLocalDateString(intake.date)
          return intakeDateString === todayDateString
        })
        .map(intake => `today-${intake.treatmentId}`)
      
      if (todayTreatmentIds.length > 0) {
        setDefaultOpen(todayTreatmentIds)
      }
    }
  }, [loading, upcomingIntakes])

  // Auto-open intake dialog from URL parameter (from calendar)
  useEffect(() => {
    const intakeId = searchParams.get('intake')
    if (intakeId && !loading && upcomingIntakes.length > 0) {
      const intake = upcomingIntakes.find(i => i.id === intakeId)
      if (intake) {
        setSelectedIntake(intake)
        setShowActionDialog(true)
        // Nettoyer le paramètre de l'URL
        setSearchParams({})
      }
    }
  }, [searchParams, loading, upcomingIntakes, setSearchParams])

  // Handlers
  const handleTakeIntake = (intake: UpcomingIntake) => {
    // Vérifier si c'est aujourd'hui et si l'heure est autorisée
    // CRITIQUE: Utiliser l'heure de Paris pour éviter bugs sur émulateurs
    const isToday = getLocalDateString(intake.date) === getLocalDateString(getCurrentDateInParis())
    if (isToday && !isIntakeValidationAllowed()) {
      toast.error("Validation non disponible", {
        description: "Les prises d'aujourd'hui sont validables à partir de 06h00"
      })
      return
    }
    
    setSelectedIntake(intake)
    setShowActionDialog(true)
  }

  // User chose to confirm the intake
  const handleConfirmIntakeChoice = () => {
    setShowActionDialog(false)
    setShowTakeDialog(true)
  }

  // User chose to skip the intake
  const handleSkipIntakeChoice = () => {
    setShowActionDialog(false)
    setShowSkipDialog(true)
  }

  const confirmTakeIntake = async () => {
    if (!selectedIntake) return
    await takeIntake(selectedIntake)
  }

  const confirmSkipIntake = async () => {
    if (!selectedIntake) return
    await skipIntake(selectedIntake)
  }

  const cancelActionDialog = () => {
    setShowActionDialog(false)
    setSelectedIntake(null)
  }

  const cancelTakeDialog = () => {
    setShowTakeDialog(false)
    // Go back to action dialog
    setShowActionDialog(true)
  }

  const cancelSkipDialog = () => {
    setShowSkipDialog(false)
    // Go back to action dialog
    setShowActionDialog(true)
  }

  const handleTreatmentClick = (treatmentId: string) => {
    setSelectedTreatmentId(treatmentId)
    
    const accordionIds = [
      `today-${treatmentId}`,
      `tomorrow-${treatmentId}`
    ]
    setOpenAccordions(accordionIds)
    
    setTimeout(() => {
      todaySectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'
      })
    }, 100)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        <ActiveTreatmentsCard
          treatments={activeTreatments}
          onViewAll={() => navigate("/treatments")}
          onTreatmentClick={handleTreatmentClick}
        />

        <StockAlertsCard alerts={stockAlerts} />

        {!missedLoading && (
          <MissedIntakesCard
            missedIntakes={missedIntakes}
            totalMissed={totalMissed}
            onManage={() => navigate("/rattrapage")}
          />
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Prochaines prises</h2>
          </div>

          <div className="space-y-6">
            <TodaySection
              ref={todaySectionRef}
              intakes={upcomingIntakes}
              openAccordions={openAccordions}
              onValueChange={setOpenAccordions}
              isOverdue={isIntakeOverdue}
              onTakeIntake={handleTakeIntake}
            />

            <TomorrowSection
              ref={tomorrowSectionRef}
              intakes={upcomingIntakes}
              openAccordions={openAccordions}
              onValueChange={setOpenAccordions}
              isOverdue={isIntakeOverdue}
              onTakeIntake={(intake) => {
                toast.error("Prises de demain non disponibles", {
                  description: "Attendez le jour J pour valider"
                })
              }}
            />
          </div>
        </section>

        <QuickActions
          onAddTreatment={() => navigate("/treatments/new")}
          onViewHistory={() => navigate("/history")}
        />
      </div>

      <IntakeActionDialog
        open={showActionDialog}
        intake={selectedIntake}
        onConfirmIntake={handleConfirmIntakeChoice}
        onSkipIntake={handleSkipIntakeChoice}
        onCancel={cancelActionDialog}
      />

      <TakeIntakeDialog
        open={showTakeDialog}
        intake={selectedIntake}
        onConfirm={confirmTakeIntake}
        onCancel={cancelTakeDialog}
        processing={takeProcessing}
      />

      <SkipIntakeDialog
        open={showSkipDialog}
        intake={selectedIntake}
        onConfirm={confirmSkipIntake}
        onCancel={cancelSkipDialog}
        processing={skipProcessing}
      />
    </AppLayout>
  )
}

export default Index
