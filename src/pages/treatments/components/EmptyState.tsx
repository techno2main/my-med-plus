import { Card } from "@/components/ui/card"
import { Pill } from "lucide-react"

export const EmptyState = () => {
  return (
    <Card className="p-12 text-center">
      <Pill className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <p className="text-muted-foreground">Aucun traitement actif</p>
    </Card>
  )
}
