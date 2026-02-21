import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
}

export function Button({ children, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  return React.createElement(
    'button',
    {
      onClick: onPress,
      disabled,
      'data-variant': variant,
    },
    children
  );
}
