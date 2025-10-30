import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExportConfig, ExportData, ProfileData, AdherenceData, TreatmentData, PrescriptionData, IntakeHistoryData, StockData } from "../types";
import { useAdherenceStats } from "@/hooks/useAdherenceStats";
import { format } from "date-fns";

export const useExportData = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { stats } = useAdherenceStats();

  const fetchExportData = async (config: ExportConfig): Promise<ExportData | null> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const exportData: ExportData = {
        exportDate: new Date().toISOString(),
        period: {
          startDate: config.startDate,
          endDate: config.endDate,
        },
      };

      // Fetch profile
      if (config.includeProfile) {
        exportData.profile = await fetchProfile(user.id);
      }

      // Add adherence stats
      if (config.includeAdherence) {
        exportData.adherence = {
          takenOnTime: stats.takenOnTime,
          lateIntakes: stats.lateIntakes,
          skipped: stats.skipped,
          adherence7Days: stats.adherence7Days,
          adherence30Days: stats.adherence30Days,
          total7Days: stats.total7Days,
          total30Days: stats.total30Days,
        };
      }

      // Fetch treatments
      if (config.includeTreatments) {
        exportData.treatments = await fetchTreatments(user.id, config);
      }

      // Fetch prescriptions
      if (config.includePrescriptions) {
        exportData.prescriptions = await fetchPrescriptions(user.id, config);
      }

      // Fetch intake history
      if (config.includeIntakeHistory) {
        exportData.intakeHistory = await fetchIntakeHistory(user.id, config);
      }

      // Fetch stocks
      if (config.includeStocks) {
        exportData.stocks = await fetchStocks(user.id);
      }

      setLoading(false);
      return exportData;
    } catch (error: any) {
      console.error("Error fetching export data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les données pour l'export",
        variant: "destructive",
      });
      setLoading(false);
      return null;
    }
  };

  const fetchProfile = async (userId: string): Promise<ProfileData> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }

    return {
      firstName: data?.first_name || '',
      lastName: data?.last_name || '',
      dateOfBirth: data?.date_of_birth || '',
      bloodType: data?.blood_type,
      height: data?.height,
      weight: data?.weight,
      phone: data?.phone,
    };
  };

  const fetchTreatments = async (userId: string, config: ExportConfig): Promise<TreatmentData[]> => {
    let query = supabase
      .from('treatments')
      .select(`
        *,
        medications (
          name,
          strength,
          posology,
          current_stock,
          min_threshold
        )
      `)
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (config.startDate) {
      query = query.gte('start_date', config.startDate);
    }
    if (config.endDate) {
      query = query.lte('start_date', config.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching treatments:', error);
      throw error;
    }

    return (data || []).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      pathology: t.pathology,
      startDate: t.start_date,
      endDate: t.end_date,
      isActive: t.is_active,
      medications: (t.medications || []).map((m: any) => ({
        name: m.name,
        dosage: `${m.strength} - ${m.posology}`,
        times: [], // À remplir si nécessaire
        currentStock: m.current_stock,
        minThreshold: m.min_threshold,
      })),
      prescriptionInfo: undefined, // Simplifié pour éviter les erreurs de jointure
    }));
  };

  const fetchPrescriptions = async (userId: string, config: ExportConfig): Promise<PrescriptionData[]> => {
    let query = supabase
      .from('prescriptions')
      .select(`
        *,
        health_professionals (name)
      `)
      .eq('user_id', userId)
      .order('prescription_date', { ascending: false });

    if (config.startDate) {
      query = query.gte('prescription_date', config.startDate);
    }
    if (config.endDate) {
      query = query.lte('prescription_date', config.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching prescriptions:', error);
      throw error;
    }

    return (data || []).map(p => ({
      id: p.id,
      prescriptionDate: p.prescription_date,
      durationDays: p.duration_days,
      doctorName: p.health_professionals?.name,
      fileName: p.original_filename,
      treatments: [], // Simplifié
    }));
  };

  const fetchIntakeHistory = async (userId: string, config: ExportConfig): Promise<IntakeHistoryData[]> => {
    let query = supabase
      .from('medication_intakes')
      .select(`
        *,
        medications!inner (
          name,
          treatments!inner (
            user_id,
            name
          )
        )
      `)
      .eq('medications.treatments.user_id', userId)
      .order('scheduled_time', { ascending: false });

    if (config.startDate) {
      query = query.gte('scheduled_time', config.startDate);
    }
    if (config.endDate) {
      query = query.lte('scheduled_time', config.endDate);
    }

    const { data } = await query;

    return (data || []).map(i => ({
      date: format(new Date(i.scheduled_time), 'dd/MM/yyyy'),
      medicationName: i.medications.name,
      scheduledTime: format(new Date(i.scheduled_time), 'HH:mm'),
      takenAt: i.taken_at ? format(new Date(i.taken_at), 'HH:mm') : undefined,
      status: i.status,
      treatmentName: i.medications.treatments.name,
    }));
  };

  const fetchStocks = async (userId: string): Promise<StockData[]> => {
    const { data } = await supabase
      .from('medications')
      .select(`
        name,
        current_stock,
        min_threshold,
        treatments!inner (
          user_id,
          name,
          is_active
        )
      `)
      .eq('treatments.user_id', userId)
      .eq('treatments.is_active', true);

    return (data || []).map(m => {
      const stockPercentage = (m.current_stock / m.min_threshold) * 100;
      let status: 'ok' | 'low' | 'critical' = 'ok';
      if (stockPercentage <= 25) status = 'critical';
      else if (stockPercentage <= 50) status = 'low';

      return {
        medicationName: m.name,
        currentStock: m.current_stock,
        minThreshold: m.min_threshold,
        status,
        treatmentName: m.treatments.name,
      };
    });
  };

  return { fetchExportData, loading };
};
