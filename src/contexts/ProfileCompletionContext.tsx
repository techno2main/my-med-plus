import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
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

const defaultState: ProfileCompletionState = {
  isLoading: true,
  completionPercent: 100,
  missingFieldsCount: 0,
  filledFieldsCount: 6,
  totalFields: 6,
  isComplete: true,
  profile: null,
  missingFields: [],
  firstMissingField: null,
  refetch: async () => {},
};

const ProfileCompletionContext = createContext<ProfileCompletionState>(defaultState);

export const ProfileCompletionProvider = ({ children }: { children: ReactNode }) => {
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

  const stillLoading = authLoading || isLoading || !hasFetched;

  const value: ProfileCompletionState = {
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

  return (
    <ProfileCompletionContext.Provider value={value}>
      {children}
    </ProfileCompletionContext.Provider>
  );
};

export const useProfileCompletion = (): ProfileCompletionState => {
  const context = useContext(ProfileCompletionContext);
  if (!context) {
    throw new Error("useProfileCompletion must be used within a ProfileCompletionProvider");
  }
  return context;
};
