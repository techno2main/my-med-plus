import { AppLayout } from "@/components/Layout/AppLayout"
import { PageHeader } from "@/components/Layout/PageHeader"
import { useNavigate } from "react-router-dom"
import { useTreatmentsList } from "./hooks/useTreatmentsList"
import { TreatmentCard } from "./components/TreatmentCard"
import { EmptyState } from "./components/EmptyState"

const Treatments = () => {
  const navigate = useNavigate()
  const { treatments, loading } = useTreatmentsList()

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
      <div className="container max-w-2xl mx-auto px-3 md:px-4 py-6 space-y-6">
        <PageHeader 
          title="Traitement(s)"
          subtitle={`${treatments.filter(t => t.is_active).length} traitement(s) actif(s)`}
          showAddButton
          onAdd={() => navigate("/treatments/new")}
        />

        {/* Treatments List */}
        <div className="space-y-4">
          {treatments.length === 0 ? (
            <EmptyState />
          ) : (
            treatments.map((treatment) => (
              <TreatmentCard key={treatment.id} treatment={treatment} />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}

export default Treatments
