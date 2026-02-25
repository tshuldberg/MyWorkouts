import { render, screen, waitFor } from '@testing-library/react';
import CoachDashboardPage from '../page';
import { createSupabaseMock, setActiveSupabaseMock } from '@/test/mocks/supabase';
import { getRouterMock } from '@/test/mocks/navigation';

describe('Coach Dashboard Page', () => {
  it('routes unauthenticated users to sign-in', async () => {
    const supabase = createSupabaseMock(null);
    setActiveSupabaseMock(supabase);

    render(<CoachDashboardPage />);

    await waitFor(() => {
      expect(getRouterMock().push).toHaveBeenCalledWith('/auth/sign-in');
    });
  });

  it('shows coach-only guard when user is assigned to a coach', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('users', 'then', { data: [], error: null, count: null });
    supabase.queue('users', 'single', { data: { coach_id: 'coach-99' }, error: null });
    setActiveSupabaseMock(supabase);

    render(<CoachDashboardPage />);

    expect(await screen.findByText('This portal is for coaches only.')).toBeInTheDocument();
  });

  it('loads dashboard cards and links from fetched data', async () => {
    const supabase = createSupabaseMock({ id: 'coach-1', email: 'coach@example.com' });
    supabase.queue('users', 'then', {
      data: [{ id: 'client-1', display_name: 'Alex', avatar_url: null }],
      error: null,
      count: null,
    });
    supabase.queue('workout_plans', 'then', {
      data: [
        {
          id: 'plan-1',
          title: '4 Week Strength',
          coach_id: 'coach-1',
          weeks: [{ week_number: 1, days: [] }],
          is_premium: true,
          created_at: new Date('2025-01-01').toISOString(),
        },
      ],
      error: null,
      count: null,
    });
    supabase.queue('workout_sessions', 'then', {
      data: [
        {
          id: 'session-1',
          user_id: 'client-1',
          workout_id: 'workout-1',
          started_at: new Date('2025-01-04').toISOString(),
          completed_at: new Date('2025-01-04').toISOString(),
          exercises_completed: [
            { exercise_id: 'e1', sets_completed: 1, reps_completed: 8, skipped: false },
            { exercise_id: 'e2', sets_completed: 1, reps_completed: 8, skipped: true },
          ],
          voice_commands_used: [],
        },
      ],
      error: null,
      count: null,
    });
    setActiveSupabaseMock(supabase);

    render(<CoachDashboardPage />);

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Active Clients')).toBeInTheDocument();
    expect(screen.getByText('Workout Plans')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Alex/i })).toHaveAttribute('href', '/clients/client-1');
    expect(screen.getByRole('link', { name: /4 Week Strength/i })).toHaveAttribute(
      'href',
      '/plans/new?edit=plan-1',
    );
    expect(screen.getByText('1 exercises')).toBeInTheDocument();
  });
});
