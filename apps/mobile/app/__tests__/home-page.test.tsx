import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import HomeScreen from '../(tabs)/index';
import { createSupabaseMock, setActiveSupabaseMock } from '@/test/mocks/supabase';
import { getRouterMock } from '@/test/mocks/navigation';

describe('Mobile Home Screen', () => {
  it('loads greeting/stats and routes quick-action buttons', async () => {
    const supabase = createSupabaseMock({ id: 'user-1', email: 'athlete@example.com' });
    supabase.queue('workout_sessions', 'then', {
      data: [
        {
          id: 'session-1',
          user_id: 'user-1',
          workout_id: 'wk-1',
          started_at: new Date('2025-01-10').toISOString(),
          completed_at: new Date('2025-01-10').toISOString(),
          exercises_completed: [],
          voice_commands_used: [],
        },
      ],
      error: null,
      count: null,
    });
    supabase.queue('users', 'single', {
      data: { display_name: 'Alex' },
      error: null,
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<HomeScreen />);

    expect(await screen.findByText('Hey, Alex')).toBeInTheDocument();
    expect(screen.getByText('0 days')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Explore Exercises/i }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/(tabs)/explore');

    await user.click(screen.getByRole('button', { name: /My Workouts/i }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/(tabs)/workouts');

    await user.click(screen.getByRole('button', { name: /View Progress/i }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/(tabs)/progress');

    await user.click(screen.getByRole('button', { name: /Workout Plans/i }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/plans');
  });

  it('gracefully renders default message when no user is present', async () => {
    const supabase = createSupabaseMock(null);
    setActiveSupabaseMock(supabase);

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByText('Ready to work out?')).toBeInTheDocument();
    });
  });
});
