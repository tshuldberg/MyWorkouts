import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import {
  Category,
  Difficulty,
  MuscleGroup,
  SubscriptionPlan,
  type Exercise,
  type Workout,
} from '@myworkouts/shared';
import WorkoutPlayerPage from '../workout/[id]/page';
import { createSupabaseMock, setActiveSupabaseMock } from '@/test/mocks/supabase';
import { getRouterMock, setMockParams } from '@/test/mocks/navigation';
import { usePlayerStore } from '@/lib/player-store';
import { useSubscriptionStore } from '@/lib/subscription-store';

const {
  speechStartMock,
  speechStopMock,
  createSpeechAdapterMock,
  cameraStartPreviewMock,
  cameraAttachPreviewMock,
  cameraStartRecordingMock,
  cameraStopRecordingMock,
  cameraDestroyMock,
  createCameraRecorderMock,
} = vi.hoisted(() => {
  const speechStart = vi.fn();
  const speechStop = vi.fn();

  const cameraStartPreview = vi.fn(async () => undefined);
  const cameraAttachPreview = vi.fn();
  const cameraStartRecording = vi.fn();
  const cameraStopRecording = vi.fn(async () => new Blob(['video'], { type: 'video/webm' }));
  const cameraDestroy = vi.fn();

  return {
    speechStartMock: speechStart,
    speechStopMock: speechStop,
    createSpeechAdapterMock: vi.fn((_config?: unknown) => ({
      start: speechStart,
      stop: speechStop,
      isListening: false,
    })),
    cameraStartPreviewMock: cameraStartPreview,
    cameraAttachPreviewMock: cameraAttachPreview,
    cameraStartRecordingMock: cameraStartRecording,
    cameraStopRecordingMock: cameraStopRecording,
    cameraDestroyMock: cameraDestroy,
    createCameraRecorderMock: vi.fn(() => ({
      startPreview: cameraStartPreview,
      attachPreview: cameraAttachPreview,
      startRecording: cameraStartRecording,
      stopRecording: cameraStopRecording,
      destroy: cameraDestroy,
      isRecording: false,
      isPreviewing: false,
    })),
  };
});

vi.mock('@/lib/speech-recognition', () => ({
  createWebSpeechAdapter: createSpeechAdapterMock,
}));

vi.mock('@/lib/camera-recorder', () => ({
  createCameraRecorder: createCameraRecorderMock,
}));

vi.mock('@/lib/recording-upload', () => ({
  uploadRecording: vi.fn(async () => ({ url: 'https://signed.example.test/recording.webm', path: 'path.webm' })),
}));

const exercise: Exercise = {
  id: 'ex-1',
  name: 'Push Up',
  description: 'Bodyweight chest exercise',
  category: Category.Strength,
  muscle_groups: [MuscleGroup.Chest],
  video_url: null,
  thumbnail_url: null,
  difficulty: Difficulty.Beginner,
  audio_cues: [],
  is_premium: false,
  created_at: new Date().toISOString(),
};

const workout: Workout = {
  id: 'wk-1',
  title: 'Quick Session',
  description: 'Single exercise session',
  creator_id: 'user-1',
  difficulty: Difficulty.Beginner,
  estimated_duration: 30,
  is_premium: false,
  created_at: new Date().toISOString(),
  exercises: [
    {
      exercise_id: 'ex-1',
      sets: 1,
      reps: 1,
      duration: null,
      rest_after: 0,
      order: 0,
    },
  ],
};

describe('Workout Player Page', () => {
  beforeEach(() => {
    setMockParams({ id: 'wk-1' });
    usePlayerStore.getState().init([]);
    useSubscriptionStore.setState({
      plan: SubscriptionPlan.Free,
      status: null,
      expiresAt: null,
      isLoading: true,
    });
    speechStartMock.mockClear();
    speechStopMock.mockClear();
    createSpeechAdapterMock.mockClear();
    cameraStartPreviewMock.mockClear();
    cameraAttachPreviewMock.mockClear();
    cameraStartRecordingMock.mockClear();
    cameraStopRecordingMock.mockClear();
    cameraDestroyMock.mockClear();
    createCameraRecorderMock.mockClear();
  });

  it('shows workout-not-found state and routes back to workouts', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('workouts', 'single', { data: null, error: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<WorkoutPlayerPage />);
    expect(await screen.findByText('Workout not found.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to Workouts' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/workouts');
  });

  it('runs a full start-to-complete flow via play and rep completion controls', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('workouts', 'single', { data: workout, error: null });
    supabase.queue('exercises', 'then', { data: [exercise], error: null, count: null });
    supabase.queue('subscriptions', 'single', { data: null, error: null });
    supabase.queue('workout_sessions', 'single', { data: { id: 'session-1' }, error: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    const { container } = render(<WorkoutPlayerPage />);

    await screen.findByRole('heading', { name: 'Quick Session' });
    const playButton = container.querySelector('button.flex.h-16.w-16');
    expect(playButton).not.toBeNull();
    await user.click(playButton!);
    await user.click(await screen.findByRole('button', { name: '+1 Rep' }));

    expect(await screen.findByText('Workout Complete!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/workouts');
  });

  it('toggles voice and camera controls and starts recording from voice command', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('workouts', 'single', { data: workout, error: null });
    supabase.queue('exercises', 'then', { data: [exercise], error: null, count: null });
    supabase.queue('subscriptions', 'single', {
      data: { plan: SubscriptionPlan.Premium, status: 'active', expires_at: null },
      error: null,
    });
    supabase.queue('workout_sessions', 'single', { data: { id: 'session-1' }, error: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    const { container } = render(<WorkoutPlayerPage />);
    await screen.findByRole('heading', { name: 'Quick Session' });

    await user.click(screen.getByTitle('Enable voice commands'));
    expect(createSpeechAdapterMock).toHaveBeenCalled();
    expect(speechStartMock).toHaveBeenCalled();

    await user.click(screen.getByTitle('Enable form recording'));
    await waitFor(() => {
      expect(createCameraRecorderMock).toHaveBeenCalled();
      expect(cameraStartPreviewMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(createSpeechAdapterMock.mock.calls.length).toBeGreaterThan(1);
    });

    const playButton = container.querySelector('button.flex.h-16.w-16');
    expect(playButton).not.toBeNull();
    await user.click(playButton!);

    const latestSpeechConfig = createSpeechAdapterMock.mock.calls.at(-1)?.[0] as
      | { onCommand?: (command: any) => void }
      | undefined;

    expect(latestSpeechConfig?.onCommand).toBeDefined();
    await act(async () => {
      latestSpeechConfig?.onCommand?.({
        category: 'recording',
        action: 'start',
        confidence: 1,
        raw: 'start recording',
      });
    });

    await waitFor(() => {
      expect(cameraStartRecordingMock).toHaveBeenCalled();
    });

    await user.click(screen.getByTitle('Voice on (click to mute)'));
    expect(speechStopMock).toHaveBeenCalled();
  });
});
