export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      allergies: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_approved: boolean | null
          name: string
          severity: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_approved?: boolean | null
          name: string
          severity: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_approved?: boolean | null
          name?: string
          severity?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      health_professionals: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          is_primary_doctor: boolean | null
          name: string
          phone: string | null
          postal_code: string | null
          specialty: string | null
          street_address: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary_doctor?: boolean | null
          name: string
          phone?: string | null
          postal_code?: string | null
          specialty?: string | null
          street_address?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary_doctor?: boolean | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          specialty?: string | null
          street_address?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_professionals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_catalog: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string
          default_posology: string | null
          default_times: string[] | null
          description: string | null
          form: string | null
          id: string
          initial_stock: number | null
          is_approved: boolean | null
          min_threshold: number | null
          name: string
          pathology: string | null
          pathology_id: string | null
          strength: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string
          default_posology?: string | null
          default_times?: string[] | null
          description?: string | null
          form?: string | null
          id?: string
          initial_stock?: number | null
          is_approved?: boolean | null
          min_threshold?: number | null
          name: string
          pathology?: string | null
          pathology_id?: string | null
          strength?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string
          default_posology?: string | null
          default_times?: string[] | null
          description?: string | null
          form?: string | null
          id?: string
          initial_stock?: number | null
          is_approved?: boolean | null
          min_threshold?: number | null
          name?: string
          pathology?: string | null
          pathology_id?: string | null
          strength?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_catalog_pathology_id_fkey"
            columns: ["pathology_id"]
            isOneToOne: false
            referencedRelation: "pathologies"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_intakes: {
        Row: {
          created_at: string | null
          id: string
          medication_id: string
          notes: string | null
          scheduled_time: string
          status: string
          taken_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          medication_id: string
          notes?: string | null
          scheduled_time: string
          status?: string
          taken_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          medication_id?: string
          notes?: string | null
          scheduled_time?: string
          status?: string
          taken_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_intakes_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          catalog_id: string | null
          created_at: string | null
          current_stock: number | null
          expiry_date: string | null
          id: string
          initial_stock: number | null
          is_paused: boolean | null
          min_threshold: number | null
          name: string
          posology: string
          strength: string | null
          times: string[]
          treatment_id: string
          updated_at: string | null
        }
        Insert: {
          catalog_id?: string | null
          created_at?: string | null
          current_stock?: number | null
          expiry_date?: string | null
          id?: string
          initial_stock?: number | null
          is_paused?: boolean | null
          min_threshold?: number | null
          name: string
          posology: string
          strength?: string | null
          times: string[]
          treatment_id: string
          updated_at?: string | null
        }
        Update: {
          catalog_id?: string | null
          created_at?: string | null
          current_stock?: number | null
          expiry_date?: string | null
          id?: string
          initial_stock?: number | null
          is_paused?: boolean | null
          min_threshold?: number | null
          name?: string
          posology?: string
          strength?: string | null
          times?: string[]
          treatment_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medications_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "medication_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "medication_intakes_details"
            referencedColumns: ["treatment_id"]
          },
          {
            foreignKeyName: "medications_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_items: {
        Row: {
          created_at: string | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          path: string
          position: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
          path: string
          position: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          path?: string
          position?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      pathologies: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_approved: boolean | null
          name: string
          severity: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_approved?: boolean | null
          name: string
          severity?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_approved?: boolean | null
          name?: string
          severity?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pharmacy_visits: {
        Row: {
          actual_visit_date: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          notes: string | null
          pharmacy_id: string | null
          treatment_id: string
          updated_at: string | null
          visit_date: string
          visit_number: number
        }
        Insert: {
          actual_visit_date?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          pharmacy_id?: string | null
          treatment_id: string
          updated_at?: string | null
          visit_date: string
          visit_number: number
        }
        Update: {
          actual_visit_date?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          pharmacy_id?: string | null
          treatment_id?: string
          updated_at?: string | null
          visit_date?: string
          visit_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_visits_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "health_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_visits_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "medication_intakes_details"
            referencedColumns: ["treatment_id"]
          },
          {
            foreignKeyName: "pharmacy_visits_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string | null
          document_url: string | null
          duration_days: number
          file_path: string | null
          id: string
          notes: string | null
          original_filename: string | null
          prescribing_doctor_id: string | null
          prescription_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_url?: string | null
          duration_days?: number
          file_path?: string | null
          id?: string
          notes?: string | null
          original_filename?: string | null
          prescribing_doctor_id?: string | null
          prescription_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_url?: string | null
          duration_days?: number
          file_path?: string | null
          id?: string
          notes?: string | null
          original_filename?: string | null
          prescribing_doctor_id?: string | null
          prescription_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_prescribing_doctor_id_fkey"
            columns: ["prescribing_doctor_id"]
            isOneToOne: false
            referencedRelation: "health_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          blood_type: string | null
          created_at: string | null
          date_of_birth: string | null
          first_name: string | null
          full_name: string | null
          height: number | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          avatar_url?: string | null
          blood_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          first_name?: string | null
          full_name?: string | null
          height?: number | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          avatar_url?: string | null
          blood_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          first_name?: string | null
          full_name?: string | null
          height?: number | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      treatments: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          pathology: string | null
          pharmacy_id: string | null
          prescription_id: string
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          pathology?: string | null
          pharmacy_id?: string | null
          prescription_id: string
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          pathology?: string | null
          pharmacy_id?: string | null
          prescription_id?: string
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "health_professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          biometric_enabled: boolean | null
          created_at: string | null
          export_config: Json | null
          id: string
          inactivity_timeout_minutes: number | null
          require_auth_on_open: boolean | null
          settings_section_order: Json | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          biometric_enabled?: boolean | null
          created_at?: string | null
          export_config?: Json | null
          id?: string
          inactivity_timeout_minutes?: number | null
          require_auth_on_open?: boolean | null
          settings_section_order?: Json | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          biometric_enabled?: boolean | null
          created_at?: string | null
          export_config?: Json | null
          id?: string
          inactivity_timeout_minutes?: number | null
          require_auth_on_open?: boolean | null
          settings_section_order?: Json | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      medication_intakes_details: {
        Row: {
          created_at: string | null
          id: string | null
          medication_id: string | null
          medication_is_paused: boolean | null
          medication_name: string | null
          medication_strength: string | null
          notes: string | null
          pathology: string | null
          posology: string | null
          scheduled_time: string | null
          status: string | null
          taken_at: string | null
          treatment_id: string | null
          treatment_is_active: boolean | null
          treatment_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_intakes_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auto_archive_expired_treatments: { Args: never; Returns: number }
      delete_future_intakes_on_pause: {
        Args: { med_id: string }
        Returns: number
      }
      generate_future_intakes:
        | { Args: never; Returns: undefined }
        | {
            Args: { days_ahead: number }
            Returns: {
              details: string
              total_generated: number
            }[]
          }
        | {
            Args: { p_days: number; p_medication_id: string }
            Returns: undefined
          }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      regenerate_future_intakes: {
        Args: { med_id: string }
        Returns: undefined
      }
      sync_google_avatar_to_profile: {
        Args: { user_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "moderator"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "moderator"],
    },
  },
} as const
