# Body Map UX Research

> **Date:** 2026-02-20
> **Author:** CPO Agent
> **Purpose:** Inform F3 (Exercise Library + Body Map) implementation

## How Existing Apps Implement Interactive Body Maps

### JEFIT — BodyMap
JEFIT's BodyMap is the gold standard for workout-to-body visualization. Key design patterns:

- **Data-driven visualization:** Transforms workout logging data into a color-coded body overlay showing which muscles a routine targets and how intensely.
- **Tap-to-drill:** Users tap a muscle on the map to see sub-muscle groups and their exercise contributions ranked by percentage.
- **Direct manipulation:** From the breakdown view, users can add exercises directly via a "+" button, closing the loop between visualization and action.
- **Real-time access:** BodyMap is accessible mid-workout to check muscle engagement, not just during planning.
- **Workout composition analysis:** Shows which exercises target which muscles and how much each contributes, enabling data-driven workout balancing.

**Key takeaway:** JEFIT treats the body map as an *analytical tool* (post-workout review + workout composition), not just a discovery tool. MyWorkouts should consider both use cases.

### MuscleWiki
MuscleWiki is the simplest and most viral body map implementation:

- **Direct selection:** Users click any muscle on an interactive SVG body to see exercises targeting that muscle.
- **Exercise list with video:** After selecting a muscle, a curated list of exercises appears with video tutorials and step-by-step instructions.
- **2000+ exercises** organized by muscle group with proper form instruction.
- **SVG-based:** Uses embedded SVGs that scale well, can be styled with CSS, and include metadata associating muscles to exercise database records.
- **UX praised for simplicity:** Described as "touch the doll where you want it to hurt" — users intuitively understand the interaction with zero onboarding.

**Key takeaway:** Simplicity wins. The tap-muscle-get-exercises flow is immediately intuitive. MyWorkouts should adopt this as the primary interaction model.

### Muscle Booster / Fitness Buddy
- Use illustrated body diagrams (not photorealistic) with color highlighting.
- Typically show front/back views as separate screens with a toggle.
- Muscle groups highlight on tap, then filter an exercise list.
- Some apps add a "selected muscles" chip bar above the exercise list for multi-select.

## SVG Body Map Libraries for React / React Native

### react-native-body-highlighter (Recommended)
**Package:** `react-native-body-highlighter` (npm, v3.1.3)
**GitHub:** HichamELBSI/react-native-body-highlighter

Best fit for MyWorkouts — Expo-compatible, actively maintained, comprehensive API.

**Supported body parts (23 regions):**

| Body Part | View |
|-----------|------|
| trapezius | Both (front + back) |
| triceps | Both |
| forearm | Both |
| adductors | Both |
| calves | Both |
| neck | Both |
| deltoids | Both |
| hands | Both |
| feet | Both |
| head | Both |
| ankles | Both |
| tibialis | Front only |
| obliques | Front only |
| chest | Front only |
| biceps | Front only |
| abs | Front only |
| quadriceps | Front only |
| knees | Front only |
| upper-back | Back only |
| lower-back | Back only |
| hamstring | Back only |
| gluteal | Back only |

**Key props:**
- `data` — Array of `{ slug, intensity, side?, color?, styles? }` objects
- `onBodyPartPress` — Callback `(bodyPart, side) => {}` for tap handling
- `side` — `"front"` or `"back"` (toggle between views)
- `gender` — `"male"` or `"female"`
- `scale` — Scaling factor
- `colors` — Custom color array for intensity levels
- `disabledParts` / `hiddenParts` — Disable or hide specific regions
- Accessibility labels built-in (screen reader compatible)

**Styling priority:** `styles.fill` > `color` > `intensity` > `defaultFill`

**Limitations:**
- No 3D rotation — front/back only
- No hip_flexors slug (would need to map to `adductors` or custom overlay)
- No "full_body" meta-slug (app-level concern)
- Cannot do per-muscle accessibility labels without forking

### react-body-highlighter (Web)
**Package:** `react-body-highlighter` (npm)
**GitHub:** giavinh79/react-body-highlighter

Web-only version derived from the React Native package. Same SVG data, adapted for React DOM. Useful for the Next.js web app.

### react-muscle-highlighter (Web)
**Package:** `react-muscle-highlighter` (npm)
**GitHub:** soroojshehryar/react-muscle-highlighter

Alternative web component with clickable muscle regions. More detailed muscle segmentation but less actively maintained.

## Front/Back Toggle vs. 3D vs. Flat Illustration

### Option A: Front/Back Toggle with SVG (Recommended)
**Pros:**
- Simple, proven UX pattern (JEFIT, MuscleWiki, Muscle Booster all use this)
- `react-native-body-highlighter` supports this natively with `side` prop
- Fast rendering (SVG is lightweight)
- Works identically on mobile and web
- Accessible to screen readers
- Easy to implement multi-select with visual feedback

**Cons:**
- Two static views instead of exploration
- Some muscles (e.g., obliques) awkward to show in pure front/back

### Option B: Rotatable 3D Model
**Pros:**
- Impressive, modern feel
- Can show any angle
- Good for "wow factor" marketing

**Cons:**
- Heavy dependency (Three.js / react-three-fiber)
- Performance concerns on lower-end mobile devices
- Complex touch gesture handling (rotate vs. tap-to-select conflict)
- No mature React Native library exists — would need custom WebGL/Three.js bridge
- Accessibility nightmare (no screen reader support for 3D)
- Longer development time (2-3x)

### Option C: Flat Illustration (Non-interactive)
**Pros:**
- Simplest to implement
- Good for static display (e.g., exercise detail page showing targeted muscles)

**Cons:**
- Not interactive — defeats the discovery purpose
- Requires separate exercise discovery UI

### Recommendation
**Use Option A (Front/Back Toggle)** for the interactive body map feature. This is the industry standard, has library support, and delivers the core UX value with minimal complexity.

Use Option C (flat illustration) as a *secondary* display on exercise detail pages to show which muscles an exercise targets (read-only, non-interactive).

## Best UX for Muscle Group Selection -> Exercise Filtering

### Recommended Flow

```
1. Body Map Screen (default: front view)
   ├── User taps a muscle group (e.g., chest)
   │   └── Muscle highlights with color feedback
   │       └── Selected muscle appears as a chip/tag below the map
   ├── User can tap additional muscles (multi-select)
   │   └── Each selection adds a chip, body map updates highlights
   ├── Front/Back toggle button to switch views
   │   └── Selections persist across toggle
   └── "Show Exercises" button OR auto-filter below the map
       └── Exercise list filtered to selected muscle groups
           ├── Cards show: name, category icon, difficulty, thumbnail
           ├── Secondary filter bar: Category (Strength, Cardio, etc.)
           └── Tap card -> Exercise Detail page
```

### Key UX Decisions

1. **Multi-select vs. single-select:** Support multi-select. Users often want to see exercises that hit multiple muscle groups (e.g., chest + triceps for a push day).

2. **Chip bar for selections:** Display selected muscles as removable chips between the body map and exercise list. This provides clear state feedback and easy deselection.

3. **Immediate filtering vs. explicit button:** Use immediate filtering (exercise list updates as selections change). The body map and exercise list should be on the same scrollable screen, with the map at the top.

4. **Category secondary filter:** After muscle filtering, allow category refinement (Strength, Mobility, etc.) via horizontal scrolling pills.

5. **Clear all:** Provide a "Clear All" action to reset selections and show the full exercise library.

6. **Visual feedback:** Use intensity colors on the body map — tapped muscles should visually stand out (e.g., accent color) vs. default gray.

### Mapping Library Slugs to Design Data Model

The design document defines these muscle groups:
`chest, back, shoulders, biceps, triceps, forearms, core, quads, hamstrings, glutes, calves, hip_flexors, neck, full_body`

Mapping to `react-native-body-highlighter` slugs:

| Design Model | Library Slug | Notes |
|-------------|-------------|-------|
| chest | `chest` | Direct match |
| back | `upper-back` + `lower-back` | Map to two slugs |
| shoulders | `deltoids` | Rename in display |
| biceps | `biceps` | Direct match |
| triceps | `triceps` | Direct match |
| forearms | `forearm` | Singular in library |
| core | `abs` + `obliques` | Map to two slugs |
| quads | `quadriceps` | Rename in display |
| hamstrings | `hamstring` | Singular in library |
| glutes | `gluteal` | Rename in display |
| calves | `calves` | Direct match |
| hip_flexors | `adductors` | Closest visual match |
| neck | `neck` | Direct match |
| full_body | *all slugs* | Meta-group, highlight everything |

This mapping should live in `packages/shared/src/body-map/` as a constant, shared between mobile and web.

## Impact on Technical Architecture

1. **Package choice:** `react-native-body-highlighter` for mobile, `react-body-highlighter` for web (same underlying SVG data).
2. **Shared mapping layer:** `packages/shared/src/body-map/muscle-map.ts` should define the slug-to-muscle-group mapping and be consumed by both platforms.
3. **State management:** Selected muscles stored in Zustand, persisted for the session. The exercise list query filters by selected muscle groups.
4. **Supabase query:** `exercises` table has `muscle_groups text[]` column. Filter with `@>` (array contains) or `&&` (array overlaps) operator depending on AND/OR logic preference.
5. **Performance:** SVG rendering is lightweight. No WebGL or heavy dependencies needed. The body map component should load instantly.
