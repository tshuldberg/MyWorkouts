import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { Alert } from 'react-native';
import SignInScreen from '../auth/sign-in';
import SignUpScreen from '../auth/sign-up';
import ForgotPasswordScreen from '../auth/forgot-password';
import { useAuthStore } from '@/lib/auth-store';
import { createSupabaseMock, setActiveSupabaseMock } from '@/test/mocks/supabase';
import { getRouterMock } from '@/test/mocks/navigation';

describe('Mobile Auth Screens', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
    });
  });

  it('signs in and routes to home on successful credentials', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'athlete@example.com',
          created_at: new Date('2025-01-01').toISOString(),
          user_metadata: { display_name: 'Athlete' },
        },
      },
      error: null,
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<SignInScreen />);

    await user.type(screen.getByPlaceholderText('Email'), 'athlete@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'athlete@example.com',
        password: 'password123',
      });
      expect(getRouterMock().replace).toHaveBeenCalledWith('/');
      expect(useAuthStore.getState().user?.email).toBe('athlete@example.com');
    });
  });

  it('shows sign-in errors from auth provider', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<SignInScreen />);

    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Invalid login credentials');
  });

  it('creates account and returns to sign-in after confirmation', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.signUp.mockResolvedValue({ data: null, error: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<SignUpScreen />);

    await user.type(screen.getByPlaceholderText('Display Name'), 'Alex');
    await user.type(screen.getByPlaceholderText('Email'), 'alex@example.com');
    await user.type(screen.getByPlaceholderText('Password (min 8 characters)'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'alex@example.com',
        password: 'password123',
        options: { data: { display_name: 'Alex' } },
      });
      expect(Alert.alert).toHaveBeenCalled();
    });

    const alertCalls = (Alert.alert as any).mock.calls;
    const okAction = alertCalls[0][2][0];
    okAction.onPress();
    expect(getRouterMock().back).toHaveBeenCalled();
  });

  it('sends password reset and returns to sign-in', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.resetPasswordForEmail.mockResolvedValue({ data: null, error: null });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<ForgotPasswordScreen />);

    await user.type(screen.getByPlaceholderText('Email'), 'alex@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('alex@example.com');
      expect(Alert.alert).toHaveBeenCalled();
    });

    const alertCalls = (Alert.alert as any).mock.calls;
    const okAction = alertCalls[0][2][0];
    okAction.onPress();
    expect(getRouterMock().back).toHaveBeenCalled();
  });
});
