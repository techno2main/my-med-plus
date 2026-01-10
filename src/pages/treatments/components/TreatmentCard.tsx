import { useState, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Calendar, User, Download, Pill, Eye, EyeOff } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { formatToFrenchDate } from "@/lib/dateUtils"
import { MedicationItem } from "./MedicationItem"
import { usePrescriptionDownload } from "@/hooks/usePrescriptionDownload"
import type { Treatment } from "../types"

interface TreatmentCardProps {
  treatment: Treatment
}

export const TreatmentCard = ({ treatment }: TreatmentCardProps) => {
  const navigate = useNavigate()
  const [showDetails, setShowDetails] = useState(treatment.is_active) // Par défaut : visible si actif, masqué si archivé
  const detailsRef = useRef<HTMLDivElement>(null)
  const { downloadPrescription } = usePrescriptionDownload()

  const handleToggleDetails = () => {
    const newShowDetails = !showDetails
    setShowDetails(newShowDetails)
    
    // Si on affiche les détails d'un traitement archivé, scroller vers le contenu
    if (newShowDetails && !treatment.is_active) {
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 150)
    }
  }

  const handleDownloadPrescription = (e: React.MouseEvent) => {
    e.preventDefault()
    if (treatment.prescription?.file_path) {
      downloadPrescription(treatment.prescription.file_path, treatment.prescription.original_filename)
    }
  }

  return (
    <Card className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{treatment.name}</h3>
            {!treatment.is_active && (
              <button
                onClick={handleToggleDetails}
                className="p-1 hover:bg-muted rounded transition-colors"
                aria-label={showDetails ? "Masquer les détails" : "Afficher les détails"}
              >
                {showDetails ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            )}
          </div>
          {treatment.is_active ? (
            <Badge variant="default" className="mt-1 bg-success text-white">
              Actif
            </Badge>
          ) : (
            <Badge variant="secondary" className="mt-1 bg-muted text-muted-foreground">
              Archivé
            </Badge>
          )}
        </div>
        {treatment.is_active && (
          <Button variant="ghost" size="sm" onClick={() => navigate(`/treatments/${treatment.id}/edit`)}>
            Modifier
          </Button>
        )}
      </div>

      {/* Medications - Affichés seulement si showDetails est true */}
      {showDetails && (
        <div ref={detailsRef}>
          <div className="space-y-2">
            {treatment.medications.map((med, idx) => (
              <MedicationItem key={idx} medication={med} isArchived={!treatment.is_active} />
            ))}
          </div>

          {/* Metadata Footer */}
          <div className="pt-2 border-t border-border space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span className="whitespace-nowrap">
            Début : {formatToFrenchDate(treatment.start_date)}
            {treatment.qsp_days && (
              <span className="text-[10px]"> (QSP {Math.round(treatment.qsp_days / 30)} mois)</span>
            )}
            {treatment.end_date && (
              <> • Fin : {formatToFrenchDate(treatment.end_date)}</>
            )}
          </span>
        </div>
        {treatment.prescribing_doctor && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{treatment.prescribing_doctor.name}</span>
          </div>
        )}
        {treatment.prescription_id && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Download className="h-3 w-3" />
            <button 
              onClick={() => navigate(`/prescriptions?open=${treatment.prescription_id}`)}
              className="hover:text-primary underline cursor-pointer"
            >
              Consulter l'ordonnance
            </button>
          </div>
        )}
        {treatment.next_pharmacy_visit && treatment.end_date && (
          (() => {
            // Afficher le prochain rechargement seulement si :
            // 1. La visite est AVANT la fin du traitement
            // 2. Ce n'est PAS la visite initiale (visit_number > 1)
            const nextVisitDate = new Date(treatment.next_pharmacy_visit.visit_date);
            const endDate = new Date(treatment.end_date);
            const isRefill = treatment.next_pharmacy_visit.visit_number > 1;
            
            // Pas d'affichage si :
            // - Visite après ou à la fin du traitement
            // - C'est la visite initiale (pas un rechargement)
            if (nextVisitDate >= endDate || !isRefill) return null;
            
            return (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Pill className="h-3 w-3" />
                <span>Prochain rechargement : {nextVisitDate.toLocaleDateString("fr-FR")}</span>
              </div>
              );
            })()
          )}
        </div>
        </div>
      )}
    </Card>
  )
}