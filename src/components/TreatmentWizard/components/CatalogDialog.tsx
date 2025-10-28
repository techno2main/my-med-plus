import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { CatalogMedication } from "../types"

interface CatalogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalog: CatalogMedication[]
  onSelect: (medication: CatalogMedication) => void
}

export const CatalogDialog = ({
  open,
  onOpenChange,
  catalog,
  onSelect
}: CatalogDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Référentiel de médicaments</DialogTitle>
          <DialogDescription>
            Sélectionner un médicament ou en créer un nouveau.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[calc(80vh-80px)] px-6">
          <div className="space-y-3 py-4">
            {catalog.map((med) => (
              <Card
                key={med.id}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors active:scale-[0.98]"
                onClick={() => onSelect(med)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{med.name}</h4>
                      {med.strength && (
                        <span className="text-sm text-muted-foreground">{med.strength}</span>
                      )}
                    </div>
                    {(med.pathology || med.default_posology) && (
                      <div className="flex items-center gap-2 mb-2">
                        {med.pathology && (
                          <Badge variant="secondary">
                            {med.pathology}
                          </Badge>
                        )}
                        {med.default_posology && (
                          <span className="text-sm text-muted-foreground">{med.default_posology}</span>
                        )}
                      </div>
                    )}
                    {med.description && (
                      <p className="text-sm text-muted-foreground">
                        {med.description}
                      </p>
                    )}
                  </div>
                  <Plus className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
