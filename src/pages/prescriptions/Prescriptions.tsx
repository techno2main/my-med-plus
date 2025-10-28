import { AppLayout } from "@/components/Layout/AppLayout";
import { PageHeader } from "@/components/Layout/PageHeader";
import { usePrescriptions } from "./hooks/usePrescriptions";
import { PrescriptionList } from "./components/PrescriptionList";

export default function Prescriptions() {
  const { prescriptions, loading, handleToggleVisit, handleDownload } = usePrescriptions();

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <PageHeader title="Ordonnances" subtitle="Vos prescriptions médicales" />

        <PrescriptionList
          prescriptions={prescriptions}
          loading={loading}
          onDownload={handleDownload}
          onToggleVisit={handleToggleVisit}
        />
      </div>
    </AppLayout>
  );
}
