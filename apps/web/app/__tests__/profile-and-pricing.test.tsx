import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PricingPage from '../pricing/page';
import { ProfileForm } from '../profile/profile-form';
import { SignOutButton } from '../profile/sign-out-button';
import { createSupabaseMock, setActiveSupabaseMock } from '@/test/mocks/supabase';
import { getRouterMock } from '@/test/mocks/navigation';

describe('Profile And Pricing Interfaces', () => {
  it('toggles pricing between annual and monthly values', async () => {
    const user = userEvent.setup();
    render(<PricingPage />);

    expect(screen.getByText('$10')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '' }));
    expect(screen.getByText('$15')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Current Plan' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/profile');

    await user.click(screen.getByRole('button', { name: 'Upgrade to Premium' }));
    expect(getRouterMock().push).toHaveBeenCalledWith('/auth/sign-in?next=/pricing');
  });

  it('saves profile changes and refreshes route', async () => {
    const supabase = createSupabaseMock({
      id: 'user-1',
      email: 'athlete@example.com',
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(
      <ProfileForm
        email="athlete@example.com"
        displayName="Old Name"
        avatarUrl=""
      />,
    );

    const displayNameInput = screen.getByLabelText('Display Name');
    await user.clear(displayNameInput);
    await user.type(displayNameInput, 'New Name');
    await user.type(screen.getByLabelText('Avatar URL'), 'https://avatar.example/new.png');
    await user.click(screen.getByRole('button', { name: 'Save Profile' }));

    await waitFor(() => {
      const updateCall = supabase.calls.queryOps.find(
        (call) => call.table === 'users' && call.method === 'update',
      );
      expect(updateCall).toBeDefined();
    });
    expect(getRouterMock().refresh).toHaveBeenCalled();
    expect(await screen.findByText('Profile updated')).toBeInTheDocument();
  });

  it('signs out and returns to home page', async () => {
    const supabase = createSupabaseMock({
      id: 'user-2',
      email: 'athlete@example.com',
    });
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(<SignOutButton />);
    await user.click(screen.getByRole('button', { name: 'Sign Out' }));

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
    expect(getRouterMock().push).toHaveBeenCalledWith('/');
    expect(getRouterMock().refresh).toHaveBeenCalled();
  });

  it('shows error and stops loading when profile save is attempted without auth user', async () => {
    const supabase = createSupabaseMock(null);
    setActiveSupabaseMock(supabase);
    const user = userEvent.setup();

    render(
      <ProfileForm
        email="athlete@example.com"
        displayName="Name"
        avatarUrl=""
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Save Profile' }));

    expect(await screen.findByText('Error: Please sign in again to update your profile.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Profile' })).toBeEnabled();
  });
});
