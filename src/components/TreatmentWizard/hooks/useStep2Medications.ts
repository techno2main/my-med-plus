import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { detectTakesFromDosage, getDefaultTimes } from "../utils/medicationUtils"
import type { TreatmentFormData, MedicationItem, CatalogMedication } from "../types"

export const useStep2Medications = (
  formData: TreatmentFormData, 
  setFormData: (data: TreatmentFormData) => void,
  onDuplicateFound?: (catalogMed: any) => void
) => {
  const [catalog, setCatalog] = useState<CatalogMedication[]>([])
  const [pathologies, setPathologies] = useState<string[]>([])
  const [pathologySuggestions, setPathologySuggestions] = useState<string[]>([])
  const [showPathologySuggestions, setShowPathologySuggestions] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [showCustomDialog, setShowCustomDialog] = useState(false)
  const [newCustomMed, setNewCustomMed] = useState({ 
    name: "", 
    pathology: "", 
    posology: "", 
    strength: "" 
  })

  useEffect(() => {
    loadCatalog()
    loadPathologies()
  }, [])

  const loadCatalog = async () => {
    const { data } = await supabase
      .from("medication_catalog")
      .select("id, name, pathology, description, default_posology, strength, default_times")
      .order("name")
    if (data) setCatalog(data)
  }

  const loadPathologies = async () => {
    const { data } = await supabase
      .from("pathologies")
      .select("name")
      .order("name")
    if (data) {
      setPathologies(data.map(p => p.name))
    }
  }

  const handleMedicationFieldChange = (field: keyof typeof newCustomMed, value: string) => {
    setNewCustomMed({ ...newCustomMed, [field]: value })
    
    // Si on modifie la pathologie, gérer les suggestions
    if (field === "pathology") {
      if (value.trim().length > 0) {
        const filtered = pathologies.filter(p => 
          p.toLowerCase().startsWith(value.toLowerCase())
        )
        setPathologySuggestions(filtered)
        setShowPathologySuggestions(filtered.length > 0)
      } else {
        setPathologySuggestions([])
        setShowPathologySuggestions(false)
      }
    }
  }

  const selectPathology = (pathology: string) => {
    setNewCustomMed({ ...newCustomMed, pathology })
    setShowPathologySuggestions(false)
  }

  const addMedicationFromCatalog = (catalogMed: CatalogMedication) => {
    // Vérifier si le médicament existe déjà
    const existingIndex = formData.medications.findIndex(med => 
      med.catalogId === catalogMed.id || 
      med.name.toLowerCase() === catalogMed.name.toLowerCase()
    )

    if (existingIndex !== -1) {
      alert(`Le médicament "${catalogMed.name}" est déjà dans votre liste.`)
      setShowDialog(false)
      return
    }

    const newMed: MedicationItem = {
      catalogId: catalogMed.id,
      name: catalogMed.name,
      pathology: catalogMed.pathology || "",
      posology: catalogMed.default_posology || "",
      takesPerDay: catalogMed.default_times?.length || 1,
      times: catalogMed.default_times || ["09:00"],
      unitsPerTake: 1,
      minThreshold: 10
    }
    
    const newIndex = formData.medications.length;
    setFormData({
      ...formData,
      medications: [...formData.medications, newMed],
      stocks: { ...formData.stocks, [newIndex]: 0 }
    })
    setShowDialog(false)
  }

  const addCustomMedication = async () => {
    if (!newCustomMed.name) return

    // Vérifier si le médicament existe déjà dans la liste
    const existingInList = formData.medications.findIndex(med => 
      med.name.toLowerCase() === newCustomMed.name.trim().toLowerCase()
    )

    if (existingInList !== -1) {
      alert(`Le médicament "${newCustomMed.name}" est déjà dans votre liste.`)
      setShowCustomDialog(false)
      resetCustomMed()
      return
    }

    // Vérifier si le médicament existe déjà dans le catalogue
    const existingInCatalog = catalog.find(med => 
      med.name.toLowerCase() === newCustomMed.name.trim().toLowerCase()
    )

    if (existingInCatalog) {
      if (onDuplicateFound) {
        onDuplicateFound(existingInCatalog);
        return;
      }
    }

    try {
      // Parse la posologie pour détecter le nombre de prises et les moments
      const { count: detectedTakes, moments: detectedMoments } = detectTakesFromDosage(newCustomMed.posology || "")
      const defaultTimes = getDefaultTimes(detectedTakes, detectedMoments)

      // NE PAS insérer en base maintenant - juste créer l'objet temporaire
      // L'insertion se fera lors de la soumission finale du wizard
      const newMed: MedicationItem = {
        name: newCustomMed.name.trim(),
        pathology: newCustomMed.pathology?.trim() || "",
        posology: newCustomMed.posology?.trim() || "",
        strength: newCustomMed.strength?.trim() || "",
        takesPerDay: detectedTakes,
        times: defaultTimes,
        unitsPerTake: 1,
        minThreshold: 10,
        isCustom: true,
        pendingInsertion: true, // Marque que ce médicament doit être inséré en base lors de la soumission
        pendingPathology: newCustomMed.pathology?.trim() || undefined,
      }
      
      const newIndex = formData.medications.length;
      setFormData({ 
        ...formData, 
        medications: [...formData.medications, newMed],
        stocks: { ...formData.stocks, [newIndex]: 0 }
      })
      // Réinitialiser le formulaire et fermer le dialog
      setNewCustomMed({ name: "", pathology: "", posology: "", strength: "" });
      setShowCustomDialog(false);
      loadCatalog();
    } catch (error) {
      console.error("Error adding custom medication:", error);
    }
  }

  const updateMedication = (index: number, updates: Partial<MedicationItem>) => {
    const updated = [...formData.medications]
    updated[index] = { ...updated[index], ...updates }
    setFormData({ ...formData, medications: updated })
  }

  const updateMedicationPosology = (index: number, newPosology: string) => {
    // Parse la posologie pour détecter le nombre de prises et les moments
    const { count: detectedTakes, moments: detectedMoments } = detectTakesFromDosage(newPosology)
    const defaultTimes = getDefaultTimes(detectedTakes, detectedMoments)

    const updated = [...formData.medications]
    updated[index] = { 
      ...updated[index], 
      posology: newPosology,
      takesPerDay: detectedTakes,
      times: defaultTimes
    }
    setFormData({ ...formData, medications: updated })
  }

  const removeMedication = (index: number) => {
    const updatedMedications = formData.medications.filter((_, i) => i !== index);
    
    // Reconstruire les stocks avec les nouveaux indices
    const updatedStocks: Record<number, number> = {};
    Object.keys(formData.stocks).forEach((key) => {
      const oldIndex = parseInt(key);
      if (oldIndex < index) {
        // Les médicaments avant celui supprimé gardent leur index
        updatedStocks[oldIndex] = formData.stocks[oldIndex];
      } else if (oldIndex > index) {
        // Les médicaments après celui supprimé ont leur index décrémenté
        updatedStocks[oldIndex - 1] = formData.stocks[oldIndex];
      }
      // Le médicament à l'index supprimé est ignoré
    });
    
    setFormData({
      ...formData,
      medications: updatedMedications,
      stocks: updatedStocks,
    })
  }

  const updateTimeSlot = (medIndex: number, timeIndex: number, value: string) => {
    const updated = [...formData.medications]
    updated[medIndex].times[timeIndex] = value
    setFormData({ ...formData, medications: updated })
  }

  const updateTakesPerDay = (index: number, newTakes: number) => {
    const updated = [...formData.medications]
    updated[index] = { 
      ...updated[index], 
      takesPerDay: newTakes,
      times: Array(newTakes).fill("").map((_, i) => updated[index].times[i] || "")
    }
    setFormData({ ...formData, medications: updated })
  }

  const resetCustomMed = () => {
    setNewCustomMed({ name: "", pathology: "", posology: "", strength: "" })
    setShowPathologySuggestions(false)
    setPathologySuggestions([])
  }

  return {
    catalog,
    pathologySuggestions,
    showPathologySuggestions,
    showDialog,
    setShowDialog,
    showCustomDialog,
    setShowCustomDialog,
    newCustomMed,
    handleMedicationFieldChange,
    selectPathology,
    addMedicationFromCatalog,
    addCustomMedication,
    updateMedication,
    updateMedicationPosology,
    removeMedication,
    updateTimeSlot,
    updateTakesPerDay,
    resetCustomMed
  }
}
