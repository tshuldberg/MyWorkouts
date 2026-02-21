import React from 'react';

export interface ExerciseCardProps {
  name: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  muscleGroups: string[];
  thumbnailUrl?: string | null;
  onPress?: () => void;
}

const difficultyDots: Record<string, string> = {
  beginner: '\u25CF\u25CB\u25CB',
  intermediate: '\u25CF\u25CF\u25CB',
  advanced: '\u25CF\u25CF\u25CF',
};

const difficultyLabel: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const categoryLabel: Record<string, string> = {
  cardio: 'Cardio',
  strength: 'Strength',
  mobility: 'Mobility',
  fascia: 'Fascia',
  recovery: 'Recovery',
  flexibility: 'Flexibility',
  balance: 'Balance',
};

function formatMuscleGroups(groups: string[], max = 3): string {
  const labels = groups.map((g) =>
    g.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
  if (labels.length <= max) return labels.join(', ');
  return labels.slice(0, max).join(', ') + ` +${labels.length - max} more`;
}

export function ExerciseCard({
  name,
  category,
  difficulty,
  muscleGroups,
  thumbnailUrl,
  onPress,
}: ExerciseCardProps) {
  return React.createElement(
    'button',
    {
      onClick: onPress,
      type: 'button' as const,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        border: '1px solid #E5E7EB',
        background: '#fff',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left' as const,
      },
    },
    // Thumbnail
    React.createElement(
      'div',
      {
        style: {
          width: 56,
          height: 56,
          borderRadius: 8,
          backgroundColor: '#F3F4F6',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          overflow: 'hidden',
        },
      },
      thumbnailUrl
        ? React.createElement('img', {
            src: thumbnailUrl,
            alt: name,
            style: { width: '100%', height: '100%', objectFit: 'cover' },
          })
        : React.createElement('span', null, categoryIcon(category))
    ),
    // Text content
    React.createElement(
      'div',
      { style: { flex: 1, minWidth: 0 } },
      React.createElement(
        'div',
        { style: { fontWeight: 600, fontSize: 16, color: '#111827' } },
        name
      ),
      React.createElement(
        'div',
        { style: { fontSize: 13, color: '#6B7280', marginTop: 2 } },
        `${categoryLabel[category] ?? category} \u00B7 ${difficultyDots[difficulty]} ${difficultyLabel[difficulty]}`
      ),
      React.createElement(
        'div',
        { style: { fontSize: 13, color: '#9CA3AF', marginTop: 2 } },
        formatMuscleGroups(muscleGroups)
      )
    )
  );
}

function categoryIcon(category: string): string {
  const icons: Record<string, string> = {
    strength: '\uD83D\uDCAA',
    cardio: '\uD83C\uDFC3',
    mobility: '\uD83E\uDDD8',
    fascia: '\uD83E\uDEE8',
    recovery: '\uD83D\uDE4F',
    flexibility: '\uD83E\uDD38',
    balance: '\u2696\uFE0F',
  };
  return icons[category] ?? '\uD83C\uDFCB\uFE0F';
}
