import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Category,
  Difficulty,
  MuscleGroup,
  type Exercise,
  type Workout,
} from '@myworkouts/shared';
import WorkoutsPage from '../workouts/page';
import WorkoutBuilderPageWrapper from '../workouts/builder/page';
import { createSupabaseMock, setActiveSupabaseMock } from '@/test/mocks/supabase';
import {
  getRouterMock,
  setMockSearchParams,
} from '@/test/mocks/navigation';
import { useExerciseStore } from '@/lib/exercise-store';
import { useWorkoutBuilderStore } from '@/lib/workout-builder-store';

const sampleExercise: Exercise = {
  id: 'ex-1',
  name: 'Push Up',
  description: 'Bodyweight chest exercise',
  category: Category.Strength,
  muscle_groups: [MuscleGroup.Chest, MuscleGroup.Triceps],
  video_url: null,
  thumbnail_url: null,
  difficulty: Difficulty.Beginner,
  audio_cues: [],
  is_premium: false,
  created_at: new Date().toISOString(),
};

const sampleWorkout: Workout = {
  id: 'wk-1',
  title: 'Upper Body Blast',
  description: 'Quick chest and triceps focus',
  creator_id: 'user-1',
  difficulty: Difficulty.Beginner,
  estimated_duration: 600,
  is_premium: false,
  created_at: new Date().toISOString(),
  exercises: [
    {
      exercise_id: 'ex-1',
      sets: 3,
      reps: 10,
      duration: null,
      rest_after: 60,
      order: 0,
    },
  ],
};

describe('Workouts List And Builder Pages', () => {
  beforeEach(() => {
    useExerciseStore.setState({
      exercises: [],
      selectedMuscles: [],
      selectedCategory: null,
      searchQuery: '',
    });
    useWorkoutBuilderStore.getState().reset();
    setMockSearchParams('');
  });

  it('loads workouts and routes through New/Start/Edit buttons', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('workouts', 'then', { data: [sampleWorkout], error: null, count: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<WorkoutsPage />);
    expect(await screen.findByText('Upper Body Blast')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+ New Workout' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/workouts/builder');

    await user.click(screen.getByRole('button', { name: 'Start' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/workout/wk-1');

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/workouts/builder?edit=wk-1');
  });

  it('shows create-first-workout CTA when list is empty', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('workouts', 'then', { data: [], error: null, count: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<WorkoutsPage />);
    expect(await screen.findByText('No custom workouts yet.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create your first workout' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/workouts/builder');
  });

  it('allows adding exercises and saving a new workout from builder page', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    setActiveSupabaseMock(supabase);
    useExerciseStore.getState().setExercises([sampleExercise]);
    const user = userEvent.setup();

    render(<WorkoutBuilderPageWrapper />);

    await user.type(screen.getByPlaceholderText('Workout name'), 'Morning Session');
    await user.click(screen.getByRole('button', { name: '+ Add Exercise' }));
    await user.click(screen.getByRole('button', { name: /Push Up/i }));

    expect(screen.getByText('Exercises (1)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save Workout' }));

    await waitFor(() => {
      const insertCall = supabase.calls.queryOps.find(
        (call) => call.table === 'workouts' && call.method === 'insert',
      );
      expect(insertCall).toBeDefined();
    });
    expect(getRouterMock().push).toHaveBeenCalledWith('/workouts');
  });

  it('loads existing workout in edit mode and updates it', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('workouts', 'single', { data: sampleWorkout, error: null });
    setActiveSupabaseMock(supabase);
    setMockSearchParams({ edit: 'wk-1' });
    useExerciseStore.getState().setExercises([sampleExercise]);
    const user = userEvent.setup();

    render(<WorkoutBuilderPageWrapper />);
    expect(await screen.findByDisplayValue('Upper Body Blast')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update Workout' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Update Workout' }));

    await waitFor(() => {
      const updateCall = supabase.calls.queryOps.find(
        (call) => call.table === 'workouts' && call.method === 'update',
      );
      expect(updateCall).toBeDefined();
    });
    expect(getRouterMock().push).toHaveBeenCalledWith('/workouts');
  });

  it('cancels builder flow and returns to workouts list', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<WorkoutBuilderPageWrapper />);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(getRouterMock().push).toHaveBeenCalledWith('/workouts');
    expect(useWorkoutBuilderStore.getState().title).toBe('');
  });

  it('prefills builder from add query when opened from exercise detail', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    setActiveSupabaseMock(supabase);
    useExerciseStore.getState().setExercises([sampleExercise]);
    setMockSearchParams({ add: 'ex-1' });

    render(<WorkoutBuilderPageWrapper />);

    expect(await screen.findByDisplayValue('Push Up Workout')).toBeInTheDocument();
    expect(screen.getByText('Exercises (1)')).toBeInTheDocument();
  });
});
