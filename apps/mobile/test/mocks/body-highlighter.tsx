import React from 'react';

export type ExtendedBodyPart = { slug?: string };

export default function Body({
  onBodyPartPress,
  side,
}: {
  onBodyPartPress?: (part: ExtendedBodyPart) => void;
  side?: string;
}) {
  return (
    <button
      type="button"
      data-testid={`body-map-${side ?? 'front'}`}
      onClick={() => onBodyPartPress?.({ slug: 'chest' })}
    >
      Body Map
    </button>
  );
}
