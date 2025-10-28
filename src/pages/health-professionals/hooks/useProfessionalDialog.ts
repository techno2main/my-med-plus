import { useState } from "react";
import { HealthProfessional, ProfessionalType } from "../utils/professionalUtils";

export const useProfessionalDialog = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<HealthProfessional | null>(null);
  const [formData, setFormData] = useState<Omit<HealthProfessional, "id" | "user_id">>({
    name: "",
    type: "doctor",
    specialty: "",
    phone: "",
    email: "",
    street_address: "",
    postal_code: "",
    city: "",
    is_primary_doctor: false,
  });

  const openDialog = (type: ProfessionalType, item?: HealthProfessional) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        type: item.type,
        specialty: item.specialty || "",
        phone: item.phone || "",
        email: item.email || "",
        street_address: item.street_address || "",
        postal_code: item.postal_code || "",
        city: item.city || "",
        is_primary_doctor: item.is_primary_doctor || false,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        type: type,
        specialty: "",
        phone: "",
        email: "",
        street_address: "",
        postal_code: "",
        city: "",
        is_primary_doctor: false,
      });
    }
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingItem(null);
    setFormData({
      name: "",
      type: "doctor",
      specialty: "",
      phone: "",
      email: "",
      street_address: "",
      postal_code: "",
      city: "",
      is_primary_doctor: false,
    });
  };

  return {
    showDialog,
    editingItem,
    formData,
    setFormData,
    openDialog,
    closeDialog,
  };
};
