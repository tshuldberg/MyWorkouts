import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignInPage from '../auth/sign-in/page';
import SignUpPage from '../auth/sign-up/page';
import ForgotPasswordPage from '../auth/forgot-password/page';
import { createSupabaseMock, setActiveSupabaseMock } from '@/test/mocks/supabase';
import { getRouterMock } from '@/test/mocks/navigation';

describe('Auth Pages', () => {
  const origin = window.location.origin;

  it('submits sign-in form and routes to home on success', async () => {
    const supabase = createSupabaseMock();
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<SignInPage />);
    await user.type(screen.getByLabelText('Email'), 'athlete@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'athlete@example.com',
        password: 'password123',
      });
    });
    expect(getRouterMock().push).toHaveBeenCalledWith('/');
    expect(getRouterMock().refresh).toHaveBeenCalled();
  });

  it('renders sign-in error when credentials fail', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: 'Invalid login credentials' },
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<SignInPage />);
    await user.type(screen.getByLabelText('Email'), 'athlete@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument();
    expect(getRouterMock().push).not.toHaveBeenCalled();
  });

  it('calls OAuth sign-in for both social buttons', async () => {
    const supabase = createSupabaseMock();
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<SignInPage />);
    await user.click(screen.getByRole('button', { name: 'Google' }));
    await user.click(screen.getByRole('button', { name: 'Apple' }));

    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledTimes(2);
    });
    expect(supabase.auth.signInWithOAuth).toHaveBeenNthCalledWith(1, {
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback` },
    });
    expect(supabase.auth.signInWithOAuth).toHaveBeenNthCalledWith(2, {
      provider: 'apple',
      options: { redirectTo: `${origin}/auth/callback` },
    });
  });

  it('shows confirmation state after successful sign-up', async () => {
    const supabase = createSupabaseMock();
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<SignUpPage />);
    await user.type(screen.getByLabelText('Display Name'), 'Casey Athlete');
    await user.type(screen.getByLabelText('Email'), 'casey@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'casey@example.com',
        password: 'password123',
        options: {
          data: { display_name: 'Casey Athlete' },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });
    });
    expect(await screen.findByText('Check Your Email')).toBeInTheDocument();
    expect(screen.getByText(/casey@example.com/)).toBeInTheDocument();
  });

  it('renders sign-up error message on Supabase failure', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.signUp.mockResolvedValueOnce({
      data: null,
      error: { message: 'Email already registered' },
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<SignUpPage />);
    await user.type(screen.getByLabelText('Display Name'), 'Casey Athlete');
    await user.type(screen.getByLabelText('Email'), 'casey@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
  });

  it('sends reset email and shows success view on forgot-password page', async () => {
    const supabase = createSupabaseMock();
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText('Email'), 'reset@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'reset@example.com',
        { redirectTo: `${origin}/auth/callback?next=/profile` },
      );
    });
    expect(await screen.findByText('Check Your Email')).toBeInTheDocument();
  });

  it('renders reset-password error when Supabase rejects request', async () => {
    const supabase = createSupabaseMock();
    supabase.auth.resetPasswordForEmail.mockResolvedValueOnce({
      data: null,
      error: { message: 'Unable to send reset email' },
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText('Email'), 'reset@example.com');
    await user.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(await screen.findByText('Unable to send reset email')).toBeInTheDocument();
  });
});
