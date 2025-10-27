import { Card } from "@/components/ui/card"

export const EmptyState = () => {
  return (
    <Card className="p-12 text-center">
      <p className="text-muted-foreground">Aucun historique disponible</p>
    </Card>
  )
}
