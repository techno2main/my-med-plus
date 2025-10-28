import { Card } from "@/components/ui/card"
import { AdherenceStats } from "@/hooks/useAdherenceStats"

interface StatsCardsProps {
  stats: AdherenceStats
  onFilterClick: (filter: 'ontime' | 'late' | 'missed') => void
  totalCompleted: number
  totalPending: number
}

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
        <div className="grid grid-cols-3 gap-3">
          <div 
            className="p-3 rounded-lg bg-success/10 cursor-pointer hover:bg-success/20 transition-colors" 
            onClick={() => onFilterClick("ontime")}
          >
            <p className="text-xs text-muted-foreground mb-1">À l'heure</p>
            <p className="text-2xl font-bold text-success">{stats.takenOnTime}</p>
          </div>
          <div 
            className="p-3 rounded-lg bg-success/10 cursor-pointer hover:bg-success/20 transition-colors" 
            onClick={() => onFilterClick("late")}
          >
            <p className="text-xs text-muted-foreground mb-1">En retard</p>
            <p className="text-2xl font-bold text-success">{stats.lateIntakes}</p>
          </div>
          <div 
            className="p-3 rounded-lg bg-danger/10 cursor-pointer hover:bg-danger/20 transition-colors" 
            onClick={() => onFilterClick("missed")}
          >
            <p className="text-xs text-muted-foreground mb-1">Manquées</p>
            <p className="text-2xl font-bold text-danger">{stats.skipped}</p>
          </div>
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
