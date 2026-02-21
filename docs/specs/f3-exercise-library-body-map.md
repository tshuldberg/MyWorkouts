# F3: Exercise Library + Interactive Body Map — Feature Spec

> **Date:** 2026-02-20
> **Status:** Ready for Implementation
> **Dependencies:** F1 (scaffold)
> **References:** `docs/research/body-map-ux.md`

## Overview
Users explore exercises by tapping muscle groups on an interactive body map or browsing by category. The body map is the signature navigation element — a human figure where tapping any muscle group instantly filters the exercise library.

## Screens / Pages

### 1. Explore Tab (Body Map + Exercise List)
This is the primary exercise discovery screen, accessible from the main tab bar.

**Layout (Mobile Portrait):**
```
┌─────────────────────────────┐
│  Explore                    │
│                             │
│  ┌──────────┬──────────┐    │
│  │  FRONT   │   BACK   │◄── Toggle (tab-style, not button)
│  └──────────┴──────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │                     │    │
│  │   Body Map SVG      │    │  ← ~40% of screen height
│  │   (tappable regions)│    │
│  │                     │    │
│  └─────────────────────┘    │
│                             │
│  Selected: [Chest ✕] [Core ✕] │ ← Chip bar (removable, or "All Muscles" if empty)
│                             │
│  [All] [Strength] [Cardio] [Mobility] ... │ ← Category filter pills (horizontal scroll)
│                             │
│  ┌─────────────────────┐    │
│  │ 🔍 Search exercises  │    │ ← Search bar
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ Push-up             │    │
│  │ Strength · Beginner │    │  ← Exercise cards (scrollable list)
│  │ Chest, Triceps, Core│    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ Bench Press         │    │
│  │ ...                 │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

**Layout (Web):**
- Body map on left side (~40% width), exercise list on right (~60%)
- Category filters and search above the exercise list
- Responsive: collapses to mobile layout on small screens

### 2. Exercise Detail Page
Shown when user taps an exercise card.

```
┌─────────────────────────────┐
│  [◀ Back]     ♡ Save        │
│                             │
│  ┌─────────────────────┐    │
│  │                     │    │
│  │   Exercise Video    │    │  ← Coach demo video (or placeholder image)
│  │   (auto-plays muted)│    │
│  │                     │    │
│  └─────────────────────┘    │
│                             │
│  PUSH-UP                    │  ← Exercise name (large)
│  Strength · Beginner        │  ← Category + difficulty
│                             │
│  ┌──────────┬──────────┐    │
│  │ Primary  │Secondary │    │
│  │ • Chest  │• Triceps │    │  ← Muscle targeting
│  │          │• Shoulders│   │
│  │          │• Core    │    │
│  └──────────┴──────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ Body Map (small,    │    │  ← Mini body map showing targeted muscles
│  │ read-only, colored) │    │    (non-interactive, illustrative only)
│  └─────────────────────┘    │
│                             │
│  Description:               │
│  Start in a high plank      │
│  position with hands        │
│  shoulder-width apart...    │
│                             │
│  Default: 3 sets × 12 reps │
│                             │
│  [▶ Start Workout]          │  ← Quick-start single exercise
│  [+ Add to Workout]         │  ← Add to workout builder
└─────────────────────────────┘
```

## Body Map Interaction Design

### Library
- **Mobile:** `react-native-body-highlighter` v3+
- **Web:** `react-body-highlighter` (web adaptation)
- Both share the same SVG data and slug system

### Tap Behavior
1. User taps a muscle region on the SVG
2. Region highlights with accent color (immediate visual feedback)
3. Muscle name appears as a removable chip below the map
4. Exercise list below auto-filters to show exercises targeting selected muscles
5. Multiple muscles can be selected (AND logic: show exercises that target ANY selected muscle)
6. Tapping a highlighted muscle deselects it

### Front/Back Toggle
- Tab-style toggle at top of body map: "FRONT" | "BACK"
- Selections persist across toggle (selecting chest on front, then switching to back, chest remains selected)
- Active tab is visually distinct (filled vs. outlined)

### Color System
- **Default (unselected):** Light gray fill (`#E5E7EB`)
- **Selected (primary target):** Brand accent color (`#6366F1` indigo)
- **Hover/press (web/touch feedback):** Slightly lighter accent
- **Mini body map (detail page):** Primary muscles in accent, secondary in lighter tint

### Slug Mapping (from research)
Defined in `packages/shared/src/body-map/`:

```typescript
export const SLUG_TO_MUSCLE_GROUP: Record<string, MuscleGroup> = {
  'chest': MuscleGroup.Chest,
  'upper-back': MuscleGroup.Back,
  'lower-back': MuscleGroup.Back,
  'deltoids': MuscleGroup.Shoulders,
  'biceps': MuscleGroup.Biceps,
  'triceps': MuscleGroup.Triceps,
  'forearm': MuscleGroup.Forearms,
  'abs': MuscleGroup.Core,
  'obliques': MuscleGroup.Core,
  'quadriceps': MuscleGroup.Quads,
  'hamstring': MuscleGroup.Hamstrings,
  'gluteal': MuscleGroup.Glutes,
  'calves': MuscleGroup.Calves,
  'adductors': MuscleGroup.HipFlexors,
  'neck': MuscleGroup.Neck,
};

export const MUSCLE_GROUP_TO_SLUGS: Record<MuscleGroup, string[]> = {
  [MuscleGroup.Back]: ['upper-back', 'lower-back'],
  [MuscleGroup.Core]: ['abs', 'obliques'],
  // ... all others are 1:1
};
```

## Exercise Card Component

```
┌─────────────────────────────────────┐
│ [Thumbnail]  Push-up                │
│              Strength · ●●○ Inter.  │
│              Chest, Triceps, Core   │
└─────────────────────────────────────┘
```

- **Thumbnail:** 56x56px rounded square (exercise screenshot or category icon fallback)
- **Name:** Bold, 16pt
- **Meta line 1:** Category name + difficulty dots (● filled, ○ empty)
- **Meta line 2:** Muscle groups (comma-separated, max 3 shown + "+N more")
- **Tap:** Navigate to exercise detail page

## Category Filter UX

Horizontal scrolling pill bar:
```
[All] [Strength] [Cardio] [Mobility] [Fascia] [Recovery] [Flexibility] [Balance]
```

- "All" is selected by default
- Single-select (picking "Strength" deselects "All")
- Works in combination with body map selection (muscle + category = intersection)
- Category pills show count: "Strength (24)"

## Search Behavior
- Searches exercise `name` and `description` fields
- Client-side filtering for <200 exercises (no server round-trip needed)
- Debounced input (300ms)
- Clears muscle/category filters on search (or shows "in selected muscles" option)
- Minimum 2 characters before filtering

## Supabase Query Patterns

### Fetch all exercises (initial load)
```typescript
const { data } = await supabase
  .from('exercises')
  .select('*')
  .order('name');
```
Cache client-side in Zustand. Exercise library is small enough (<200 rows) to load entirely.

### Filter by muscle group
```typescript
// Client-side filter (preferred for small dataset):
exercises.filter(e =>
  selectedMuscles.some(m => e.muscle_groups.includes(m))
);
```

## Seed Data Requirements
- Minimum 50 exercises across all 7 categories
- Distribution: ~15 Strength, ~8 Cardio, ~8 Mobility, ~5 Fascia, ~5 Recovery, ~5 Flexibility, ~4 Balance
- Each exercise needs: name, description (2-3 sentences suitable for audio cues), category, muscleGroups[], difficulty, defaultSets, defaultReps
- See `docs/content/exercise-seed-data.json`
