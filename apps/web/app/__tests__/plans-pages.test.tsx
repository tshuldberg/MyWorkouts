import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Difficulty,
  SubscriptionPlan,
  type Workout,
  type WorkoutPlan,
} from '@myworkouts/shared';
import PlansPage from '../plans/page';
import PlanDetailPage from '../plans/[id]/page';
import PlanBuilderPageWrapper from '../plans/builder/page';
import { createSupabaseMock, setActiveSupabaseMock } from '@/test/mocks/supabase';
import {
  getRouterMock,
  setMockParams,
  setMockSearchParams,
} from '@/test/mocks/navigation';
import { usePlanBuilderStore } from '@/lib/plan-builder-store';

const workout: Workout = {
  id: 'wk-1',
  title: 'Strength Day',
  description: 'Heavy compound lifts',
  creator_id: 'coach-1',
  difficulty: Difficulty.Intermediate,
  exercises: [],
  estimated_duration: 1800,
  is_premium: false,
  created_at: new Date().toISOString(),
};

const plan: WorkoutPlan = {
  id: 'plan-1',
  title: '8 Week Strength',
  coach_id: 'coach-1',
  is_premium: true,
  created_at: new Date().toISOString(),
  weeks: [
    {
      week_number: 1,
      days: [
        { day_number: 1, workout_id: 'wk-1', rest_day: false, notes: null },
        { day_number: 2, workout_id: null, rest_day: true, notes: null },
        { day_number: 3, workout_id: null, rest_day: true, notes: null },
        { day_number: 4, workout_id: null, rest_day: true, notes: null },
        { day_number: 5, workout_id: null, rest_day: true, notes: null },
        { day_number: 6, workout_id: null, rest_day: true, notes: null },
        { day_number: 7, workout_id: null, rest_day: true, notes: null },
      ],
    },
  ],
};

describe('Plans Pages', () => {
  beforeEach(() => {
    usePlanBuilderStore.getState().reset();
    setMockParams({});
    setMockSearchParams('');
  });

  it('shows coach plans and supports New Plan + plan detail navigation', async () => {
    const supabase = createSupabaseMock({ id: 'coach-1', email: 'coach@example.com' });
    supabase.queue('workout_plans', 'then', { data: [plan], error: null, count: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<PlansPage />);
    expect(await screen.findByText('8 Week Strength')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ New Plan' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+ New Plan' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/plans/builder');

    await user.click(screen.getByRole('button', { name: /8 Week Strength/i }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/plans/plan-1');
  });

  it('loads client plans from assigned coach when user has no coach-owned plans', async () => {
    const supabase = createSupabaseMock({ id: 'client-1', email: 'client@example.com' });
    supabase.queue('workout_plans', 'then', { data: [], error: null, count: null });
    supabase.queue('users', 'single', {
      data: { coach_id: 'coach-1' },
      error: null,
    });
    supabase.queue('workout_plans', 'then', { data: [plan], error: null, count: null });
    setActiveSupabaseMock(supabase);

    render(<PlansPage />);
    expect(await screen.findByText('8 Week Strength')).toBeInTheDocument();
  });

  it('routes to pricing when free user attempts to follow premium plan', async () => {
    const supabase = createSupabaseMock({ id: 'client-1', email: 'client@example.com' });
    supabase.queue('users', 'single', {
      data: { subscription_tier: SubscriptionPlan.Free },
      error: null,
    });
    supabase.queue('plan_subscriptions', 'maybeSingle', { data: null, error: null });
    supabase.queue('workout_plans', 'single', { data: plan, error: null });
    supabase.queue('workouts', 'then', { data: [{ id: 'wk-1', title: 'Strength Day' }], error: null, count: null });
    setActiveSupabaseMock(supabase);
    setMockParams({ id: 'plan-1' });
    const user = userEvent.setup();

    render(<PlanDetailPage />);
    expect(await screen.findByRole('button', { name: 'Upgrade to Premium to Follow' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Upgrade to Premium to Follow' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/pricing');
  });

  it('follows plan for premium user and persists subscription row', async () => {
    const premiumPlan = { ...plan, is_premium: false };
    const supabase = createSupabaseMock({ id: 'client-2', email: 'client2@example.com' });
    supabase.queue('users', 'single', {
      data: { subscription_tier: SubscriptionPlan.Premium },
      error: null,
    });
    supabase.queue('plan_subscriptions', 'maybeSingle', { data: null, error: null });
    supabase.queue('workout_plans', 'single', { data: premiumPlan, error: null });
    supabase.queue('workouts', 'then', { data: [{ id: 'wk-1', title: 'Strength Day' }], error: null, count: null });
    setActiveSupabaseMock(supabase);
    setMockParams({ id: 'plan-1' });
    const user = userEvent.setup();

    render(<PlanDetailPage />);
    await user.click(await screen.findByRole('button', { name: 'Follow This Plan' }));

    await waitFor(() => {
      const insertCall = supabase.calls.queryOps.find(
        (call) => call.table === 'plan_subscriptions' && call.method === 'insert',
      );
      expect(insertCall).toBeDefined();
    });
    expect(await screen.findByText('Following this plan')).toBeInTheDocument();
  });

  it('creates a plan from plan builder after assigning workout to a day', async () => {
    const supabase = createSupabaseMock({ id: 'coach-1', email: 'coach@example.com' });
    supabase.queue('workouts', 'then', { data: [workout], error: null, count: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<PlanBuilderPageWrapper />);
    await user.type(
      screen.getByPlaceholderText('Plan name (e.g., 8-Week Strength Program)'),
      'Coach Plan',
    );

    await user.click(screen.getAllByRole('button', { name: '+ Workout' })[0]);
    await user.click(await screen.findByRole('button', { name: /Strength Day/i }));

    await user.click(screen.getByRole('button', { name: 'Create Plan' }));

    await waitFor(() => {
      const insertCall = supabase.calls.queryOps.find(
        (call) => call.table === 'workout_plans' && call.method === 'insert',
      );
      expect(insertCall).toBeDefined();
    });
    expect(getRouterMock().push).toHaveBeenCalledWith('/plans');
  });
});
