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
      coach_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          problem_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          problem_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          problem_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_conversations_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      kill_switch_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["task_status"] | null
          previous_status: Database["public"]["Enums"]["task_status"] | null
          reason: string
          task_id: string
          triggered_by: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["task_status"] | null
          previous_status?: Database["public"]["Enums"]["task_status"] | null
          reason: string
          task_id: string
          triggered_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["task_status"] | null
          previous_status?: Database["public"]["Enums"]["task_status"] | null
          reason?: string
          task_id?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kill_switch_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          created_at: string | null
          current_value: number | null
          id: string
          name: string
          problem_id: string
          target_value: number
          threshold_value: number | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          id?: string
          name: string
          problem_id: string
          target_value: number
          threshold_value?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          id?: string
          name?: string
          problem_id?: string
          target_value?: number
          threshold_value?: number | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpis_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      problems: {
        Row: {
          assumptions: string[] | null
          constraints: string[] | null
          context_constraints: string | null
          created_at: string | null
          current_attempts: string | null
          desired_outcome: string
          id: string
          impact_score: number | null
          priority_score: number | null
          problem_statement: string
          root_causes: Json | null
          stakeholders: string[] | null
          status: Database["public"]["Enums"]["problem_status"] | null
          symptoms: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assumptions?: string[] | null
          constraints?: string[] | null
          context_constraints?: string | null
          created_at?: string | null
          current_attempts?: string | null
          desired_outcome: string
          id?: string
          impact_score?: number | null
          priority_score?: number | null
          problem_statement: string
          root_causes?: Json | null
          stakeholders?: string[] | null
          status?: Database["public"]["Enums"]["problem_status"] | null
          symptoms?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assumptions?: string[] | null
          constraints?: string[] | null
          context_constraints?: string | null
          created_at?: string | null
          current_attempts?: string | null
          desired_outcome?: string
          id?: string
          impact_score?: number | null
          priority_score?: number | null
          problem_statement?: string
          root_causes?: Json | null
          stakeholders?: string[] | null
          status?: Database["public"]["Enums"]["problem_status"] | null
          symptoms?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      solutions: {
        Row: {
          cost_score: number | null
          created_at: string | null
          description: string
          effectiveness_score: number | null
          eliminated: boolean | null
          elimination_reason: string | null
          id: string
          is_selected: boolean | null
          leverage_score: number | null
          problem_id: string
          reversibility_score: number | null
          risk_score: number | null
          second_order_effects: string[] | null
          speed_score: number | null
          title: string
          total_score: number | null
        }
        Insert: {
          cost_score?: number | null
          created_at?: string | null
          description: string
          effectiveness_score?: number | null
          eliminated?: boolean | null
          elimination_reason?: string | null
          id?: string
          is_selected?: boolean | null
          leverage_score?: number | null
          problem_id: string
          reversibility_score?: number | null
          risk_score?: number | null
          second_order_effects?: string[] | null
          speed_score?: number | null
          title: string
          total_score?: number | null
        }
        Update: {
          cost_score?: number | null
          created_at?: string | null
          description?: string
          effectiveness_score?: number | null
          eliminated?: boolean | null
          elimination_reason?: string | null
          id?: string
          is_selected?: boolean | null
          leverage_score?: number | null
          problem_id?: string
          reversibility_score?: number | null
          risk_score?: number | null
          second_order_effects?: string[] | null
          speed_score?: number | null
          title?: string
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "solutions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string | null
          deadline: string | null
          dependencies: string[] | null
          description: string | null
          id: string
          kpi_current: number | null
          kpi_target: number | null
          kpi_threshold: number | null
          milestone: string | null
          order_index: number | null
          owner: string | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          solution_id: string
          status: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          dependencies?: string[] | null
          description?: string | null
          id?: string
          kpi_current?: number | null
          kpi_target?: number | null
          kpi_threshold?: number | null
          milestone?: string | null
          order_index?: number | null
          owner?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          solution_id: string
          status?: Database["public"]["Enums"]["task_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          dependencies?: string[] | null
          description?: string | null
          id?: string
          kpi_current?: number | null
          kpi_target?: number | null
          kpi_threshold?: number | null
          milestone?: string | null
          order_index?: number | null
          owner?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          solution_id?: string
          status?: Database["public"]["Enums"]["task_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_solution_id_fkey"
            columns: ["solution_id"]
            isOneToOne: false
            referencedRelation: "solutions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      problem_status:
        | "intake"
        | "solution"
        | "execution"
        | "monitoring"
        | "completed"
      risk_level: "low" | "medium" | "high" | "critical"
      root_cause_type:
        | "process"
        | "people"
        | "technology"
        | "external"
        | "resource"
      task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "blocked"
        | "paused"
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
      app_role: ["admin", "user"],
      problem_status: [
        "intake",
        "solution",
        "execution",
        "monitoring",
        "completed",
      ],
      risk_level: ["low", "medium", "high", "critical"],
      root_cause_type: [
        "process",
        "people",
        "technology",
        "external",
        "resource",
      ],
      task_status: ["pending", "in_progress", "completed", "blocked", "paused"],
    },
  },
} as const
