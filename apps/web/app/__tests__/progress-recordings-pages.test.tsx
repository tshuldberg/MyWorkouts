import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Category,
  Difficulty,
  MuscleGroup,
  type Exercise,
  type FormRecording,
  type WorkoutSession,
} from '@myworkouts/shared';
import ProgressPage from '../progress/page';
import RecordingsPage from '../recordings/page';
import RecordingReviewPage from '../recordings/[id]/page';
import { createSupabaseMock, setActiveSupabaseMock } from '@/test/mocks/supabase';
import {
  getRouterMock,
  setMockParams,
} from '@/test/mocks/navigation';

const { deleteRecordingMock, getRecordingUrlMock } = vi.hoisted(() => ({
  deleteRecordingMock: vi.fn(async () => true),
  getRecordingUrlMock: vi.fn(async () => 'https://signed.example.test/recording.webm'),
}));

vi.mock('@/lib/recording-upload', () => ({
  deleteRecording: deleteRecordingMock,
  getRecordingUrl: getRecordingUrlMock,
}));

const exercise: Exercise = {
  id: 'ex-1',
  name: 'Push Up',
  description: 'Chest exercise',
  category: Category.Strength,
  muscle_groups: [MuscleGroup.Chest],
  video_url: null,
  thumbnail_url: null,
  difficulty: Difficulty.Beginner,
  audio_cues: [],
  is_premium: false,
  created_at: new Date().toISOString(),
};

const recording: FormRecording = {
  id: 'rec-1',
  session_id: 'session-1',
  video_url: 'user-1/session-1/ex-1-1.webm',
  exercise_id: 'ex-1',
  timestamp_start: 0,
  timestamp_end: 30,
  coach_feedback: [
    {
      timestamp: 8,
      comment: 'Keep elbows tucked in.',
      coach_id: 'coach-1',
      created_at: new Date().toISOString(),
    },
  ],
  created_at: new Date().toISOString(),
};

const session: WorkoutSession = {
  id: 'session-1',
  user_id: 'user-1',
  workout_id: 'wk-1',
  started_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  completed_at: new Date().toISOString(),
  exercises_completed: [
    {
      exercise_id: 'ex-1',
      sets_completed: 3,
      reps_completed: 10,
      duration_actual: 120,
      skipped: false,
    },
  ],
  voice_commands_used: [],
  pace_adjustments: [],
};

describe('Progress And Recordings Pages', () => {
  beforeEach(() => {
    deleteRecordingMock.mockClear();
    getRecordingUrlMock.mockClear();
    setMockParams({});
  });

  it('shows empty progress state and routes to workouts CTA', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('workout_sessions', 'then', { data: [], error: null, count: null });
    supabase.queue('exercises', 'then', { data: [], error: null, count: null });
    supabase.queue('workouts', 'then', { data: [], error: null, count: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<ProgressPage />);
    expect(await screen.findByText('No workout history yet.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Browse workouts' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/workouts');
  });

  it('loads progress data and renders aggregate stats/history', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('workout_sessions', 'then', { data: [session], error: null, count: null });
    supabase.queue('exercises', 'then', { data: [exercise], error: null, count: null });
    supabase.queue('workouts', 'then', {
      data: [{ id: 'wk-1', title: 'Upper Body Blast' }],
      error: null,
      count: null,
    });
    setActiveSupabaseMock(supabase);

    render(<ProgressPage />);
    expect(await screen.findByText('Workout History')).toBeInTheDocument();
    expect(screen.getByText('Upper Body Blast')).toBeInTheDocument();
    expect(screen.getByText('Total Workouts')).toBeInTheDocument();
  });

  it('shows empty recordings state and routes to workouts', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('form_recordings', 'then', { data: [], error: null, count: null });
    supabase.queue('exercises', 'then', { data: [], error: null, count: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<RecordingsPage />);
    expect(await screen.findByText('No recordings yet.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start a workout' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/workouts');
  });

  it('loads recordings, opens detail view, and deletes selected item', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('form_recordings', 'then', {
      data: [
        {
          ...recording,
          workout_sessions: { user_id: 'user-1' },
        },
      ],
      error: null,
      count: null,
    });
    supabase.queue('exercises', 'then', {
      data: [{ id: 'ex-1', name: 'Push Up' }],
      error: null,
      count: null,
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<RecordingsPage />);
    expect(await screen.findByText('Push Up')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Push Up/i }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/recordings/rec-1');

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(deleteRecordingMock).toHaveBeenCalledWith('rec-1', recording.video_url);
    });
    expect(screen.queryByText('Push Up')).not.toBeInTheDocument();
  });

  it('keeps recording visible and shows error when delete fails', async () => {
    deleteRecordingMock.mockResolvedValueOnce(false);
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('form_recordings', 'then', {
      data: [
        {
          ...recording,
          workout_sessions: { user_id: 'user-1' },
        },
      ],
      error: null,
      count: null,
    });
    supabase.queue('exercises', 'then', {
      data: [{ id: 'ex-1', name: 'Push Up' }],
      error: null,
      count: null,
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<RecordingsPage />);
    expect(await screen.findByText('Push Up')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Could not delete recording. Please try again.')).toBeInTheDocument();
    expect(screen.getByText('Push Up')).toBeInTheDocument();
  });

  it('loads recording review data and seeks video when coach note is clicked', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('form_recordings', 'single', { data: recording, error: null });
    supabase.queue('exercises', 'single', { data: exercise, error: null });
    setActiveSupabaseMock(supabase);
    setMockParams({ id: 'rec-1' });
    const user = userEvent.setup();

    render(<RecordingReviewPage />);
    expect(await screen.findByRole('heading', { name: 'Push Up' })).toBeInTheDocument();
    expect(getRecordingUrlMock).toHaveBeenCalledWith(recording.video_url);

    const feedbackButton = screen.getByRole('button', { name: /Keep elbows tucked in\./i });
    await user.click(feedbackButton);

    const video = document.querySelector('video');
    expect(video).not.toBeNull();
    expect((video as HTMLVideoElement).currentTime).toBe(8);
  });

  it('shows recording-not-found state with back navigation', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('form_recordings', 'single', { data: null, error: null });
    setActiveSupabaseMock(supabase);
    setMockParams({ id: 'missing-rec' });
    const user = userEvent.setup();

    render(<RecordingReviewPage />);
    expect(await screen.findByText('Recording not found.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to Recordings' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/recordings');
  });
});
