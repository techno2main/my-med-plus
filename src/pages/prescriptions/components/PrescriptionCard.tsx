import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, CheckCircle2, Circle, Eye, EyeOff } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { MedicationsList } from "./MedicationsList";
import { formatDate, formatQSP } from "../utils/prescriptionUtils";
import { getLocalDateString } from "@/lib/dateUtils";
import { useState, useRef } from "react";

interface RefillVisit {
  date: string;
  actualDate: string | null;
  visitNumber: number;
  isCompleted: boolean;
  treatmentId: string;
}

interface PrescriptionCardProps {
  prescription: {
    id: string;
    prescription_date: string;
    duration_days: number;
    expiry_date: string;
    status: "active" | "expiring" | "expired";
    notes: string | null;
    file_path: string | null;
    original_filename: string | null;
    doctor_name: string | null;
    treatments: Array<{ id: string; name: string; is_active?: boolean }>;
    medications: Array<{ id: string; name: string; posology: string }>;
    refillVisits: RefillVisit[];
    hasArchivedTreatment?: boolean;
  };
  onDownload: () => void;
  onToggleVisit: (treatmentId: string, visitNumber: number, currentStatus: boolean, plannedDate: string) => void;
}

export function PrescriptionCard({ prescription, onDownload, onToggleVisit }: PrescriptionCardProps) {
  // Vérifier si tous les traitements sont archivés
  const allTreatmentsArchived = prescription.treatments.every(t => t.is_active === false);
  
  // État pour afficher/masquer les détails des ordonnances archivées
  const [showDetails, setShowDetails] = useState(!allTreatmentsArchived);
  const detailsRef = useRef<HTMLDivElement>(null);
  
  const handleToggleDetails = () => {
    const newShowDetails = !showDetails;
    setShowDetails(newShowDetails);
    
    // Si on affiche les détails d'une ordonnance archivée, scroller vers le contenu
    if (newShowDetails && allTreatmentsArchived) {
      setTimeout(() => {
        detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  };
  
  // Vérifier si c'est une date unique (pas de refills multiples) et si la date est dépassée
  const isSingleDatePast = (visit: RefillVisit) => {
    if (prescription.refillVisits.length !== 1) return false;
    const today = getLocalDateString(new Date());
    const visitDate = getLocalDateString(new Date(visit.date));
    return today > visitDate;
  };
  
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">
              {prescription.treatments.length > 0
                ? prescription.treatments.map((t) => t.name).join(", ")
                : "Ordonnance"}
            </h3>
            {prescription.doctor_name && (
              <p className="text-sm text-muted-foreground">{prescription.doctor_name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {allTreatmentsArchived && (
            <>
              <span className="px-2 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
                Archivée
              </span>
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
            </>
          )}
          {!allTreatmentsArchived && <StatusBadge status={prescription.status} />}
        </div>
      </div>

      {showDetails && (
        <div ref={detailsRef}>
          <div className="flex gap-6 text-sm mb-4">
            <div>
              <p className="text-muted-foreground mb-1">Date Début</p>
              <p className="font-medium">{formatDate(prescription.prescription_date)}</p>
            </div>
            <div className="h-auto w-px bg-muted"></div>
            <div>
              <p className="text-muted-foreground mb-1">Validité</p>
              <div className="flex items-baseline gap-2">
                <p className="font-medium">{formatDate(prescription.expiry_date)}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatQSP(prescription.duration_days)}
                </p>
              </div>
            </div>
          </div>

      <MedicationsList medications={prescription.medications} />

      {prescription.notes && (
        <div className="mb-4 p-3 rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground">{prescription.notes}</p>
        </div>
      )}

      {prescription.refillVisits && prescription.refillVisits.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-3">Dates de rechargements</p>
          <div className="space-y-2">
            {prescription.refillVisits.map((visit, index) => {
              // Déterminer si ce rechargement est cliquable
              const isPreviousCompleted =
                index === 0 || prescription.refillVisits[index - 1]?.isCompleted;
              const isClickable = visit.visitNumber !== 1 && isPreviousCompleted;
              
              // Si c'est une date unique et qu'elle est dépassée, considérer comme complétée
              const isAutoChecked = isSingleDatePast(visit);
              const displayAsCompleted = visit.isCompleted || isAutoChecked;

              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg bg-muted/30 transition-colors ${
                    isClickable ? "cursor-pointer hover:bg-muted/50" : "pointer-events-none opacity-75"
                  }`}
                  {...(isClickable && {
                    onClick: () => onToggleVisit(visit.treatmentId, visit.visitNumber, visit.isCompleted, visit.date),
                  })}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {displayAsCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="text-sm">
                        {visit.visitNumber === 1
                          ? `Initial ${visit.visitNumber}/${prescription.refillVisits.length}`
                          : `Rechargement ${visit.visitNumber}/${prescription.refillVisits.length}`}
                      </span>
                    </div>
                    <div className="text-right space-y-0.5">
                      {visit.visitNumber === 1 ? (
                        // Pour le rechargement initial, afficher uniquement la date (sans "Prévu:")
                        <p className="text-sm font-medium">
                          {formatDate(visit.actualDate || visit.date)}
                        </p>
                      ) : visit.isCompleted && visit.actualDate ? (
                        <>
                          <p className="text-sm font-medium">{formatDate(visit.actualDate)}</p>
                          {visit.actualDate !== visit.date && (
                            <p className="text-xs text-muted-foreground">
                              Prévu: {formatDate(visit.date)}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm font-medium">{formatDate(visit.date)}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {prescription.file_path && (
          <p className="text-xs text-muted-foreground text-center">
            {prescription.original_filename || prescription.file_path.split("/").pop()}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onDownload}
            disabled={!prescription.file_path}
          >
            <Download className="mr-2 h-4 w-4" />
            Télécharger
          </Button>
        </div>
      </div>
        </div>
      )}
    </Card>
  );
}
