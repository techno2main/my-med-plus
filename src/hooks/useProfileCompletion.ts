import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  blood_type: string | null;
  height: number | null;
  weight: number | null;
}

const PROFILE_FIELDS = ['first_name', 'last_name', 'date_of_birth', 'blood_type', 'height', 'weight'] as const;

export type ProfileFieldName = typeof PROFILE_FIELDS[number];

export interface ProfileCompletionState {
  isLoading: boolean;
  completionPercent: number;
  missingFieldsCount: number;
  filledFieldsCount: number;
  totalFields: number;
  isComplete: boolean;
  profile: ProfileData | null;
  missingFields: ProfileFieldName[];
  firstMissingField: ProfileFieldName | null;
  refetch: () => Promise<void>;
}

export const useProfileCompletion = (): ProfileCompletionState => {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setHasFetched(true);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, date_of_birth, blood_type, height, weight")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile completion:", error);
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [user]);

  useEffect(() => {
    // Ne pas fetch tant que l'auth n'est pas terminé
    if (authLoading) return;
    fetchProfile();
  }, [fetchProfile, authLoading]);

  const calculateCompletion = (data: ProfileData | null) => {
    if (!data) return { filled: 0, total: PROFILE_FIELDS.length, missing: [...PROFILE_FIELDS] };

    const missing: ProfileFieldName[] = [];
    const filledFields = PROFILE_FIELDS.filter((field) => {
      const value = data[field];
      const isFilled = value !== null && value !== "" && value !== undefined;
      if (!isFilled) {
        missing.push(field);
      }
      return isFilled;
    }).length;

    return { filled: filledFields, total: PROFILE_FIELDS.length, missing };
  };

  const { filled, total, missing } = calculateCompletion(profile);
  const completionPercent = Math.round((filled / total) * 100);
  const missingFieldsCount = total - filled;

  // Considérer comme "en chargement" tant qu'on n'a pas fait le premier fetch
  const stillLoading = authLoading || isLoading || !hasFetched;

  return {
    isLoading: stillLoading,
    completionPercent: stillLoading ? 100 : completionPercent,
    missingFieldsCount: stillLoading ? 0 : missingFieldsCount,
    filledFieldsCount: stillLoading ? total : filled,
    totalFields: total,
    isComplete: stillLoading ? true : completionPercent === 100,
    profile,
    missingFields: stillLoading ? [] : missing,
    firstMissingField: stillLoading ? null : (missing[0] || null),
    refetch: fetchProfile,
  };
};
