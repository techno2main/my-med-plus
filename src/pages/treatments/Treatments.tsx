import { AppLayout } from "@/components/Layout/AppLayout"
import { PageHeader } from "@/components/Layout/PageHeader"
import { useNavigate } from "react-router-dom"
import { useTreatmentsList } from "./hooks/useTreatmentsList"
import { TreatmentCard } from "./components/TreatmentCard"
import { EmptyState } from "./components/EmptyState"

const Treatments = () => {
  const navigate = useNavigate()
  const { treatments, loading, reloadTreatments } = useTreatmentsList()

  const activeTreatmentsCount = treatments.filter(t => t.is_active).length
  
  // Fonction pour gérer le pluriel
  const getSubtitle = () => {
    if (activeTreatmentsCount === 0) return "Aucun traitement actif"
    if (activeTreatmentsCount === 1) return "1 traitement actif"
    return `${activeTreatmentsCount} traitements actifs`
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6">
          <p>Chargement...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-3 md:px-4 pb-6">
        <div className="sticky top-0 z-20 bg-background pt-6 pb-4">
          <PageHeader 
            title="Traitement(s)"
            subtitle={getSubtitle()}
            showAddButton
            onAdd={() => navigate("/treatments/new")}
          />
        </div>

        {/* Treatments List */}
        <div className="space-y-4 mt-4">
          {treatments.length === 0 ? (
            <EmptyState />
          ) : (
            treatments.map((treatment) => (
              <TreatmentCard 
                key={treatment.id} 
                treatment={treatment} 
                onTreatmentTerminated={reloadTreatments}
              />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default Treatments
