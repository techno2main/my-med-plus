import { AppLayout } from "@/components/Layout/AppLayout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { filterByType, TabType, mapTypeToDb, ProfessionalType } from "./utils/professionalUtils";
import { useHealthProfessionals } from "./hooks/useHealthProfessionals";
import { useProfessionalDialog } from "./hooks/useProfessionalDialog";
import { ProfessionalTabs } from "./components/ProfessionalTabs";
import { ProfessionalDialog } from "./components/ProfessionalDialog";
import { ProfessionalDeleteAlert } from "./components/ProfessionalDeleteAlert";

const HealthProfessionals = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("medecins");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    professionals,
    isLoading,
    createProfessional,
    updateProfessional,
    deleteProfessional,
  } = useHealthProfessionals();

  const {
    showDialog,
    editingItem,
    formData,
    setFormData,
    openDialog,
    closeDialog,
  } = useProfessionalDialog();

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchTerm("");
  };

  const handleAdd = (type: "medecin" | "pharmacie" | "laboratoire") => {
    const dbType = mapTypeToDb(type === "medecin" ? "medecins" : type === "pharmacie" ? "pharmacies" : "laboratoires") as ProfessionalType;
    openDialog(dbType);
  };

  const handleEdit = (item: any) => {
    openDialog(item.type, item);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const handleSubmit = async () => {
    if (editingItem) {
      await updateProfessional(editingItem.id, formData);
    } else {
      await createProfessional(formData);
    }
    closeDialog();
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await deleteProfessional(deletingId);
      setDeletingId(null);
    }
  };

  const filteredData = {
    medecins: filterByType(professionals, "medecins", searchTerm),
    pharmacies: filterByType(professionals, "pharmacies", searchTerm),
    laboratoires: filterByType(professionals, "laboratoires", searchTerm),
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/referentials")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Professionnels de santé</h1>
          </div>

          <ProfessionalTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            professionals={filteredData}
            isLoading={isLoading}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <ProfessionalDialog
            open={showDialog}
            onClose={closeDialog}
            editingItem={editingItem}
            formData={formData}
            onFormChange={setFormData}
            onSubmit={handleSubmit}
          />

          <ProfessionalDeleteAlert
            open={!!deletingId}
            onClose={() => setDeletingId(null)}
            onConfirm={confirmDelete}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default HealthProfessionals;
