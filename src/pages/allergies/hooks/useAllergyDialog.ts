import { useState } from "react";
import type { Allergy } from "../utils/allergyUtils";

export function useAllergyDialog() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Allergy | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    severity: "",
    description: "",
  });

  const openDialog = (item?: Allergy) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        severity: item.severity || "",
        description: item.description || "",
      });
    } else {
      setEditingItem(null);
      setFormData({ name: "", severity: "", description: "" });
    }
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingItem(null);
    setFormData({ name: "", severity: "", description: "" });
  };

  return {
    showDialog,
    editingItem,
    formData,
    setFormData,
    openDialog,
    closeDialog,
  };
}
