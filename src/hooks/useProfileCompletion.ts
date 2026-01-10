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

export interface ProfileCompletionState {
  isLoading: boolean;
  completionPercent: number;
  missingFieldsCount: number;
  filledFieldsCount: number;
  totalFields: number;
  isComplete: boolean;
  profile: ProfileData | null;
  refetch: () => Promise<void>;
}

export const useProfileCompletion = (): ProfileCompletionState => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
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
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const calculateCompletion = (data: ProfileData | null) => {
    if (!data) return { filled: 0, total: PROFILE_FIELDS.length };

    const filledFields = PROFILE_FIELDS.filter((field) => {
      const value = data[field];
      return value !== null && value !== "" && value !== undefined;
    }).length;

    return { filled: filledFields, total: PROFILE_FIELDS.length };
  };

  const { filled, total } = calculateCompletion(profile);
  const completionPercent = Math.round((filled / total) * 100);
  const missingFieldsCount = total - filled;

  return {
    isLoading,
    completionPercent,
    missingFieldsCount,
    filledFieldsCount: filled,
    totalFields: total,
    isComplete: completionPercent === 100,
    profile,
    refetch: fetchProfile,
  };
};
