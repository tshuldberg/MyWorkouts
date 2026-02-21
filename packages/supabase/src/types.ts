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
        Update: {
          id?: string;
          name?: string;
          description?: string;
          category?: 'cardio' | 'strength' | 'mobility' | 'fascia' | 'recovery' | 'flexibility' | 'balance';
          muscle_groups?: string[];
          video_url?: string | null;
          thumbnail_url?: string | null;
          difficulty?: 'beginner' | 'intermediate' | 'advanced';
          audio_cues?: Record<string, unknown>[];
          is_premium?: boolean;
        };
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
        Update: {
          id?: string;
          title?: string;
          description?: string;
          creator_id?: string;
          difficulty?: 'beginner' | 'intermediate' | 'advanced';
          exercises?: Record<string, unknown>[];
          estimated_duration?: number;
          is_premium?: boolean;
        };
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
        Update: {
          id?: string;
          user_id?: string;
          workout_id?: string;
          started_at?: string;
          completed_at?: string | null;
          exercises_completed?: Record<string, unknown>[];
          voice_commands_used?: Record<string, unknown>[];
          pace_adjustments?: Record<string, unknown>[];
        };
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
        Update: {
          id?: string;
          session_id?: string;
          video_url?: string;
          exercise_id?: string;
          timestamp_start?: number;
          timestamp_end?: number;
          coach_feedback?: Record<string, unknown>[];
        };
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
        Update: {
          id?: string;
          title?: string;
          coach_id?: string;
          weeks?: Record<string, unknown>[];
          is_premium?: boolean;
        };
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
        Update: {
          id?: string;
          user_id?: string;
          plan?: 'free' | 'premium';
          provider?: 'revenuecat' | 'stripe';
          external_id?: string;
          status?: 'active' | 'canceled' | 'expired' | 'trialing';
          expires_at?: string;
        };
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
