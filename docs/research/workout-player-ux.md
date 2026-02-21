# Workout Player UX Research

> **Date:** 2026-02-20
> **Purpose:** Inform F4 (Workout Player) implementation

## How Top Apps Structure Workout Players

### Peloton
- **Full-screen video** with instructor as the dominant element
- **Metrics bar** at bottom: elapsed time, calories, heart rate, cadence
- **Leaderboard** on right side (social motivation)
- **Music controls** integrated (Peloton curates playlists per class)
- **Instructor cues** appear as text overlays synchronized with audio
- **Progress:** Thin progress bar at very top of screen, shows position in class
- **Key insight:** Peloton succeeds because the instructor drives the pace — users follow along visually AND audibly. This is exactly the coach-paced model MyWorkouts needs.

### Nike Training Club (NTC)
- **Split screen:** Top half is exercise demo video, bottom half is controls + info
- **Exercise name** large and bold above the video
- **Timer/rep counter** as the central control element
- **"Next up" preview** shows what's coming after current exercise
- **Audio cues:** Trainer voice says exercise name, rep count, and motivational cues
- **Rest timer:** Full-screen countdown between exercises with calming animation
- **Modification options:** "Make it easier" / "Make it harder" buttons during exercise
- **Key insight:** The "next up" preview reduces anxiety about what's coming (directly addresses the coach's pacing concern).

### Apple Fitness+
- **Full-screen video** with trainer and two modifier trainers (easier/harder)
- **Burn Bar:** Shows how your effort compares to others who've done this workout
- **Activity rings** integration (Apple Watch required)
- **Countdown timer** prominent in top-right
- **Exercise name** bottom-left overlay
- **Key insight:** Fitness+ leans heavily on Apple Watch integration. MyWorkouts should NOT require a watch — phone camera is the sensor.

### Common Patterns Across All
1. Video is always the dominant element (50-80% of screen)
2. Exercise name and timer are always visible
3. "Next up" preview reduces anxiety
4. Audio cues are synchronized with video timestamps
5. Rest periods get their own dedicated UI state (not just a paused video)
6. Minimal touch targets during exercise (everything is large, thumb-friendly)

## Video Overlay UI Patterns

### Recommended Overlay Layout (Mobile Portrait)

```
┌─────────────────────────────┐
│ [◀ Back]    1/8 exercises   │  ← Header: back button, progress
│                             │
│                             │
│      ┌─────────────────┐    │
│      │                 │    │
│      │   Coach Video   │    │
│      │                 │    │
│      │                 │    │
│      └─────────────────┘    │
│                             │
│  ● Listening...        🎙   │  ← Voice indicator + mic toggle
│                             │
│  ┌─────────────────────┐    │
│  │  BICEP CURLS         │    │  ← Exercise name (large)
│  │  Set 2 of 3          │    │  ← Set counter
│  │  ████████░░░ 8/12    │    │  ← Rep progress bar
│  └─────────────────────┘    │
│                             │
│  Next: Tricep Dips (3x10)  │  ← Next exercise preview
│                             │
│  ◀◀  ▐▐ PAUSE  ▶▶  ⚡1.0x │  ← Controls: prev, pause, next, speed
│  ━━━━━━━━━●━━━━━━━━━━━━━━  │  ← Workout progress bar
└─────────────────────────────┘
```

### Key UI Decisions
- **Exercise name MUST be readable from 6+ feet away** (phone propped on bench/shelf)
- **Controls are large** (48pt+ touch targets) but secondary to video/info
- **Speed indicator** always visible — shows current pace (0.5x to 2.0x)
- **Voice indicator** subtle but visible — pulsing dot when listening

### Rest Timer State

```
┌─────────────────────────────┐
│                             │
│         REST                │
│                             │
│          :28                │  ← Large countdown timer
│                             │
│    Next: Shoulder Press     │
│    3 sets × 10 reps        │
│                             │
│    [Skip Rest]              │  ← Can tap OR say "skip"
│                             │
└─────────────────────────────┘
```

## Pacing Control UX

This is the **primary differentiator** per the coach's feedback.

### The Problem with Existing Apps
- "Play / Pause" is binary — no granularity
- Touching the screen while holding weights is dangerous/awkward
- No way to say "hold on, I need 5 more seconds on this one"
- Timer-based exercises force a pace that may not match the user

### Recommended Pacing Model

**Speed multiplier approach** (like video playback speed):
- Default: 1.0x (coach's intended pace)
- Range: 0.5x to 2.0x, in 0.25x increments
- Affects: video playback speed, timer countdown speed, rest timer length
- Does NOT affect: rep count (reps stay the same, just slower/faster)

**Voice commands for pacing:**
| Command | Effect |
|---------|--------|
| "Slower" / "Slow down" | -0.25x (min 0.5x) |
| "Faster" / "Speed up" | +0.25x (max 2.0x) |
| "Normal speed" | Reset to 1.0x |
| "Pause" / "Hold" | Freeze everything |
| "Resume" / "Go" | Continue at current speed |

**Visual speed indicator:**
- Always visible pill/badge showing current speed: `⚡ 0.75x`
- Color-coded: green (normal), yellow (slow), blue (fast)
- Tappable to open speed picker (for touch users)

### Pacing State Machine

```
         ┌──────────┐
    ┌───►│  Playing  │◄──── "resume" / "go"
    │    │ (speed X) │
    │    └────┬──────┘
    │         │ "pause" / "hold"
    │    ┌────▼──────┐
    │    │  Paused   │
    │    └────┬──────┘
    │         │ "resume"
    │    ┌────▼──────┐
    │    │  Playing  │
    │    │ (speed X) │──── "slower" → speed = max(0.5, X - 0.25)
    │    └────┬──────┘──── "faster" → speed = min(2.0, X + 0.25)
    │         │ exercise complete
    │    ┌────▼──────┐
    │    │  Resting  │──── rest timer counts down at speed X
    │    └────┬──────┘
    │         │ rest complete / "skip"
    └─────────┘
```

## Audio Cue Timing Patterns

### When to Speak (TTS Timing)
1. **Exercise transition:** "Next exercise: Bicep Curls. 3 sets of 12 reps." (spoken during rest period, ~3s before rest ends)
2. **Exercise start:** "Go!" or "Begin." (at moment exercise timer starts)
3. **Mid-exercise encouragement:** "Halfway there." (at 50% of reps/time)
4. **Rep countdown:** "3... 2... 1... Done!" (last 3 reps or 3 seconds)
5. **Rest start:** "Rest for 30 seconds." (immediately on rest start)
6. **Rest ending:** "Get ready... 5... 4... 3... 2... 1..." (last 5 seconds of rest)
7. **Workout complete:** "Great workout! You completed 8 exercises in 24 minutes."

### Audio Cue Rules
- **Never overlap** speech with speech — queue cues and skip if behind
- **Pause music volume** during speech (duck audio, not mute)
- **Keep cues short** — 2-8 words per cue during exercise, longer during rest
- **Use expo-speech (TTS)** for dynamic cues (rep counts, exercise names)
- **Pre-recorded audio** for fixed cues ("Go!", countdown beeps) — feels more polished
- **Speed-adjusted:** If pace is 0.75x, cues fire at 0.75x timing intervals

### Audio Cue Data Model
Each exercise has an `audio_cues` JSONB array:
```json
[
  { "timestamp": 0, "text": "Begin bicep curls", "type": "instruction" },
  { "timestamp": 15, "text": "Halfway there", "type": "encouragement" },
  { "timestamp": 25, "text": "Last 3 reps", "type": "countdown" },
  { "timestamp": 30, "text": "Done! Rest for 30 seconds", "type": "instruction" }
]
```
Timestamps are relative to exercise start (in seconds at 1.0x speed). The workout engine adjusts for current pace multiplier.
