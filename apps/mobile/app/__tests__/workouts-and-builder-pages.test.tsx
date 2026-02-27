import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import WorkoutsScreen from '../(tabs)/workouts';
import WorkoutBuilderScreen from '../workouts/builder';
import { Category, Difficulty, MuscleGroup, type Exercise } from '@myworkouts/shared';
import { useExerciseStore } from '@/lib/exercise-store';
import { useWorkoutBuilderStore } from '@/lib/workout-builder-store';
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

const secondExercise: Exercise = {
  ...exercise,
  id: 'exercise-2',
  name: 'Plank',
  category: Category.Strength,
};

describe('Mobile Workouts and Builder Pages', () => {
  beforeEach(() => {
    useExerciseStore.setState({
      exercises: [],
      selectedMuscles: [],
      selectedCategory: null,
      searchQuery: '',
    });
    useWorkoutBuilderStore.getState().reset();
    setMockLocalSearchParams({});
  });

  it('loads workouts list and routes from list/new actions', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('workouts', 'then', {
      data: [
        {
          id: 'workout-1',
          title: 'Upper Body',
          description: 'Chest and triceps',
          creator_id: 'user-1',
          difficulty: Difficulty.Beginner,
          estimated_duration: 900,
          is_premium: false,
          created_at: new Date('2025-01-01').toISOString(),
          exercises: [
            { exercise_id: 'exercise-1', sets: 3, reps: 10, duration: null, rest_after: 60, order: 0 },
          ],
        },
      ],
      error: null,
      count: null,
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<WorkoutsScreen />);

    expect(await screen.findByText('Upper Body')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+ New' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/workouts/builder');

    await user.click(screen.getByRole('button', { name: /Upper Body/i }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/workouts/builder?edit=workout-1');
  });

  it('builds and saves a workout from the picker flow', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('exercises', 'then', { data: [exercise], error: null, count: null });
    supabase.queue('workouts', 'then', { data: [], error: null, count: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<WorkoutBuilderScreen />);

    await user.click(screen.getByRole('button', { name: '+ Add Exercise' }));
    await user.click(await screen.findByRole('button', { name: /Push Up/i }));

    await user.type(screen.getByPlaceholderText('Workout name'), 'Morning Session');
    await user.click(screen.getByRole('button', { name: 'Save Workout' }));

    await waitFor(() => {
      const insertCall = supabase.calls.queryOps.find(
        (call) => call.table === 'workouts' && call.method === 'insert',
      );
      expect(insertCall).toBeDefined();
      expect(insertCall?.args[0]).toMatchObject({
        title: 'Morning Session',
        creator_id: 'user-1',
      });
      expect(getRouterMock().back).toHaveBeenCalled();
    });
  });

  it('prefills builder when routed with an add exercise query', async () => {
    setMockLocalSearchParams({ add: 'exercise-1' });

    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('exercises', 'then', { data: [exercise], error: null, count: null });
    supabase.queue('exercises', 'single', { data: exercise, error: null });
    setActiveSupabaseMock(supabase);

    render(<WorkoutBuilderScreen />);

    expect(await screen.findByDisplayValue('Push Up Workout')).toBeInTheDocument();
    expect(screen.getByText('Exercises (1)')).toBeInTheDocument();
    expect(screen.getByText('Push Up')).toBeInTheDocument();
  });

  it('merges fetched add exercise with already-loaded exercise store data', async () => {
    setMockLocalSearchParams({ add: 'exercise-2' });

    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('exercises', 'then', { data: [exercise], error: null, count: null });
    supabase.queue('exercises', 'single', { data: secondExercise, error: null });
    setActiveSupabaseMock(supabase);

    render(<WorkoutBuilderScreen />);

    expect(await screen.findByDisplayValue('Plank Workout')).toBeInTheDocument();
    expect(screen.getByText('Exercises (1)')).toBeInTheDocument();

    await waitFor(() => {
      const storeExercises = useExerciseStore.getState().exercises.map((item) => item.id);
      expect(storeExercises).toContain('exercise-1');
      expect(storeExercises).toContain('exercise-2');
    });
  });

  it('attempts invalid add prefill only once across rerenders', async () => {
    setMockLocalSearchParams({ add: 'missing-exercise' });

    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('exercises', 'then', { data: [exercise], error: null, count: null });
    supabase.queue('exercises', 'single', { data: null, error: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<WorkoutBuilderScreen />);

    await screen.findByText('Exercises (0)');
    await user.type(screen.getByPlaceholderText('Workout name'), 'Retry Trigger');

    await waitFor(() => {
      const singleCalls = supabase.calls.queryOps.filter(
        (call) => call.table === 'exercises' && call.method === 'single',
      );
      expect(singleCalls).toHaveLength(1);
    });
  });

  it('loads workout in edit mode and supports cancel action', async () => {
    setMockLocalSearchParams({ edit: 'workout-1' });

    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('exercises', 'then', { data: [exercise], error: null, count: null });
    supabase.queue('workouts', 'single', {
      data: {
        id: 'workout-1',
        title: 'Upper Body',
        description: 'Chest and triceps',
        creator_id: 'user-1',
        difficulty: Difficulty.Beginner,
        estimated_duration: 900,
        is_premium: false,
        created_at: new Date('2025-01-01').toISOString(),
        exercises: [
          { exercise_id: 'exercise-1', sets: 3, reps: 10, duration: null, rest_after: 60, order: 0 },
        ],
      },
      error: null,
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<WorkoutBuilderScreen />);

    expect(await screen.findByText('Edit Workout')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Upper Body')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(getRouterMock().back).toHaveBeenCalled();
  });
});
