import { Button } from "@/components/ui/button"
import { Pill, Clock } from "lucide-react"

interface QuickActionsProps {
  onAddTreatment: () => void
  onViewHistory: () => void
}

export const QuickActions = ({ onAddTreatment, onViewHistory }: QuickActionsProps) => {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Actions rapides</h3>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-20 flex-col gap-2" onClick={onAddTreatment}>
          <Pill className="h-5 w-5" />
          <span className="text-sm">Ajouter un traitement</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col gap-2" onClick={onViewHistory}>
          <Clock className="h-5 w-5" />
          <span className="text-sm">Historique</span>
        </Button>
      </div>
    </section>
  )
}
