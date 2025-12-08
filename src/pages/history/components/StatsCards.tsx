import { Card } from "@/components/ui/card"
import { AdherenceStats } from "@/hooks/useAdherenceStats"
import { CheckCircle2, ClockAlert, SkipForward, XCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface StatsCardsProps {
  stats: AdherenceStats
  onFilterClick: (filter: 'ontime' | 'late' | 'missed' | 'skipped') => void
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
        <TooltipProvider>
          <div className="grid grid-cols-4 gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="p-3 rounded-lg bg-success/10 cursor-pointer hover:bg-success/20 transition-colors text-center" 
                  onClick={() => onFilterClick("ontime")}
                >
                  <CheckCircle2 className="h-5 w-5 text-success mx-auto mb-1" />
                  <p className="text-2xl font-bold text-success">{stats.takenOnTime}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>À l'heure</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="p-3 rounded-lg bg-success/10 cursor-pointer hover:bg-success/20 transition-colors text-center" 
                  onClick={() => onFilterClick("late")}
                >
                  <ClockAlert className="h-5 w-5 text-success mx-auto mb-1" />
                  <p className="text-2xl font-bold text-success">{stats.lateIntakes}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>En retard</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="p-3 rounded-lg bg-warning/10 cursor-pointer hover:bg-warning/20 transition-colors text-center" 
                  onClick={() => onFilterClick("skipped")}
                >
                  <SkipForward className="h-5 w-5 text-warning mx-auto mb-1" />
                  <p className="text-2xl font-bold text-warning">{stats.skipped}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sautées</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  className="p-3 rounded-lg bg-danger/10 cursor-pointer hover:bg-danger/20 transition-colors text-center" 
                  onClick={() => onFilterClick("missed")}
                >
                  <XCircle className="h-5 w-5 text-danger mx-auto mb-1" />
                  <p className="text-2xl font-bold text-danger">{stats.missed}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manquées</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
        
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
