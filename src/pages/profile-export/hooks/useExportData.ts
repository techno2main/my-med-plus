import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedUser } from "@/lib/auth-guard";
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
      const { data: user, error } = await getAuthenticatedUser();
      if (error || !user) {
        console.warn('[useExportData] Utilisateur non authentifié:', error?.message);
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour exporter vos données.",
          variant: "destructive"
        });
        setLoading(false);
        return null;
      }

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
    // Récupérer tous les traitements avec leurs ordonnances
    let query = supabase
      .from('treatments')
      .select(`
        *,
        prescriptions (
          id,
          prescription_date,
          duration_days,
          health_professionals (
            name
          )
        ),
        medications (
          id,
          name,
          strength,
          posology,
          current_stock,
          min_threshold
        )
      `)
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching treatments:', error);
      throw error;
    }

    let treatments = data || [];

    // Filtrer les traitements selon la période si spécifiée
    if (config.startDate || config.endDate) {
      treatments = treatments.filter(t => {
        const startDate = new Date(t.start_date);
        const endDate = t.end_date ? new Date(t.end_date) : null;
        const periodStart = config.startDate ? new Date(config.startDate) : null;
        const periodEnd = config.endDate ? new Date(config.endDate) : null;

        const startsBeforePeriodEnd = !periodEnd || startDate <= periodEnd;
        const endsAfterPeriodStart = !periodStart || !endDate || endDate >= periodStart;

        return startsBeforePeriodEnd && endsAfterPeriodStart;
      });
    }

    // Récupérer les horaires et prises pour chaque médicament
    const treatmentsWithDetails = await Promise.all(
      treatments.map(async (t) => {
        const medications = await Promise.all(
          (t.medications || []).map(async (m: any) => {
            // Récupérer les horaires uniques des prises planifiées
            const { data: intakes } = await supabase
              .from('medication_intakes')
              .select('scheduled_time')
              .eq('medication_id', m.id)
              .order('scheduled_time', { ascending: true })
              .limit(20);

            const times: string[] = [];
            if (intakes && intakes.length > 0) {
              const uniqueTimes = new Set<string>();
              intakes.forEach(intake => {
                const time = intake.scheduled_time.split('T')[1]?.split(':').slice(0, 2).join(':');
                if (time) uniqueTimes.add(time);
              });
              times.push(...Array.from(uniqueTimes).sort());
            }

            return {
              name: m.name,
              dosage: `${m.strength} - ${m.posology}`,
              times: times,
              currentStock: m.current_stock,
              minThreshold: m.min_threshold,
            };
          })
        );

        // Récupérer l'historique des prises pour ce traitement dans la période
        let intakeHistory: IntakeHistoryData[] = [];
        if (config.includeIntakeHistory) {
          const medicationIds = (t.medications || []).map((m: any) => m.id);
          
          if (medicationIds.length > 0) {
            let intakeQuery = supabase
              .from('medication_intakes')
              .select(`
                *,
                medications!inner (
                  name
                )
              `)
              .in('medication_id', medicationIds)
              .order('scheduled_time', { ascending: false });

            if (config.startDate) {
              intakeQuery = intakeQuery.gte('scheduled_time', config.startDate);
            }
            if (config.endDate) {
              intakeQuery = intakeQuery.lte('scheduled_time', config.endDate);
            }

            const { data: intakesData } = await intakeQuery;

            intakeHistory = (intakesData || []).map(i => ({
              date: format(new Date(i.scheduled_time), 'dd/MM/yyyy'),
              medicationName: i.medications.name,
              scheduledTime: format(new Date(i.scheduled_time), 'HH:mm'),
              takenAt: i.taken_at ? format(new Date(i.taken_at), 'HH:mm') : undefined,
              status: i.status,
              treatmentName: t.name,
            }));
          }
        }

        return {
          id: t.id,
          name: t.name,
          description: t.description,
          pathology: t.pathology,
          startDate: t.start_date,
          endDate: t.end_date,
          isActive: t.is_active,
          medications: medications,
          prescriptionInfo: t.prescriptions ? {
            prescriptionDate: t.prescriptions.prescription_date,
            doctorName: t.prescriptions.health_professionals?.name,
            durationDays: t.prescriptions.duration_days,
          } : undefined,
          intakes: intakeHistory,
        };
      })
    );

    return treatmentsWithDetails;
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
