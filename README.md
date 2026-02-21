# MyWorkouts

Personalized workout companion with voice-first controls, interactive body map, coach-led video workouts, and form recording.

## Features

- **Interactive Body Map** — Tap muscle groups to discover targeted exercises
- **Voice Commands** — Hands-free workout control (pause, resume, faster, slower, skip)
- **Coach-Paced Video** — Professional workout videos with audio cues
- **Form Recording** — Camera records you during workouts for coach review
- **Workout Builder** — Create custom routines from the exercise library
- **Progress Tracking** — Workout history, streaks, volume tracking

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm |
| Mobile | Expo SDK 52 + Expo Router + NativeWind |
| Web | Next.js 15 (App Router) + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| State | Zustand |
| Payments | RevenueCat (mobile) + Stripe (web) |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- iOS Simulator or Android Emulator (for mobile)

### Setup

```bash
# Install dependencies
pnpm install

# Start all dev servers
pnpm dev

# Or start individually
pnpm dev:mobile    # Expo (mobile)
pnpm dev:web       # Next.js (web)
pnpm dev:coach     # Coach portal
```

### Environment Variables

Create `.env.local` files in each app with:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Project Structure

```
MyWorkouts/
├── apps/
│   ├── mobile/         # Expo React Native app
│   ├── web/            # Next.js web app
│   └── coach-portal/   # Coach review dashboard
├── packages/
│   ├── shared/         # Cross-platform business logic
│   ├── ui/             # Shared UI components
│   ├── supabase/       # Database client & migrations
│   └── config/         # Shared configs
└── turbo.json
```

## License

Private
