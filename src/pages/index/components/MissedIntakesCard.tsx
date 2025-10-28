import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"

interface MissedIntake {
  id: string
  medication: string
  displayTime: string
  scheduledTime: string
  status: string
}

interface MissedIntakesCardProps {
  missedIntakes: MissedIntake[]
  totalMissed: number
  onManage: () => void
}

export const MissedIntakesCard = ({ missedIntakes, totalMissed, onManage }: MissedIntakesCardProps) => {
  if (totalMissed === 0) return null

  // Calculer le retard pour aujourd'hui
  const calculateDelay = (scheduledTime: string) => {
    const now = new Date()
    const scheduled = new Date(scheduledTime)
    const diffMs = now.getTime() - scheduled.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return `${diffHours}h${diffMinutes > 0 ? diffMinutes.toString().padStart(2, '0') : ''}`
    } else {
      return `${diffMinutes}min`
    }
  }

  // Grouper par jour
  const groupedByDay = missedIntakes.reduce((acc, intake) => {
    const dayKey = intake.status === 'missed_yesterday' ? 'yesterday' : 'today'
    if (!acc[dayKey]) acc[dayKey] = []
    acc[dayKey].push(intake)
    return acc
  }, {} as Record<string, MissedIntake[]>)

  return (
    <Card className="p-4 border-orange-200 bg-orange-50">
      <div className="flex items-start gap-3">
        <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="space-y-2">
            {groupedByDay.yesterday && (
              <div>
                <h3 className="font-semibold text-sm text-orange-800">
                  {groupedByDay.yesterday.length === 1 
                    ? `1 prise à rattraper hier :` 
                    : `${groupedByDay.yesterday.length} prises à rattraper hier :`
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
                    ? `1 prise à rattraper aujourd'hui :` 
                    : `${groupedByDay.today.length} prises à rattraper aujourd'hui :`
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
          </div>
          <Button 
            size="sm" 
            className="mt-3 bg-gray-800 text-white hover:bg-gray-900 border-0"
            onClick={onManage}
          >
            Gérer les rattrapages
          </Button>
        </div>
      </div>
    </Card>
  )
}
