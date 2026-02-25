import { render, screen } from '@testing-library/react';
import RootLayout from '../layout';

describe('Coach Root Layout', () => {
  it('renders main navigation links', () => {
    render(
      <RootLayout>
        <div>Page Content</div>
      </RootLayout>,
    );

    expect(screen.getByRole('link', { name: 'MyWorkouts' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Clients' })).toHaveAttribute('href', '/clients');
    expect(screen.getByRole('link', { name: 'Plans' })).toHaveAttribute('href', '/plans');
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });
});
