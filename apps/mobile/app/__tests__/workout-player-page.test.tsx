import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import WorkoutPlayerScreen from '../workout/[id]';
import { Category, Difficulty, MuscleGroup, type Exercise, type Workout } from '@myworkouts/shared';
import { usePlayerStore } from '@/lib/player-store';
import { createSupabaseMock, setActiveSupabaseMock } from '@/test/mocks/supabase';
import { getRouterMock, setMockLocalSearchParams } from '@/test/mocks/navigation';

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

const workout: Workout = {
  id: 'workout-1',
  title: 'Quick Session',
  description: 'Single exercise',
  creator_id: 'user-1',
  difficulty: Difficulty.Beginner,
  estimated_duration: 60,
  is_premium: false,
  created_at: new Date('2025-01-01').toISOString(),
  exercises: [
    {
      exercise_id: 'exercise-1',
      sets: 1,
      reps: 1,
      duration: null,
      rest_after: 0,
      order: 0,
    },
  ],
};

describe('Mobile Workout Player Screen', () => {
  beforeEach(() => {
    setMockLocalSearchParams({ id: 'workout-1' });
    usePlayerStore.getState().init([]);
  });

  it('shows workout-not-found fallback and back control', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('workouts', 'single', { data: null, error: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<WorkoutPlayerScreen />);

    expect(await screen.findByText('Workout not found.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go Back' }));
    expect(getRouterMock().back).toHaveBeenCalled();
  });

  it('runs a start-to-complete flow and persists workout session', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('workouts', 'single', { data: workout, error: null });
    supabase.queue('exercises', 'then', { data: [exercise], error: null, count: null });
    supabase.queue('workout_sessions', 'then', { data: [], error: null, count: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    const { container } = render(<WorkoutPlayerScreen />);

    expect(await screen.findByText('Quick Session')).toBeInTheDocument();

    const playButton = container.querySelector('button.h-16.w-16');
    expect(playButton).not.toBeNull();
    await user.click(playButton!);
    await user.click(screen.getByRole('button', { name: '+1 Rep' }));

    expect(await screen.findByText('Workout Complete!')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(getRouterMock().back).toHaveBeenCalled();

    await waitFor(() => {
      const insertCall = supabase.calls.queryOps.find(
        (call) => call.table === 'workout_sessions' && call.method === 'insert',
      );
      expect(insertCall).toBeDefined();
      expect(insertCall?.args[0]).toMatchObject({
        user_id: 'user-1',
        workout_id: 'workout-1',
      });
    });
  });
});
