import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ActiveTreatment } from "../types"

interface ActiveTreatmentsCardProps {
  treatments: ActiveTreatment[]
  onViewAll: () => void
  onTreatmentClick: (treatmentId: string) => void
}

export const ActiveTreatmentsCard = ({ treatments, onViewAll, onTreatmentClick }: ActiveTreatmentsCardProps) => {
  if (treatments.length === 0) return null

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Traitements actifs</h3>
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            Voir tout
          </Button>
        </div>
        <div className="space-y-2">
          {treatments.map((treatment, index) => {
            const startDate = new Date(treatment.startDate)
            const endDate = new Date(treatment.endDate)
            const qspMonths = treatment.qspDays ? Math.round(treatment.qspDays / 30) : null
            
            return (
              <div 
                key={treatment.id} 
                className="cursor-pointer hover:bg-surface/50 p-3 rounded-lg transition-colors border border-border"
                onClick={() => onTreatmentClick(treatment.id)}
              >
                {/* Ligne 1 : Numéro + Nom du traitement + QSP */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-primary text-base">{index + 1}</span>
                  <span className="font-semibold text-base">{treatment.name}</span>
                  {qspMonths && (
                    <span className="text-sm text-muted-foreground">(QSP {qspMonths} mois)</span>
                  )}
                </div>
                
                {/* Ligne 2 : Dates */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                  <span>
                    {format(startDate, "dd/MM/yy", { locale: fr })} - {format(endDate, "dd/MM/yy", { locale: fr })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
