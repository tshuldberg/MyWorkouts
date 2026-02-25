import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import CoachPlansPage from '../plans/page';
import NewPlanPageWrapper from '../plans/new/page';
import SettingsPage from '../settings/page';
import { createSupabaseMock, setActiveSupabaseMock } from '@/test/mocks/supabase';
import { getRouterMock, setMockSearchParams } from '@/test/mocks/navigation';

function createWeek(weekNumber: number) {
  return {
    week_number: weekNumber,
    days: Array.from({ length: 7 }, (_, index) => ({
      day_number: index + 1,
      workout_id: null,
      rest_day: index >= 5,
      notes: null,
    })),
  };
}

describe('Coach Plans and Settings Pages', () => {
  beforeEach(() => {
    setMockSearchParams('');
  });

  it('lists plans and routes from New Plan and plan row buttons', async () => {
    const supabase = createSupabaseMock({ id: 'coach-1', email: 'coach@example.com' });
    supabase.queue('workout_plans', 'then', {
      data: [
        {
          id: 'plan-1',
          title: 'Strength Block',
          coach_id: 'coach-1',
          weeks: [createWeek(1)],
          is_premium: true,
          created_at: new Date('2025-01-01').toISOString(),
        },
      ],
      error: null,
      count: null,
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<CoachPlansPage />);

    expect(await screen.findByRole('heading', { name: 'Workout Plans' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+ New Plan' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/plans/new');

    await user.click(screen.getByRole('button', { name: /Strength Block/i }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/plans/new?edit=plan-1');
  });

  it('redirects unauthenticated users from plans page', async () => {
    const supabase = createSupabaseMock(null);
    setActiveSupabaseMock(supabase);

    render(<CoachPlansPage />);

    await waitFor(() => {
      expect(getRouterMock().push).toHaveBeenCalledWith('/auth/sign-in');
    });
  });

  it('redirects unauthenticated users from plan builder page', async () => {
    const supabase = createSupabaseMock(null);
    setActiveSupabaseMock(supabase);

    render(<NewPlanPageWrapper />);

    await waitFor(() => {
      expect(getRouterMock().push).toHaveBeenCalledWith('/auth/sign-in');
    });
  });

  it('creates a new plan after assigning a workout to a day', async () => {
    const supabase = createSupabaseMock({ id: 'coach-1', email: 'coach@example.com' });
    supabase.queue('workouts', 'then', {
      data: [
        {
          id: 'workout-1',
          title: 'Upper Body',
          exercises: [{ exercise_id: 'e1', sets: 3, reps: 10, duration: null, rest_after: 60, order: 0 }],
          difficulty: 'beginner',
        },
      ],
      error: null,
      count: null,
    });
    supabase.queue('workout_plans', 'then', { data: [], error: null, count: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<NewPlanPageWrapper />);

    await user.type(
      await screen.findByPlaceholderText('Plan name (e.g., 8-Week Strength Program)'),
      'Coach Plan Alpha',
    );

    await user.click(screen.getAllByRole('button', { name: '+ Workout' })[0]);
    await user.click(await screen.findByRole('button', { name: /Upper Body/i }));

    await user.click(screen.getByRole('button', { name: 'Create Plan' }));

    await waitFor(() => {
      const insertCall = supabase.calls.queryOps.find(
        (call) => call.table === 'workout_plans' && call.method === 'insert',
      );
      expect(insertCall).toBeDefined();
      expect(insertCall?.args[0]).toMatchObject({
        title: 'Coach Plan Alpha',
        coach_id: 'coach-1',
        is_premium: true,
      });
      expect(getRouterMock().push).toHaveBeenCalledWith('/plans');
    });
  });

  it('loads an existing plan for editing and updates it', async () => {
    setMockSearchParams({ edit: 'plan-1' });

    const supabase = createSupabaseMock({ id: 'coach-1', email: 'coach@example.com' });
    supabase.queue('workouts', 'then', {
      data: [
        {
          id: 'workout-1',
          title: 'Upper Body',
          exercises: [{ exercise_id: 'e1', sets: 3, reps: 10, duration: null, rest_after: 60, order: 0 }],
          difficulty: 'beginner',
        },
      ],
      error: null,
      count: null,
    });
    supabase.queue('workout_plans', 'single', {
      data: {
        id: 'plan-1',
        title: 'Strength Block',
        coach_id: 'coach-1',
        weeks: [createWeek(1)],
        is_premium: false,
        created_at: new Date('2025-01-01').toISOString(),
      },
      error: null,
    });
    supabase.queue('workout_plans', 'then', { data: [], error: null, count: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<NewPlanPageWrapper />);

    expect(await screen.findByRole('heading', { name: 'Edit Plan' })).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText('Plan name (e.g., 8-Week Strength Program)');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Strength Block');
    await user.click(screen.getByRole('button', { name: 'Update Plan' }));

    await waitFor(() => {
      const updateCall = supabase.calls.queryOps.find(
        (call) => call.table === 'workout_plans' && call.method === 'update',
      );
      expect(updateCall).toBeDefined();
      expect(updateCall?.args[0]).toMatchObject({ title: 'Updated Strength Block' });
      expect(getRouterMock().push).toHaveBeenCalledWith('/plans');
    });
  });

  it('deletes the editing plan after confirmation', async () => {
    setMockSearchParams({ edit: 'plan-1' });

    const supabase = createSupabaseMock({ id: 'coach-1', email: 'coach@example.com' });
    supabase.queue('workouts', 'then', { data: [], error: null, count: null });
    supabase.queue('workout_plans', 'single', {
      data: {
        id: 'plan-1',
        title: 'Strength Block',
        coach_id: 'coach-1',
        weeks: [createWeek(1)],
        is_premium: false,
        created_at: new Date('2025-01-01').toISOString(),
      },
      error: null,
    });
    supabase.queue('workout_plans', 'then', { data: [], error: null, count: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<NewPlanPageWrapper />);

    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      const deleteCall = supabase.calls.queryOps.find(
        (call) => call.table === 'workout_plans' && call.method === 'delete',
      );
      expect(deleteCall).toBeDefined();
      expect(getRouterMock().push).toHaveBeenCalledWith('/plans');
    });
  });

  it('loads profile settings and signs out', async () => {
    const supabase = createSupabaseMock({ id: 'coach-1', email: 'coach@example.com' });
    // single() in the shared test mock consumes a then() fallback entry eagerly.
    supabase.queue('users', 'then', { data: [], error: null, count: null });
    supabase.queue('users', 'single', {
      data: {
        id: 'coach-1',
        display_name: 'Coach Kim',
        email: 'coach@example.com',
        avatar_url: null,
        subscription_tier: 'free',
        coach_id: null,
        created_at: new Date('2024-01-01').toISOString(),
      },
      error: null,
    });
    supabase.queue('users', 'then', { data: null, error: null, count: 7 });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, href: 'http://localhost/settings' },
    });

    render(<SettingsPage />);

    expect(await screen.findByText('Coach Kim')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign Out' }));

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(window.location.href).toBe('/');

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('redirects unauthenticated users from settings page', async () => {
    const supabase = createSupabaseMock(null);
    setActiveSupabaseMock(supabase);

    render(<SettingsPage />);

    await waitFor(() => {
      expect(getRouterMock().push).toHaveBeenCalledWith('/auth/sign-in');
    });
  });
});
