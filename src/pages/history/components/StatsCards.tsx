import { Card } from "@/components/ui/card"
import { AdherenceStats } from "@/hooks/useAdherenceStats"
import { StatusIcon, statusBgClasses, statusHoverBgClasses, IntakeStatus } from "@/components/ui/status-icon"

interface StatsCardsProps {
  stats: AdherenceStats
  onFilterClick: (filter: 'ontime' | 'late' | 'missed' | 'skipped') => void
  totalCompleted: number
  totalPending: number
}

const statItems: { status: IntakeStatus; key: keyof AdherenceStats }[] = [
  { status: 'ontime', key: 'takenOnTime' },
  { status: 'late', key: 'lateIntakes' },
  { status: 'skipped', key: 'skipped' },
  { status: 'missed', key: 'missed' },
]

export const StatsCards = ({ stats, onFilterClick, totalCompleted, totalPending }: StatsCardsProps) => {
  return (
    <>
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Observance</h3>
        <div className="space-y-4">
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
        <div className="grid grid-cols-4 gap-2">
          {statItems.map(({ status, key }) => (
            <div 
              key={status}
              className={`p-3 rounded-lg cursor-pointer transition-colors text-center ${statusBgClasses[status]} ${statusHoverBgClasses[status]}`}
              onClick={() => onFilterClick(status as 'ontime' | 'late' | 'missed' | 'skipped')}
            >
              <div className="flex justify-center mb-1">
                <StatusIcon status={status} size="md" />
              </div>
              <p className={`text-2xl font-bold ${status === 'missed' ? 'text-danger' : status === 'skipped' ? 'text-warning' : 'text-success'}`}>
                {stats[key]}
              </p>
            </div>
          ))}
        </div>
        
        {(totalCompleted > 0 || totalPending > 0) && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground text-center space-y-1">
              {totalCompleted > 0 && (
                <p>
                  <span className="font-semibold text-foreground">{totalCompleted}</span> prises effectuées à ce jour
                </p>
              )}
              {totalPending > 0 && (
                <p>
                  <span className="font-semibold text-foreground">{totalPending}</span> prévues sur les 7 prochains jours
                </p>
              )}
            </div>
          </div>
        )}
      </Card>
    </>
  )
}
