import { render, screen } from '@testing-library/react';
import HomePage from '../page';

describe('Home Page Quick Links', () => {
  it('renders key module links with correct destinations', () => {
    render(<HomePage />);

    expect(screen.getByRole('link', { name: /Explore Exercises/i })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: /My Workouts/i })).toHaveAttribute('href', '/workouts');
    expect(screen.getByRole('link', { name: /Progress/i })).toHaveAttribute('href', '/progress');
    expect(screen.getByRole('link', { name: /Workout Plans/i })).toHaveAttribute('href', '/plans');
    expect(screen.getByRole('link', { name: /Premium/i })).toHaveAttribute('href', '/pricing');
    expect(screen.getByRole('link', { name: /Profile/i })).toHaveAttribute('href', '/profile');
  });
});
