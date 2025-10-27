import { useState } from "react";
import type { Pathology } from "../utils/pathologyUtils";

export function usePathologyDialog() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Pathology | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const openDialog = (item?: Pathology) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || "",
      });
    } else {
      setEditingItem(null);
      setFormData({ name: "", description: "" });
    }
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingItem(null);
    setFormData({ name: "", description: "" });
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
