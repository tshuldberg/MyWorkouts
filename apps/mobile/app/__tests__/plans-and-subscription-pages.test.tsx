import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { Alert } from 'react-native';
import PlansScreen from '../plans/index';
import PlanDetailScreen from '../plans/[id]';
import SubscriptionScreen from '../subscription/index';
import { Difficulty, SubscriptionPlan } from '@myworkouts/shared';
import { createSupabaseMock, setActiveSupabaseMock } from '@/test/mocks/supabase';
import { getRouterMock, setMockLocalSearchParams } from '@/test/mocks/navigation';

describe('Mobile Plans and Subscription Pages', () => {
  beforeEach(() => {
    setMockLocalSearchParams({ id: 'plan-1' });
  });

  it('loads plans list and routes to selected plan detail', async () => {
    const supabase = createSupabaseMock({ id: 'coach-1', email: 'coach@example.com' });
    supabase.queue('workout_plans', 'then', {
      data: [
        {
          id: 'plan-1',
          title: 'Coach Strength Plan',
          coach_id: 'coach-1',
          weeks: [
            {
              week_number: 1,
              days: [
                {
                  day_number: 1,
                  workout_id: null,
                  rest_day: true,
                  notes: null,
                },
              ],
            },
          ],
          is_premium: true,
          created_at: new Date('2025-01-01').toISOString(),
        },
      ],
      error: null,
      count: null,
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<PlansScreen />);

    expect(await screen.findByText('Coach Strength Plan')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Coach Strength Plan/i }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/plans/plan-1');
  });

  it('routes premium users to subscription when trying to follow paid plan', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('users', 'single', {
      data: { subscription_tier: SubscriptionPlan.Free },
      error: null,
    });
    supabase.queue('plan_subscriptions', 'maybeSingle', { data: null, error: null });
    supabase.queue('workout_plans', 'single', {
      data: {
        id: 'plan-1',
        title: 'Premium Plan',
        coach_id: 'coach-1',
        weeks: [
          {
            week_number: 1,
            days: [
              {
                day_number: 1,
                workout_id: 'workout-1',
                rest_day: false,
                notes: null,
              },
            ],
          },
        ],
        is_premium: true,
        created_at: new Date('2025-01-01').toISOString(),
      },
      error: null,
    });
    supabase.queue('workouts', 'then', {
      data: [{ id: 'workout-1', title: 'Upper Body', difficulty: Difficulty.Beginner, exercises: [] }],
      error: null,
      count: null,
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<PlanDetailScreen />);

    await user.click(await screen.findByRole('button', { name: 'Upgrade to Premium to Follow' }));

    expect(getRouterMock().push).toHaveBeenCalledWith('/subscription');
  });

  it('follows and unfollows a free plan', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('users', 'single', {
      data: { subscription_tier: SubscriptionPlan.Free },
      error: null,
    });
    supabase.queue('plan_subscriptions', 'maybeSingle', { data: null, error: null });
    supabase.queue('workout_plans', 'single', {
      data: {
        id: 'plan-1',
        title: 'Starter Plan',
        coach_id: 'coach-1',
        weeks: [
          {
            week_number: 1,
            days: [
              {
                day_number: 1,
                workout_id: null,
                rest_day: true,
                notes: null,
              },
            ],
          },
        ],
        is_premium: false,
        created_at: new Date('2025-01-01').toISOString(),
      },
      error: null,
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<PlanDetailScreen />);

    await user.click(await screen.findByRole('button', { name: 'Follow This Plan' }));

    await waitFor(() => {
      const insertCall = supabase.calls.queryOps.find(
        (call) => call.table === 'plan_subscriptions' && call.method === 'insert',
      );
      expect(insertCall).toBeDefined();
      expect(screen.getByText('Following')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Unfollow' }));

    const alertCalls = (Alert.alert as any).mock.calls;
    const unfollowAction = alertCalls[0][2][1];
    await unfollowAction.onPress();

    await waitFor(() => {
      const deleteCall = supabase.calls.queryOps.find(
        (call) => call.table === 'plan_subscriptions' && call.method === 'delete',
      );
      expect(deleteCall).toBeDefined();
      expect(screen.getByRole('button', { name: 'Follow This Plan' })).toBeInTheDocument();
    });
  });

  it('handles subscription CTA and maybe-later navigation', async () => {
    const user = userEvent.setup();

    render(<SubscriptionScreen />);

    await user.click(screen.getByRole('button', { name: 'Upgrade to Premium' }));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Premium',
      'RevenueCat integration coming soon. This will open the native purchase flow.',
      [{ text: 'OK' }],
    );

    await user.click(screen.getByRole('button', { name: 'Maybe later' }));
    expect(getRouterMock().back).toHaveBeenCalled();
  });
});
