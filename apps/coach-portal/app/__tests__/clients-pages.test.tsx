import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import ClientsPage from '../clients/page';
import ClientDetailPage from '../clients/[id]/page';
import { createSupabaseMock, setActiveSupabaseMock } from '@/test/mocks/supabase';
import { getRouterMock, setMockParams } from '@/test/mocks/navigation';

describe('Coach Clients Pages', () => {
  beforeEach(() => {
    setMockParams({ id: 'client-1' });
  });

  it('shows empty clients state when none are assigned', async () => {
    const supabase = createSupabaseMock({ id: 'coach-1', email: 'coach@example.com' });
    supabase.queue('users', 'then', { data: [], error: null, count: null });
    setActiveSupabaseMock(supabase);

    render(<ClientsPage />);

    expect(await screen.findByText('No clients assigned yet.')).toBeInTheDocument();
  });

  it('redirects unauthenticated users from clients list', async () => {
    const supabase = createSupabaseMock(null);
    setActiveSupabaseMock(supabase);

    render(<ClientsPage />);

    await waitFor(() => {
      expect(getRouterMock().push).toHaveBeenCalledWith('/auth/sign-in');
    });
  });

  it('loads clients with workout and plan metadata', async () => {
    const supabase = createSupabaseMock({ id: 'coach-1', email: 'coach@example.com' });
    supabase.queue('users', 'then', {
      data: [
        {
          id: 'client-1',
          display_name: 'Alex Carter',
          email: 'alex@example.com',
          avatar_url: null,
          created_at: new Date('2025-01-01').toISOString(),
        },
      ],
      error: null,
      count: null,
    });
    supabase.queue('workout_sessions', 'then', {
      data: [{ started_at: new Date('2025-01-06').toISOString() }],
      error: null,
      count: null,
    });
    supabase.queue('workout_sessions', 'then', {
      data: null,
      error: null,
      count: 5,
    });
    supabase.queue('plan_subscriptions', 'then', {
      data: [{ plan_id: 'plan-1' }],
      error: null,
      count: null,
    });
    supabase.queue('workout_plans', 'single', {
      data: { title: 'Summer Strength' },
      error: null,
    });
    setActiveSupabaseMock(supabase);

    render(<ClientsPage />);

    expect(await screen.findByText('Alex Carter')).toBeInTheDocument();
    expect(screen.getByText('5 workouts')).toBeInTheDocument();
    expect(screen.getByText('Summer Strength')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Alex Carter/i })).toHaveAttribute(
      'href',
      '/clients/client-1',
    );
  });

  it('loads client detail and submits recording feedback', async () => {
    const supabase = createSupabaseMock({ id: 'coach-1', email: 'coach@example.com' });
    supabase.queue('users', 'single', {
      data: {
        id: 'client-1',
        display_name: 'Alex Carter',
        email: 'alex@example.com',
        avatar_url: null,
        created_at: new Date('2025-01-01').toISOString(),
      },
      error: null,
    });
    supabase.queue('workout_sessions', 'then', {
      data: [
        {
          id: 'session-1',
          workout_id: 'workout-1',
          started_at: new Date('2025-01-05').toISOString(),
          completed_at: new Date('2025-01-05').toISOString(),
        },
      ],
      error: null,
      count: null,
    });
    supabase.queue('workouts', 'then', {
      data: [{ id: 'workout-1', title: 'Upper Body Blast' }],
      error: null,
      count: null,
    });
    supabase.queue('form_recordings', 'then', {
      data: [
        {
          id: 'recording-1',
          session_id: 'session-1',
          video_url: 'https://video.example.test/1',
          exercise_id: 'exercise-1',
          timestamp_start: 0,
          timestamp_end: 10,
          coach_feedback: [],
          created_at: new Date('2025-01-05').toISOString(),
        },
      ],
      error: null,
      count: null,
    });
    supabase.queue('exercises', 'then', {
      data: [{ id: 'exercise-1', name: 'Push Up' }],
      error: null,
      count: null,
    });
    supabase.queue('form_recordings', 'then', { data: [], error: null, count: null });
    setActiveSupabaseMock(supabase);

    render(<ClientDetailPage />);

    expect(await screen.findByText('Alex Carter')).toBeInTheDocument();
    expect(screen.getByText('Upper Body Blast')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review Video' })).toHaveAttribute(
      'href',
      'https://video.example.test/1',
    );

    const feedbackInput = screen.getByPlaceholderText('Add feedback...');
    await userEvent.type(feedbackInput, 'Keep your elbows tucked');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Keep your elbows tucked')).toBeInTheDocument();
  });

  it('shows client-not-found state when no profile is returned', async () => {
    const supabase = createSupabaseMock({ id: 'coach-1', email: 'coach@example.com' });
    supabase.queue('users', 'single', { data: null, error: null });
    setActiveSupabaseMock(supabase);

    render(<ClientDetailPage />);

    expect(await screen.findByText('Client not found.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to clients' })).toHaveAttribute(
      'href',
      '/clients',
    );
  });

  it('redirects unauthenticated users from client detail', async () => {
    const supabase = createSupabaseMock(null);
    setActiveSupabaseMock(supabase);

    render(<ClientDetailPage />);

    await waitFor(() => {
      expect(getRouterMock().push).toHaveBeenCalledWith('/auth/sign-in');
    });
  });
});
