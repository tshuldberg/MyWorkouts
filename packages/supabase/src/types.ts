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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          audio_cues: Json
          category: Database["public"]["Enums"]["category"]
          created_at: string
          description: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          id: string
          is_premium: boolean
          muscle_groups: string[]
          name: string
          thumbnail_url: string | null
          video_url: string | null
        }
        Insert: {
          audio_cues?: Json
          category: Database["public"]["Enums"]["category"]
          created_at?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          id?: string
          is_premium?: boolean
          muscle_groups?: string[]
          name: string
          thumbnail_url?: string | null
          video_url?: string | null
        }
        Update: {
          audio_cues?: Json
          category?: Database["public"]["Enums"]["category"]
          created_at?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          id?: string
          is_premium?: boolean
          muscle_groups?: string[]
          name?: string
          thumbnail_url?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      form_recordings: {
        Row: {
          coach_feedback: Json
          created_at: string
          exercise_id: string
          id: string
          session_id: string
          timestamp_end: number
          timestamp_start: number
          video_url: string
        }
        Insert: {
          coach_feedback?: Json
          created_at?: string
          exercise_id: string
          id?: string
          session_id: string
          timestamp_end: number
          timestamp_start: number
          video_url: string
        }
        Update: {
          coach_feedback?: Json
          created_at?: string
          exercise_id?: string
          id?: string
          session_id?: string
          timestamp_end?: number
          timestamp_start?: number
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_recordings_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_subscriptions: {
        Row: {
          id: string
          plan_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          id?: string
          plan_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          id?: string
          plan_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          expires_at: string
          external_id: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          provider: Database["public"]["Enums"]["subscription_provider"]
          status: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Insert: {
          expires_at: string
          external_id: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          provider: Database["public"]["Enums"]["subscription_provider"]
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Update: {
          expires_at?: string
          external_id?: string
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          provider?: Database["public"]["Enums"]["subscription_provider"]
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          coach_id: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          subscription_tier: Database["public"]["Enums"]["subscription_plan"]
        }
        Insert: {
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          subscription_tier?: Database["public"]["Enums"]["subscription_plan"]
        }
        Update: {
          avatar_url?: string | null
          coach_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          subscription_tier?: Database["public"]["Enums"]["subscription_plan"]
        }
        Relationships: [
          {
            foreignKeyName: "users_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          is_premium: boolean
          title: string
          weeks: Json
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          is_premium?: boolean
          title: string
          weeks?: Json
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          is_premium?: boolean
          title?: string
          weeks?: Json
        }
        Relationships: [
          {
            foreignKeyName: "workout_plans_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          exercises_completed: Json
          id: string
          pace_adjustments: Json
          started_at: string
          user_id: string
          voice_commands_used: Json
          workout_id: string
        }
        Insert: {
          completed_at?: string | null
          exercises_completed?: Json
          id?: string
          pace_adjustments?: Json
          started_at?: string
          user_id: string
          voice_commands_used?: Json
          workout_id: string
        }
        Update: {
          completed_at?: string | null
          exercises_completed?: Json
          id?: string
          pace_adjustments?: Json
          started_at?: string
          user_id?: string
          voice_commands_used?: Json
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          creator_id: string
          description: string
          difficulty: Database["public"]["Enums"]["difficulty"]
          estimated_duration: number
          exercises: Json
          id: string
          is_premium: boolean
          title: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          estimated_duration?: number
          exercises?: Json
          id?: string
          is_premium?: boolean
          title: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty"]
          estimated_duration?: number
          exercises?: Json
          id?: string
          is_premium?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      category:
        | "cardio"
        | "strength"
        | "mobility"
        | "fascia"
        | "recovery"
        | "flexibility"
        | "balance"
      difficulty: "beginner" | "intermediate" | "advanced"
      subscription_plan: "free" | "premium"
      subscription_provider: "revenuecat" | "stripe"
      subscription_status: "active" | "canceled" | "expired" | "trialing"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      category: [
        "cardio",
        "strength",
        "mobility",
        "fascia",
        "recovery",
        "flexibility",
        "balance",
      ],
      difficulty: ["beginner", "intermediate", "advanced"],
      subscription_plan: ["free", "premium"],
      subscription_provider: ["revenuecat", "stripe"],
      subscription_status: ["active", "canceled", "expired", "trialing"],
    },
  },
} as const
