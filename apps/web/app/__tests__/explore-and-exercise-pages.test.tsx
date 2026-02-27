import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Category,
  Difficulty,
  MuscleGroup,
  type Exercise,
} from '@myworkouts/shared';
import ExplorePage from '../explore/page';
import { BodyMapWeb } from '../explore/body-map-web';
import ExerciseDetailPage from '../exercise/[id]/page';
import { createSupabaseMock, setActiveSupabaseMock } from '@/test/mocks/supabase';
import {
  getRouterMock,
  setMockParams,
} from '@/test/mocks/navigation';
import { useExerciseStore } from '@/lib/exercise-store';

const exerciseA: Exercise = {
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

const exerciseB: Exercise = {
  ...exerciseA,
  id: 'ex-2',
  name: 'Air Squat',
  category: Category.Mobility,
  muscle_groups: [MuscleGroup.Quads, MuscleGroup.Glutes],
};

describe('Explore And Exercise Detail Pages', () => {
  beforeEach(() => {
    useExerciseStore.setState({
      exercises: [],
      selectedMuscles: [],
      selectedCategory: null,
      searchQuery: '',
    });
  });

  it('loads explore exercises from Supabase and opens exercise detail on click', async () => {
    const supabase = createSupabaseMock();
    supabase.queue('exercises', 'then', {
      data: [exerciseA, exerciseB],
      error: null,
      count: null,
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<ExplorePage />);

    expect(screen.getByText('Loading exercises...')).toBeInTheDocument();
    expect(await screen.findByText('Push Up')).toBeInTheDocument();
    expect(screen.getByText('Air Squat')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Push Up/i }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/exercise/ex-1');
  });

  it('applies and clears muscle chips in body-map interface', async () => {
    const user = userEvent.setup();
    const onToggleMuscle = vi.fn();
    const onClearMuscles = vi.fn();

    const { rerender } = render(
      <BodyMapWeb
        selectedMuscles={[]}
        onToggleMuscle={onToggleMuscle}
        onClearMuscles={onClearMuscles}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'BACK' }));
    expect(screen.getByRole('button', { name: 'FRONT' })).toBeInTheDocument();

    rerender(
      <BodyMapWeb
        selectedMuscles={[MuscleGroup.Chest]}
        onToggleMuscle={onToggleMuscle}
        onClearMuscles={onClearMuscles}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Chest/i }));
    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(onToggleMuscle).toHaveBeenCalledWith(MuscleGroup.Chest);
    expect(onClearMuscles).toHaveBeenCalled();
  });

  it('shows not-found state in exercise detail and routes back to explore', async () => {
    const supabase = createSupabaseMock();
    supabase.queue('exercises', 'single', { data: null, error: null });
    setActiveSupabaseMock(supabase);
    setMockParams({ id: 'missing-id' });
    const user = userEvent.setup();

    render(<ExerciseDetailPage />);
    expect(await screen.findByText('Exercise not found.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to Explore' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/explore');
  });

  it('loads exercise detail data, supports navigation, and triggers action buttons', async () => {
    const supabase = createSupabaseMock({
      id: 'user-1',
      email: 'athlete@example.com',
    });
    supabase.queue('exercises', 'single', { data: exerciseA, error: null });
    supabase.queue('workouts', 'single', { data: { id: 'wk-quick' }, error: null });
    setActiveSupabaseMock(supabase);
    setMockParams({ id: 'ex-1' });
    const user = userEvent.setup();

    render(<ExerciseDetailPage />);
    expect(await screen.findByRole('heading', { name: 'Push Up' })).toBeInTheDocument();
    expect(screen.getByText('Start Workout')).toBeInTheDocument();
    expect(screen.getByText('Add to Workout')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(getRouterMock().back).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Add to Workout' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/workouts/builder?add=ex-1');

    await user.click(screen.getByRole('button', { name: 'Start Workout' }));
    await waitFor(() => {
      const insertCall = supabase.calls.queryOps.find(
        (call) => call.table === 'workouts' && call.method === 'insert',
      );
      expect(insertCall).toBeDefined();
    });
    expect(getRouterMock().push).toHaveBeenCalledWith('/workout/wk-quick');

    await waitFor(() => {
      expect(supabase.calls.fromTables).toContain('exercises');
    });
  });
});
