import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, addMonths } from "date-fns";
import { WizardProgress } from "./WizardProgress";
import { Step1Info } from "./Step1Info";
import { Step2Medications } from "./Step2Medications";
import { Step3Stocks } from "./Step3Stocks";
import { Step4Summary } from "./Step4Summary";
import { TreatmentFormData } from "./types";

const TOTAL_STEPS = 4;

export function TreatmentWizard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<TreatmentFormData>({
    name: "",
    description: "",
    prescribingDoctorId: "",
    prescriptionId: "",
    prescriptionDate: "",
    durationDays: "90",
    prescriptionFile: null,
    prescriptionFileName: "",
    pharmacyId: "",
    firstPharmacyVisit: "",
    medications: [],
    stocks: {},
  });

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

  const canSubmit = () => {
    // Validation only for final submit
    return (
      formData.name.trim() !== "" &&
      formData.medications.length > 0 &&
      formData.medications.every((_, index) => 
        formData.stocks[index] && formData.stocks[index] > 0
      )
    );
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit()) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez renseigner tous les champs obligatoires avant de créer le traitement.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      let prescriptionId = formData.prescriptionId;

      // Toujours créer une prescription (obligatoire pour la contrainte DB)
      if (!prescriptionId) {
        const { data: prescData, error: prescError } = await supabase
          .from("prescriptions")
          .insert({
            user_id: user.id,
            prescribing_doctor_id: formData.prescribingDoctorId || null,
            prescription_date: formData.prescriptionDate || new Date().toISOString().split('T')[0],
            duration_days: parseInt(formData.durationDays) || 90,
            file_path: null,
            original_filename: null,
          })
          .select()
          .single();

        if (prescError) throw prescError;
        prescriptionId = prescData.id;
      }

      // Upload prescription file if provided
      if (formData.prescriptionFile && prescriptionId) {
        const fileExt = formData.prescriptionFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('prescriptions')
          .upload(filePath, formData.prescriptionFile);

        if (uploadError) throw uploadError;

        // Update prescription record with file
        const { error: updateError } = await supabase
          .from("prescriptions")
          .update({
            file_path: filePath,
            original_filename: formData.prescriptionFileName,
          })
          .eq('id', prescriptionId);

        if (updateError) throw updateError;
      }

      // Create treatment
      const startDate = formData.prescriptionDate || new Date().toISOString().split('T')[0];
      let endDate = null;
      if (formData.durationDays) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + parseInt(formData.durationDays));
        endDate = end.toISOString().split('T')[0];
      }

      const { data: treatment, error: treatmentError } = await supabase
        .from("treatments")
        .insert({
          user_id: user.id,
          prescription_id: prescriptionId, // Toujours défini maintenant
          pharmacy_id: formData.pharmacyId || null,
          name: formData.name,
          description: formData.description,
          start_date: startDate,
          end_date: endDate,
          pathology: formData.medications.map(m => m.pathology).filter(Boolean).join(", "),
        })
        .select()
        .single();

      if (treatmentError) throw treatmentError;

      // Create medications
      const medicationsToInsert = formData.medications.map((med, index) => ({
        treatment_id: treatment.id,
        catalog_id: med.catalogId || null,
        name: med.name,
        posology: med.posology,
        strength: null, // TODO: récupérer du catalog si catalogId existe
        times: med.times.filter(t => t !== ""),
        initial_stock: formData.stocks[index] || 0,
        current_stock: formData.stocks[index] || 0,
        min_threshold: med.minThreshold,
      }));

      const { error: medError } = await supabase
        .from("medications")
        .insert(medicationsToInsert);

      if (medError) throw medError;

      // Create pharmacy visits
      if (formData.firstPharmacyVisit && formData.pharmacyId && formData.durationDays) {
        const visits = [];
        const firstVisitDate = new Date(formData.firstPharmacyVisit);
        const numberOfVisits = Math.floor(parseInt(formData.durationDays) / 30);
        
        for (let i = 0; i < numberOfVisits; i++) {
          visits.push({
            treatment_id: treatment.id,
            pharmacy_id: formData.pharmacyId,
            visit_date: format(addMonths(firstVisitDate, i), "yyyy-MM-dd"),
            visit_number: i + 1,
            is_completed: false,
          });
        }

        if (visits.length > 0) {
          const { error: visitsError } = await supabase
            .from("pharmacy_visits")
            .insert(visits);

          if (visitsError) throw visitsError;
        }
      }

      toast({
        title: "Traitement créé",
        description: "Le traitement a été créé avec succès.",
      });
      navigate("/");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le traitement.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Info
            formData={formData}
            setFormData={setFormData}
            prescriptions={prescriptions}
            doctors={doctors}
            pharmacies={pharmacies}
          />
        );
      case 2:
        return (
          <Step2Medications
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 3:
        return (
          <Step3Stocks
            formData={formData}
            setFormData={setFormData}
          />
        );
      case 4:
        return (
          <Step4Summary
            formData={formData}
            prescriptions={prescriptions}
            pharmacies={pharmacies}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <WizardProgress 
        currentStep={currentStep} 
        totalSteps={TOTAL_STEPS}
        onStepClick={setCurrentStep}
      />

      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      <div className="flex gap-3 sticky bottom-0 bg-background pt-4 pb-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1 || loading}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Précédent
        </Button>
        
        {currentStep < TOTAL_STEPS ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="flex-1 gradient-primary"
          >
            Suivant
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 gradient-primary"
          >
            {loading ? "Enregistrement..." : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Créer le traitement
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
