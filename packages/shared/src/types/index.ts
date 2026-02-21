// ── Enums ──

export enum Category {
  Cardio = 'cardio',
  Strength = 'strength',
  Mobility = 'mobility',
  Fascia = 'fascia',
  Recovery = 'recovery',
  Flexibility = 'flexibility',
  Balance = 'balance',
}

export enum MuscleGroup {
  Chest = 'chest',
  Back = 'back',
  Shoulders = 'shoulders',
  Biceps = 'biceps',
  Triceps = 'triceps',
  Forearms = 'forearms',
  Core = 'core',
  Quads = 'quads',
  Hamstrings = 'hamstrings',
  Glutes = 'glutes',
  Calves = 'calves',
  HipFlexors = 'hip_flexors',
  Neck = 'neck',
  FullBody = 'full_body',
}

export enum Difficulty {
  Beginner = 'beginner',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

export enum SubscriptionPlan {
  Free = 'free',
  Premium = 'premium',
}

export enum SubscriptionProvider {
  RevenueCat = 'revenuecat',
  Stripe = 'stripe',
}

export enum SubscriptionStatus {
  Active = 'active',
  Canceled = 'canceled',
  Expired = 'expired',
  Trialing = 'trialing',
}

// ── Core Types ──

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionPlan;
  coach_id: string | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  category: Category;
  muscle_groups: MuscleGroup[];
  video_url: string | null;
  thumbnail_url: string | null;
  difficulty: Difficulty;
  audio_cues: AudioCue[];
  is_premium: boolean;
  created_at: string;
}

export interface AudioCue {
  timestamp: number;
  text: string;
  type: 'instruction' | 'encouragement' | 'countdown';
}

export interface Workout {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  difficulty: Difficulty;
  exercises: WorkoutExercise[];
  estimated_duration: number;
  is_premium: boolean;
  created_at: string;
}

export interface WorkoutExercise {
  exercise_id: string;
  sets: number;
  reps: number | null;
  duration: number | null;
  rest_after: number;
  order: number;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_id: string;
  started_at: string;
  completed_at: string | null;
  exercises_completed: CompletedExercise[];
  voice_commands_used: VoiceCommandLog[];
  pace_adjustments: PaceAdjustment[];
}

export interface CompletedExercise {
  exercise_id: string;
  sets_completed: number;
  reps_completed: number | null;
  duration_actual: number | null;
  skipped: boolean;
}

export interface VoiceCommandLog {
  command: string;
  timestamp: number;
  recognized: boolean;
}

export interface PaceAdjustment {
  timestamp: number;
  speed: number;
  source: 'voice' | 'manual';
}

export interface FormRecording {
  id: string;
  session_id: string;
  video_url: string;
  exercise_id: string;
  timestamp_start: number;
  timestamp_end: number;
  coach_feedback: CoachFeedback[];
  created_at: string;
}

export interface CoachFeedback {
  timestamp: number;
  comment: string;
  coach_id: string;
  created_at: string;
}

export interface WorkoutPlan {
  id: string;
  title: string;
  coach_id: string;
  weeks: WorkoutPlanWeek[];
  is_premium: boolean;
  created_at: string;
}

export interface WorkoutPlanWeek {
  week_number: number;
  days: WorkoutPlanDay[];
}

export interface WorkoutPlanDay {
  day_number: number;
  workout_id: string | null;
  rest_day: boolean;
  notes: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  provider: SubscriptionProvider;
  external_id: string;
  status: SubscriptionStatus;
  expires_at: string;
}
