// Generated types placeholder — run `supabase gen types` to populate
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          subscription_tier: 'free' | 'premium';
          coach_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'premium';
          coach_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: 'free' | 'premium';
          coach_id?: string | null;
        };
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: 'cardio' | 'strength' | 'mobility' | 'fascia' | 'recovery' | 'flexibility' | 'balance';
          muscle_groups: string[];
          video_url: string | null;
          thumbnail_url: string | null;
          difficulty: 'beginner' | 'intermediate' | 'advanced';
          audio_cues: Record<string, unknown>[];
          is_premium: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          category: 'cardio' | 'strength' | 'mobility' | 'fascia' | 'recovery' | 'flexibility' | 'balance';
          muscle_groups: string[];
          video_url?: string | null;
          thumbnail_url?: string | null;
          difficulty: 'beginner' | 'intermediate' | 'advanced';
          audio_cues?: Record<string, unknown>[];
          is_premium?: boolean;
        };
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>;
      };
      workouts: {
        Row: {
          id: string;
          title: string;
          description: string;
          creator_id: string;
          difficulty: 'beginner' | 'intermediate' | 'advanced';
          exercises: Record<string, unknown>[];
          estimated_duration: number;
          is_premium: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          creator_id: string;
          difficulty: 'beginner' | 'intermediate' | 'advanced';
          exercises: Record<string, unknown>[];
          estimated_duration: number;
          is_premium?: boolean;
        };
        Update: Partial<Database['public']['Tables']['workouts']['Insert']>;
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          workout_id: string;
          started_at: string;
          completed_at: string | null;
          exercises_completed: Record<string, unknown>[];
          voice_commands_used: Record<string, unknown>[];
          pace_adjustments: Record<string, unknown>[];
        };
        Insert: {
          id?: string;
          user_id: string;
          workout_id: string;
          started_at?: string;
          completed_at?: string | null;
          exercises_completed?: Record<string, unknown>[];
          voice_commands_used?: Record<string, unknown>[];
          pace_adjustments?: Record<string, unknown>[];
        };
        Update: Partial<Database['public']['Tables']['workout_sessions']['Insert']>;
      };
      form_recordings: {
        Row: {
          id: string;
          session_id: string;
          video_url: string;
          exercise_id: string;
          timestamp_start: number;
          timestamp_end: number;
          coach_feedback: Record<string, unknown>[];
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          video_url: string;
          exercise_id: string;
          timestamp_start: number;
          timestamp_end: number;
          coach_feedback?: Record<string, unknown>[];
        };
        Update: Partial<Database['public']['Tables']['form_recordings']['Insert']>;
      };
      workout_plans: {
        Row: {
          id: string;
          title: string;
          coach_id: string;
          weeks: Record<string, unknown>[];
          is_premium: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          coach_id: string;
          weeks: Record<string, unknown>[];
          is_premium?: boolean;
        };
        Update: Partial<Database['public']['Tables']['workout_plans']['Insert']>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: 'free' | 'premium';
          provider: 'revenuecat' | 'stripe';
          external_id: string;
          status: 'active' | 'canceled' | 'expired' | 'trialing';
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: 'free' | 'premium';
          provider: 'revenuecat' | 'stripe';
          external_id: string;
          status: 'active' | 'canceled' | 'expired' | 'trialing';
          expires_at: string;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      category: 'cardio' | 'strength' | 'mobility' | 'fascia' | 'recovery' | 'flexibility' | 'balance';
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      subscription_plan: 'free' | 'premium';
      subscription_provider: 'revenuecat' | 'stripe';
      subscription_status: 'active' | 'canceled' | 'expired' | 'trialing';
    };
  };
}
