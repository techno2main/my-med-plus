import { AppLayout } from "@/components/Layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useMedicationCatalog } from "./hooks/useMedicationCatalog";
import { MedicationSearchBar } from "./components/MedicationSearchBar";
import { MedicationList } from "./components/MedicationList";
import { MedicationDialog } from "./components/MedicationDialog";
import { MedicationDeleteAlert } from "./components/MedicationDeleteAlert";

const MedicationCatalog = () => {
  const {
    medications,
    pathologies,
    loading,
    searchTerm,
    setSearchTerm,
    showDialog,
    closeDialog,
    showDeleteAlert,
    setShowDeleteAlert,
    editingMed,
    formData,
    setFormData,
    handleSubmit,
    handleDelete,
    confirmDelete,
    handleStockClick,
    filteredMedications,
    openDialog,
    navigate,
  } = useMedicationCatalog();

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/referentials")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <header className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Médicaments</h1>
              <p className="text-sm text-muted-foreground">{medications.length} médicament(s)</p>
            </div>
            <Button className="gradient-primary" onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </header>
        </div>

        <MedicationSearchBar value={searchTerm} onChange={setSearchTerm} />

        <MedicationList
          medications={filteredMedications}
          loading={loading}
          onEdit={openDialog}
          onDelete={confirmDelete}
          onStockClick={handleStockClick}
        />

        <MedicationDialog
          open={showDialog}
          onOpenChange={closeDialog}
          editingMed={editingMed}
          formData={formData}
          setFormData={setFormData}
          pathologies={pathologies}
          onSubmit={handleSubmit}
          onStockClick={handleStockClick}
        />

        <MedicationDeleteAlert
          open={showDeleteAlert}
          onOpenChange={setShowDeleteAlert}
          onConfirm={handleDelete}
        />
      </div>
    </AppLayout>
  );
};

export default MedicationCatalog;
