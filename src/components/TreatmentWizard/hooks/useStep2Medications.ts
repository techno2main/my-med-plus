import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { detectTakesFromDosage, getDefaultTimes } from "../utils/medicationUtils"
import type { TreatmentFormData, MedicationItem, CatalogMedication } from "../types"

export const useStep2Medications = (formData: TreatmentFormData, setFormData: (data: TreatmentFormData) => void) => {
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

  const handlePathologyChange = (value: string) => {
    setNewCustomMed({ ...newCustomMed, pathology: value })
    
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

  const selectPathology = (pathology: string) => {
    setNewCustomMed({ ...newCustomMed, pathology })
    setShowPathologySuggestions(false)
  }

  const addMedicationFromCatalog = (catalogMed: CatalogMedication) => {
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
    
    setFormData({
      ...formData,
      medications: [...formData.medications, newMed]
    })
    setShowDialog(false)
  }

  const addCustomMedication = async () => {
    if (!newCustomMed.name) return

    try {
      // Si une pathologie est saisie, vérifier si elle existe, sinon la créer
      if (newCustomMed.pathology && newCustomMed.pathology.trim()) {
        const { data: existingPathology } = await supabase
          .from("pathologies")
          .select("id")
          .ilike("name", newCustomMed.pathology.trim())
          .maybeSingle()

        if (!existingPathology) {
          // Créer la nouvelle pathologie
          await supabase
            .from("pathologies")
            .insert({ name: newCustomMed.pathology.trim() })
        }
      }

      // Parse la posologie pour détecter le nombre de prises et les moments
      const { count: detectedTakes, moments: detectedMoments } = detectTakesFromDosage(newCustomMed.posology || "")
      const defaultTimes = getDefaultTimes(detectedTakes, detectedMoments)

      // Add to catalog
      const { data } = await supabase
        .from("medication_catalog")
        .insert({
          name: newCustomMed.name,
          pathology: newCustomMed.pathology || null,
          default_posology: newCustomMed.posology || null,
          strength: newCustomMed.strength || null,
          default_times: defaultTimes
        })
        .select()
        .single()

      if (data) {
        const newMed: MedicationItem = {
          catalogId: data.id,
          name: data.name,
          pathology: data.pathology || "",
          posology: data.default_posology || "",
          takesPerDay: detectedTakes,
          times: defaultTimes,
          unitsPerTake: 1,
          minThreshold: 10,
          isCustom: true,
        }
        setFormData({ ...formData, medications: [...formData.medications, newMed] })
        setShowCustomDialog(false)
        setNewCustomMed({ name: "", pathology: "", posology: "", strength: "" })
        loadCatalog()
      }
    } catch (error) {
      console.error("Error adding custom medication:", error)
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
    setFormData({
      ...formData,
      medications: formData.medications.filter((_, i) => i !== index),
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

  return {
    catalog,
    pathologySuggestions,
    showPathologySuggestions,
    showDialog,
    setShowDialog,
    showCustomDialog,
    setShowCustomDialog,
    newCustomMed,
    setNewCustomMed,
    handlePathologyChange,
    selectPathology,
    addMedicationFromCatalog,
    addCustomMedication,
    updateMedication,
    updateMedicationPosology,
    removeMedication,
    updateTimeSlot,
    updateTakesPerDay
  }
}
