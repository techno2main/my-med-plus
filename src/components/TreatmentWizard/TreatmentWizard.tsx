import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TreatmentFormData } from "./types";
import { useTreatmentSubmit } from "./hooks/useTreatmentSubmit";
import { useTreatmentSteps } from "./hooks/useTreatmentSteps";
import { TreatmentWizardSteps } from "./components/TreatmentWizardSteps";
import { TreatmentWizardActions } from "./components/TreatmentWizardActions";

export function TreatmentWizard() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<TreatmentFormData>({
    name: "",
    description: "",
    prescribingDoctorId: undefined as any,
    prescriptionId: undefined as any,
    prescriptionDate: "",
    startDate: "",
    durationDays: "90",
    qsp: "30",
    prescriptionFile: null,
    prescriptionFileName: "",
    pharmacyId: undefined as any,
    firstPharmacyVisit: "",
    medications: [],
    stocks: {},
  });

  // Fonction de validation (doit être définie avant le hook)
  const canSubmit = () => {
    return (
      formData.name.trim() !== "" &&
      formData.medications.length > 0 &&
      formData.medications.every((_, index) => 
        formData.stocks[index] && formData.stocks[index] > 0
      )
    );
  };

  // Hooks personnalisés
  const { currentStep, totalSteps, handleNext, handlePrev, setCurrentStep } = useTreatmentSteps();
  const { loading, handleSubmit } = useTreatmentSubmit(formData, canSubmit);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prescData, doctorData, pharmacyData] = await Promise.all([
        supabase
          .from("prescriptions")
          .select("*, health_professionals(name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("health_professionals")
          .select("*")
          .eq("type", "doctor")
          .order("name"),
        supabase
          .from("health_professionals")
          .select("*")
          .eq("type", "pharmacy")
          .order("name"),
      ]);

      if (prescData.error) throw prescData.error;
      if (doctorData.error) throw doctorData.error;
      if (pharmacyData.error) throw pharmacyData.error;

      setPrescriptions(prescData.data || []);
      setDoctors(doctorData.data || []);
      setPharmacies(pharmacyData.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  return (
    <div className="space-y-6">
      <TreatmentWizardSteps
        currentStep={currentStep}
        totalSteps={totalSteps}
        formData={formData}
        setFormData={setFormData}
        prescriptions={prescriptions}
        doctors={doctors}
        pharmacies={pharmacies}
        onStepClick={setCurrentStep}
      />

      <TreatmentWizardActions
        currentStep={currentStep}
        totalSteps={totalSteps}
        loading={loading}
        onNext={handleNext}
        onPrev={handlePrev}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
