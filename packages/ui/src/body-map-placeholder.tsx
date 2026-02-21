import React from 'react';

export interface BodyMapPlaceholderProps {
  onSelectMuscleGroup?: (muscleGroup: string) => void;
}

export function BodyMapPlaceholder({ onSelectMuscleGroup }: BodyMapPlaceholderProps) {
  return React.createElement(
    'div',
    {
      style: {
        width: 300,
        height: 500,
        border: '2px dashed #ccc',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 8,
      },
    },
    React.createElement('span', { style: { fontSize: 48 } }, '\u{1F9CD}'),
    React.createElement('span', { style: { color: '#666' } }, 'Interactive Body Map'),
    React.createElement('span', { style: { color: '#999', fontSize: 12 } }, 'Coming soon')
  );
}
