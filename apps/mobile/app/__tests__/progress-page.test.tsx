import { render, screen } from '@testing-library/react';
import ProgressScreen from '../(tabs)/progress';
import { Category, Difficulty, MuscleGroup, type Exercise, type WorkoutSession } from '@myworkouts/shared';
import { createSupabaseMock, setActiveSupabaseMock } from '@/test/mocks/supabase';

const exercise: Exercise = {
  id: 'exercise-1',
  name: 'Push Up',
  description: 'Chest movement',
  category: Category.Strength,
  muscle_groups: [MuscleGroup.Chest],
  video_url: null,
  thumbnail_url: null,
  difficulty: Difficulty.Beginner,
  audio_cues: [],
  is_premium: false,
  created_at: new Date('2025-01-01').toISOString(),
};

const session: WorkoutSession = {
  id: 'session-1',
  user_id: 'user-1',
  workout_id: 'workout-1',
  started_at: new Date('2025-01-10').toISOString(),
  completed_at: new Date('2025-01-10').toISOString(),
  exercises_completed: [
    {
      exercise_id: 'exercise-1',
      sets_completed: 3,
      reps_completed: 30,
      duration_actual: 0,
      skipped: false,
    },
  ],
  pace_adjustments: [],
  voice_commands_used: [],
};

describe('Mobile Progress Screen', () => {
  it('loads progress data and renders stats/history blocks', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('workout_sessions', 'then', { data: [session], error: null, count: null });
    supabase.queue('exercises', 'then', { data: [exercise], error: null, count: null });
    supabase.queue('workouts', 'then', {
      data: [{ id: 'workout-1', title: 'Upper Body Blast' }],
      error: null,
      count: null,
    });
    setActiveSupabaseMock(supabase);

    render(<ProgressScreen />);

    expect(await screen.findByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Current Streak')).toBeInTheDocument();
    expect(screen.getByText('Weekly Activity')).toBeInTheDocument();
    expect(screen.getByText('Personal Records')).toBeInTheDocument();
    expect(screen.getByText('Recent Workouts')).toBeInTheDocument();
    expect(screen.getByText('Upper Body Blast')).toBeInTheDocument();
  });

  it('shows empty progress copy when no sessions exist', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('workout_sessions', 'then', { data: [], error: null, count: null });
    supabase.queue('exercises', 'then', { data: [exercise], error: null, count: null });
    supabase.queue('workouts', 'then', { data: [], error: null, count: null });
    setActiveSupabaseMock(supabase);

    render(<ProgressScreen />);

    expect(await screen.findByText('No workout history yet.')).toBeInTheDocument();
    expect(
      screen.getByText('Complete a workout to start tracking progress.'),
    ).toBeInTheDocument();
  });
});
