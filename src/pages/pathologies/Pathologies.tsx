import { useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PathologySearch } from "./components/PathologySearch";
import { PathologyList } from "./components/PathologyList";
import { PathologyDialog } from "./components/PathologyDialog";
import { PathologyDeleteAlert } from "./components/PathologyDeleteAlert";
import { useEntityCrud } from "@/hooks/generic/useEntityCrud";
import { useEntityDialog } from "@/hooks/generic/useEntityDialog";
import { filterPathologies, type Pathology, type PathologyFormData } from "./utils/pathologyUtils";

const Pathologies = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Hook générique CRUD
  const { 
    items: pathologies, 
    isLoading, 
    create: createPathology, 
    update: updatePathology, 
    deleteEntity: deletePathology 
  } = useEntityCrud<Pathology, PathologyFormData>({
    tableName: "pathologies",
    queryKey: ["pathologies"],
    entityName: "Pathologie",
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
  } = useEntityDialog<Pathology, PathologyFormData>({
    name: "",
    description: ""
  });

  const filteredPathologies = filterPathologies(pathologies, searchTerm);

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Le nom de la pathologie est obligatoire");
      return;
    }

    const success = editingItem
      ? await updatePathology(editingItem.id, formData)
      : await createPathology(formData);

    if (success) closeDialog();
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deletePathology(deletingId);
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
              <h1 className="text-xl font-bold">Pathologies</h1>
              <p className="text-sm text-muted-foreground">{pathologies.length} pathologie(s)</p>
            </div>
            <Button className="gradient-primary" onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </header>
        </div>

        <PathologySearch value={searchTerm} onChange={setSearchTerm} />

        <PathologyList
          pathologies={filteredPathologies}
          isLoading={isLoading}
          onEdit={openDialog}
          onDelete={setDeletingId}
        />

        <PathologyDialog
          open={showDialog}
          onClose={closeDialog}
          onSubmit={handleSubmit}
          editingItem={editingItem}
          formData={formData}
          onFormChange={setFormData}
        />

        <PathologyDeleteAlert
          open={!!deletingId}
          onClose={() => setDeletingId(null)}
          onConfirm={handleDelete}
        />
      </div>
    </AppLayout>
  );
};

export default Pathologies;
