import { AppLayout } from "@/components/Layout/AppLayout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

const Calendar = () => {
  const navigate = useNavigate();
  
  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Calendrier</h1>
            <p className="text-sm text-muted-foreground">Historique et planification</p>
          </div>
        </div>

        <Card className="p-12 text-center surface-elevated">
          <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Vue calendrier à venir</p>
        </Card>
      </div>
    </AppLayout>
  )
}

export default Calendar
