import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUser } from "@/lib/auth-guard";
import { toast } from "sonner";

interface MedicationCatalog {
  id: string;
  name: string;
  pathology_id: string | null;
  pathologies?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  default_posology: string | null;
  strength: string | null;
  description: string | null;
  initial_stock: number;
  min_threshold: number;
  default_times: string[] | null;
  total_stock?: number;
  effective_threshold?: number;
}

interface FormData {
  name: string;
  pathology_id: string;
  default_posology: string;
  strength: string;
  description: string;
  initial_stock: string;
  min_threshold: string;
  default_times: string[];
}

const initialFormData: FormData = {
  name: "",
  pathology_id: "",
  default_posology: "Définir une ou plusieurs prises",
  strength: "",
  description: "",
  initial_stock: "0",
  min_threshold: "10",
  default_times: [],
};

export function useMedicationCatalog() {
  const navigate = useNavigate();
  const [medications, setMedications] = useState<MedicationCatalog[]>([]);
  const [pathologies, setPathologies] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingMed, setEditingMed] = useState<MedicationCatalog | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    loadMedications();
    loadPathologies();
  }, []);

  const loadPathologies = async () => {
    try {
      const { data, error } = await supabase
        .from("pathologies")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setPathologies(data || []);
    } catch (error) {
      console.error("Error loading pathologies:", error);
    }
  };

  const loadMedications = async () => {
    try {
      const { data, error } = await supabase
        .from("medication_catalog")
        .select(`
          *,
          pathologies (
            id,
            name,
            description
          )
        `)
        .order("name");

      if (error) throw error;

      // Pour chaque médicament du catalogue, calculer le stock total et le seuil minimal
      const medsWithStock = await Promise.all(
        (data || []).map(async (med: any) => {
          const { data: stockData } = await supabase
            .from("medications")
            .select("current_stock, min_threshold")
            .eq("catalog_id", med.id);

          const totalStock = stockData?.reduce((sum, item) => sum + (item.current_stock || 0), 0) || 0;

          // Calculer le seuil minimal moyen ou utiliser celui du catalogue
          const avgThreshold =
            stockData && stockData.length > 0
              ? Math.round(stockData.reduce((sum, item) => sum + (item.min_threshold || 10), 0) / stockData.length)
              : med.min_threshold || 10;

          return {
            ...med,
            total_stock: totalStock,
            effective_threshold: avgThreshold,
          } as MedicationCatalog;
        })
      );

      setMedications(medsWithStock);
    } catch (error) {
      console.error("Error loading medications:", error);
      toast.error("Erreur lors du chargement du référentiel");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error("Le nom du médicament est obligatoire");
      return;
    }

    // Validation : au moins une prise doit être définie
    if (formData.default_times.length === 0) {
      toast.error("Veuillez définir au moins une heure de prise");
      return;
    }

    // Validation : la posologie ne doit pas être vide
    if (!formData.default_posology || formData.default_posology.trim() === "") {
      toast.error("Veuillez définir la posologie");
      return;
    }

    try {
      if (editingMed) {
        const { error } = await supabase
          .from("medication_catalog")
          .update({
            name: formData.name,
            pathology_id: formData.pathology_id || null,
            default_posology: formData.default_posology || null,
            strength: formData.strength || null,
            description: formData.description || null,
            initial_stock: parseInt(formData.initial_stock) || 0,
            min_threshold: parseInt(formData.min_threshold) || 10,
            default_times: formData.default_times.length > 0 ? formData.default_times : null,
          })
          .eq("id", editingMed.id);

        if (error) throw error;
        toast.success("Médicament modifié avec succès");
      } else {
        const { data: user, error } = await getAuthenticatedUser();
        if (error) {
          console.warn('[useMedicationCatalog] Utilisateur non authentifié:', error.message);
        }
        
        const { error: insertError } = await supabase.from("medication_catalog").insert({
          name: formData.name,
          pathology_id: formData.pathology_id || null,
          default_posology: formData.default_posology || null,
          strength: formData.strength || null,
          description: formData.description || null,
          initial_stock: parseInt(formData.initial_stock) || 0,
          min_threshold: parseInt(formData.min_threshold) || 10,
          default_times: formData.default_times.length > 0 ? formData.default_times : null,
          created_by: user?.id,
          is_approved: false,
        });

        if (insertError) throw insertError;
        toast.success("Médicament ajouté avec succès");
      }

      loadMedications();
      closeDialog();
    } catch (error) {
      console.error("Error saving medication:", error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await supabase.from("medication_catalog").delete().eq("id", deletingId);

      if (error) throw error;
      toast.success("Médicament supprimé");
      loadMedications();
    } catch (error) {
      console.error("Error deleting medication:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setShowDeleteAlert(false);
      setDeletingId(null);
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setShowDeleteAlert(true);
  };

  const openDialog = (med?: MedicationCatalog) => {
    if (med) {
      setEditingMed(med);
      setFormData({
        name: med.name,
        pathology_id: med.pathology_id || "",
        default_posology: med.default_posology || "",
        strength: med.strength || "",
        description: med.description || "",
        initial_stock: String(med.initial_stock || 0),
        min_threshold: String(med.min_threshold || 10),
        default_times: med.default_times || [],
      });
    } else {
      setEditingMed(null);
      setFormData(initialFormData);
    }
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingMed(null);
    setFormData(initialFormData);
  };

  const handleStockClick = async (catalogId: string) => {
    // Trouver le premier médicament dans les traitements qui utilise ce catalog_id
    const { data } = await supabase.from("medications").select("id").eq("catalog_id", catalogId).limit(1).single();

    if (data) {
      navigate(`/stocks/${data.id}`);
    } else {
      navigate("/stocks");
    }
  };

  const filteredMedications = medications.filter(
    (med) =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.pathologies?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    medications,
    pathologies,
    loading,
    searchTerm,
    setSearchTerm,
    showDialog,
    setShowDialog: openDialog,
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
  };
}
