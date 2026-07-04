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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievement_claims: {
        Row: {
          achievement_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_notes: string | null
          evidence_files: string[]
          evidence_text: string
          evidence_url: string | null
          id: string
          month_bucket: string | null
          notes: string
          staff_id: string
          status: Database["public"]["Enums"]["claim_status"]
          submitted_by: string
          updated_at: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          evidence_files?: string[]
          evidence_text?: string
          evidence_url?: string | null
          id?: string
          month_bucket?: string | null
          notes?: string
          staff_id: string
          status?: Database["public"]["Enums"]["claim_status"]
          submitted_by: string
          updated_at?: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_notes?: string | null
          evidence_files?: string[]
          evidence_text?: string
          evidence_url?: string | null
          id?: string
          month_bucket?: string | null
          notes?: string
          staff_id?: string
          status?: Database["public"]["Enums"]["claim_status"]
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_claims_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_claims_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_records: {
        Row: {
          achievement_id: string
          awarded_at: string
          claim_id: string | null
          id: string
          period: string
          staff_id: string
          stars: number
        }
        Insert: {
          achievement_id: string
          awarded_at?: string
          claim_id?: string | null
          id?: string
          period: string
          staff_id: string
          stars?: number
        }
        Update: {
          achievement_id?: string
          awarded_at?: string
          claim_id?: string | null
          id?: string
          period?: string
          staff_id?: string
          stars?: number
        }
        Relationships: [
          {
            foreignKeyName: "achievement_records_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_records_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "achievement_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          created_at: string
          description: string
          difficulty: string
          id: string
          name: string
          requirement: string
          reset_cycle: string
          seasonal: boolean
          star_reward: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          difficulty?: string
          id?: string
          name: string
          requirement?: string
          reset_cycle?: string
          seasonal?: boolean
          star_reward?: number
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: string
          id?: string
          name?: string
          requirement?: string
          reset_cycle?: string
          seasonal?: boolean
          star_reward?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_sales_claims: {
        Row: {
          created_at: string
          decision_notes: string
          evidence_files: string[]
          id: string
          remarks: string
          reviewed_at: string | null
          reviewed_by: string | null
          sales_date: string
          staff_id: string
          status: string
          submitted_by: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          decision_notes?: string
          evidence_files?: string[]
          id?: string
          remarks?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sales_date?: string
          staff_id: string
          status?: string
          submitted_by: string
          total_amount: number
        }
        Update: {
          created_at?: string
          decision_notes?: string
          evidence_files?: string[]
          id?: string
          remarks?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sales_date?: string
          staff_id?: string
          status?: string
          submitted_by?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_sales_claims_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_rules: {
        Row: {
          bonus_pct: number
          grade: string
          min_score: number
          note: string
          updated_at: string
        }
        Insert: {
          bonus_pct?: number
          grade: string
          min_score?: number
          note?: string
          updated_at?: string
        }
        Update: {
          bonus_pct?: number
          grade?: string
          min_score?: number
          note?: string
          updated_at?: string
        }
        Relationships: []
      }
      grade_weights: {
        Row: {
          achievements_w: number
          attendance_w: number
          discipline_w: number
          id: number
          kpi_w: number
          review_w: number
          review_weight: number
          sales_w: number
          sales_weight: number
          updated_at: string
        }
        Insert: {
          achievements_w?: number
          attendance_w?: number
          discipline_w?: number
          id?: number
          kpi_w?: number
          review_w?: number
          review_weight?: number
          sales_w?: number
          sales_weight?: number
          updated_at?: string
        }
        Update: {
          achievements_w?: number
          attendance_w?: number
          discipline_w?: number
          id?: number
          kpi_w?: number
          review_w?: number
          review_weight?: number
          sales_w?: number
          sales_weight?: number
          updated_at?: string
        }
        Relationships: []
      }
      legacy_config: {
        Row: {
          id: number
          moons_per_sun: number
          stars_per_moon: number
          updated_at: string
        }
        Insert: {
          id?: number
          moons_per_sun?: number
          stars_per_moon?: number
          updated_at?: string
        }
        Update: {
          id?: number
          moons_per_sun?: number
          stars_per_moon?: number
          updated_at?: string
        }
        Relationships: []
      }
      legacy_holdings: {
        Row: {
          created_at: string
          ended_at: string | null
          granted_at: string | null
          id: string
          location_id: string | null
          note: string
          staff_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          granted_at?: string | null
          id?: string
          location_id?: string | null
          note?: string
          staff_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          granted_at?: string | null
          id?: string
          location_id?: string | null
          note?: string
          staff_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_holdings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_holdings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_titles: {
        Row: {
          flavor: string
          id: string
          min_stars: number
          name: string
          position: number
        }
        Insert: {
          flavor?: string
          id?: string
          min_stars?: number
          name: string
          position?: number
        }
        Update: {
          flavor?: string
          id?: string
          min_stars?: number
          name?: string
          position?: number
        }
        Relationships: []
      }
      locations: {
        Row: {
          code: string | null
          created_at: string
          id: string
          kind: string
          manager_id: string | null
          name: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          kind?: string
          manager_id?: string | null
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          kind?: string
          manager_id?: string | null
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_evaluations: {
        Row: {
          achievements_score: number
          attendance_score: number
          composite_score: number
          created_at: string
          discipline_score: number
          evaluator_id: string | null
          grade: string
          id: string
          kpi_score: number
          month: string
          notes: string
          review_score: number
          sales_score: number
          staff_id: string
          updated_at: string
        }
        Insert: {
          achievements_score?: number
          attendance_score?: number
          composite_score?: number
          created_at?: string
          discipline_score?: number
          evaluator_id?: string | null
          grade: string
          id?: string
          kpi_score?: number
          month: string
          notes?: string
          review_score?: number
          sales_score?: number
          staff_id: string
          updated_at?: string
        }
        Update: {
          achievements_score?: number
          attendance_score?: number
          composite_score?: number
          created_at?: string
          discipline_score?: number
          evaluator_id?: string | null
          grade?: string
          id?: string
          kpi_score?: number
          month?: string
          notes?: string
          review_score?: number
          sales_score?: number
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_evaluations_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ranks: {
        Row: {
          description: string
          key: string
          locked: boolean
          min_a_grades: number
          min_achievements: number
          min_b_grades: number
          min_total_stars: number
          name: string
          position: number
          requirement: string
          subtitle: string
          updated_at: string
        }
        Insert: {
          description?: string
          key: string
          locked?: boolean
          min_a_grades?: number
          min_achievements?: number
          min_b_grades?: number
          min_total_stars?: number
          name: string
          position: number
          requirement?: string
          subtitle?: string
          updated_at?: string
        }
        Update: {
          description?: string
          key?: string
          locked?: boolean
          min_a_grades?: number
          min_achievements?: number
          min_b_grades?: number
          min_total_stars?: number
          name?: string
          position?: number
          requirement?: string
          subtitle?: string
          updated_at?: string
        }
        Relationships: []
      }
      rpg_identity: {
        Row: {
          career_tree: string | null
          class: string
          created_at: string
          current_rank_key: string | null
          primary_class: string | null
          primary_role: string | null
          secondary_class: string | null
          secondary_role: string | null
          secondary_unlocked: boolean
          shipbuilder_tree: string | null
          staff_id: string
          updated_at: string
        }
        Insert: {
          career_tree?: string | null
          class?: string
          created_at?: string
          current_rank_key?: string | null
          primary_class?: string | null
          primary_role?: string | null
          secondary_class?: string | null
          secondary_role?: string | null
          secondary_unlocked?: boolean
          shipbuilder_tree?: string | null
          staff_id: string
          updated_at?: string
        }
        Update: {
          career_tree?: string | null
          class?: string
          created_at?: string
          current_rank_key?: string | null
          primary_class?: string | null
          primary_role?: string | null
          secondary_class?: string | null
          secondary_role?: string | null
          secondary_unlocked?: boolean
          shipbuilder_tree?: string | null
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rpg_identity_current_rank_key_fkey"
            columns: ["current_rank_key"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "rpg_identity_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          branch: string | null
          business_unit: string
          career_path: string | null
          created_at: string
          current_rank_key: string | null
          email: string | null
          employee_code: string | null
          guild_id: string | null
          id: string
          join_date: string
          location_id: string | null
          manager_id: string | null
          name: string
          phone: string | null
          promotion_date: string | null
          promotion_history: Json
          role: string
          role_family: string
          shipbuilder_path: string | null
          status: string
          system_role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          branch?: string | null
          business_unit?: string
          career_path?: string | null
          created_at?: string
          current_rank_key?: string | null
          email?: string | null
          employee_code?: string | null
          guild_id?: string | null
          id?: string
          join_date?: string
          location_id?: string | null
          manager_id?: string | null
          name: string
          phone?: string | null
          promotion_date?: string | null
          promotion_history?: Json
          role?: string
          role_family?: string
          shipbuilder_path?: string | null
          status?: string
          system_role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          branch?: string | null
          business_unit?: string
          career_path?: string | null
          created_at?: string
          current_rank_key?: string | null
          email?: string | null
          employee_code?: string | null
          guild_id?: string | null
          id?: string
          join_date?: string
          location_id?: string | null
          manager_id?: string | null
          name?: string
          phone?: string | null
          promotion_date?: string | null
          promotion_history?: Json
          role?: string
          role_family?: string
          shipbuilder_path?: string | null
          status?: string
          system_role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_current_rank_key_fkey"
            columns: ["current_rank_key"]
            isOneToOne: false
            referencedRelation: "ranks"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "staff_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_identity: {
        Row: {
          created_at: string
          department: string
          employment_status: string
          location_id: string | null
          manager_id: string | null
          position: string
          staff_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string
          employment_status?: string
          location_id?: string | null
          manager_id?: string | null
          position?: string
          staff_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string
          employment_status?: string
          location_id?: string | null
          manager_id?: string | null
          position?: string
          staff_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_identity_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_identity_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_identity_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_role_label: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      evaluate_rank: {
        Args: { _staff_id: string }
        Returns: {
          a_grades: number
          b_grades: number
          current_rank_key: string
          current_rank_name: string
          eligible: boolean
          next_min_a_grades: number
          next_min_achievements: number
          next_min_b_grades: number
          next_min_total_stars: number
          next_rank_key: string
          next_rank_name: string
          total_stars: number
          unique_achievements: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_director_bootstrap_email: {
        Args: { _email: string }
        Returns: boolean
      }
      refresh_staff_rank: { Args: { _staff_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "director" | "manager" | "staff"
      claim_status: "pending" | "approved" | "rejected"
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
      app_role: ["director", "manager", "staff"],
      claim_status: ["pending", "approved", "rejected"],
    },
  },
} as const
