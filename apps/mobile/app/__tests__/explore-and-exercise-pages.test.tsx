import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import ExploreScreen from '../(tabs)/explore';
import ExerciseDetailScreen from '../exercise/[id]';
import { Category, Difficulty, MuscleGroup, type Exercise } from '@myworkouts/shared';
import { useExerciseStore } from '@/lib/exercise-store';
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

describe('Mobile Explore and Exercise Pages', () => {
  beforeEach(() => {
    useExerciseStore.setState({
      exercises: [],
      selectedMuscles: [],
      selectedCategory: null,
      searchQuery: '',
    });
    setMockLocalSearchParams({ id: 'exercise-1' });
  });

  it('loads exercises and routes to exercise details from explore cards', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('exercises', 'then', { data: [exercise], error: null, count: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<ExploreScreen />);

    expect(await screen.findByText('Push Up')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Push Up/i }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/exercise/exercise-1');
  });

  it('toggles muscle filters from body map interactions', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('exercises', 'then', { data: [exercise], error: null, count: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<ExploreScreen />);

    await screen.findByText('Push Up');
    await user.click(screen.getByTestId('body-map-front'));

    const chestLabels = await screen.findAllByText('Chest');
    expect(chestLabels.length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /Clear all/i }));
    expect(screen.getByText('All Muscles')).toBeInTheDocument();
  });

  it('loads exercise detail data and handles back actions', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('exercises', 'single', { data: exercise, error: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<ExerciseDetailScreen />);

    expect(await screen.findByText('Push Up')).toBeInTheDocument();
    expect(screen.getByText('Start Workout')).toBeInTheDocument();
    expect(screen.getByText('Add to Workout')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Back/i }));
    expect(getRouterMock().back).toHaveBeenCalled();
  });

  it('adds the exercise to builder and starts after creating a quick workout', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('exercises', 'single', { data: exercise, error: null });
    supabase.queue('workouts', 'single', { data: { id: 'quick-workout-1' }, error: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<ExerciseDetailScreen />);

    await screen.findByText('Push Up');

    await user.click(screen.getByRole('button', { name: 'Add to Workout' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/workouts/builder?add=exercise-1');

    await user.click(screen.getByRole('button', { name: 'Start Workout' }));

    await waitFor(() => {
      const insertCall = supabase.calls.queryOps.find(
        (call) => call.table === 'workouts' && call.method === 'insert',
      );
      expect(insertCall).toBeDefined();
      expect(insertCall?.args[0]).toMatchObject({
        title: 'Push Up Quick Start',
        description: 'Quick workout based on Push Up',
        creator_id: 'user-1',
        estimated_duration: 180,
        is_premium: false,
        exercises: [
          {
            exercise_id: 'exercise-1',
            sets: 3,
            reps: 10,
            duration: null,
            rest_after: 45,
            order: 0,
          },
        ],
      });
      expect(getRouterMock().push).toHaveBeenCalledWith('/workout/quick-workout-1');
    });
  });

  it('falls back to workout builder when quick workout creation fails', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('exercises', 'single', { data: exercise, error: null });
    supabase.queue('workouts', 'single', { data: null, error: { message: 'insert failed' } });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<ExerciseDetailScreen />);

    await screen.findByText('Push Up');
    await user.click(screen.getByRole('button', { name: 'Start Workout' }));

    await waitFor(() => {
      expect(getRouterMock().push).toHaveBeenCalledWith('/workouts/builder?add=exercise-1');
    });
  });

  it('shows missing-exercise fallback and back route control', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('exercises', 'single', { data: null, error: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<ExerciseDetailScreen />);

    expect(await screen.findByText('Exercise not found.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go Back' }));
    await waitFor(() => {
      expect(getRouterMock().back).toHaveBeenCalled();
    });
  });
});
