import { useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AllergySearch } from "./components/AllergySearch";
import { AllergyList } from "./components/AllergyList";
import { AllergyDialog } from "./components/AllergyDialog";
import { AllergyDeleteAlert } from "./components/AllergyDeleteAlert";
import { useEntityCrud } from "@/hooks/generic/useEntityCrud";
import { useEntityDialog } from "@/hooks/generic/useEntityDialog";
import { filterAllergies, type Allergy, type AllergyFormData } from "./utils/allergyUtils";

const Allergies = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Hook générique CRUD
  const { 
    items: allergies, 
    isLoading, 
    create: createAllergy, 
    update: updateAllergy, 
    deleteEntity: deleteAllergy 
  } = useEntityCrud<Allergy, AllergyFormData>({
    tableName: "allergies",
    queryKey: ["allergies"],
    entityName: "Allergie",
    orderBy: "name",
    addUserId: false // Référentiel admin, pas de user_id
  });

  // Hook générique Dialog
  const { 
    showDialog, 
    editingItem, 
    formData, 
    setFormData, 
    openDialog, 
    closeDialog 
  } = useEntityDialog<Allergy, AllergyFormData>({
    name: "",
    severity: "",
    description: ""
  });

  const filteredAllergies = filterAllergies(allergies, searchTerm);

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Le nom de l'allergie est obligatoire");
      return;
    }

    const success = editingItem
      ? await updateAllergy(editingItem.id, formData)
      : await createAllergy(formData);

    if (success) closeDialog();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteAllergy(deletingId);
    setDeletingId(null);
  };

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/referentials")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <header className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Allergies</h1>
              <p className="text-sm text-muted-foreground">{allergies.length} allergie(s)</p>
            </div>
            <Button className="gradient-primary" onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </header>
        </div>

        <AllergySearch value={searchTerm} onChange={setSearchTerm} />

        <AllergyList
          allergies={filteredAllergies}
          isLoading={isLoading}
          onEdit={openDialog}
          onDelete={setDeletingId}
        />

        <AllergyDialog
          open={showDialog}
          onClose={closeDialog}
          onSubmit={handleSubmit}
          editingItem={editingItem}
          formData={formData}
          onFormChange={setFormData}
        />

        <AllergyDeleteAlert
          open={!!deletingId}
          onClose={() => setDeletingId(null)}
          onConfirm={handleDelete}
        />
      </div>
    </AppLayout>
  );
};

export default Allergies;
