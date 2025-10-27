import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Save, Trash2 } from "lucide-react"

interface ActionButtonsProps {
  onSave: () => void
  deleteDialogOpen: boolean
  onDeleteDialogChange: (open: boolean) => void
  onDelete: () => void
}

export const ActionButtons = ({
  onSave,
  deleteDialogOpen,
  onDeleteDialogChange,
  onDelete
}: ActionButtonsProps) => {
  return (
    <>
      <div className="space-y-3">
        <Button className="w-full" onClick={onSave}>
          <Save className="mr-2 h-4 w-4" />
          Enregistrer les modifications
        </Button>
        <Button 
          variant="outline" 
          className="w-full border-danger text-danger hover:bg-danger hover:text-white"
          onClick={() => onDeleteDialogChange(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer le traitement
        </Button>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={onDeleteDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce traitement ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-danger hover:bg-danger/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
