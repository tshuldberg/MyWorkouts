# CLAUDE.md — MyWorkouts

## Overview
MyWorkouts is a personalized workout companion app with voice-first controls, an interactive body map for exercise discovery, coach-led video workouts, and form recording for coach review. Cross-platform (iOS, Android, Web) with a coach review portal.

## Stack
- **Monorepo:** Turborepo + pnpm workspaces
- **Mobile:** Expo SDK 52+ with Expo Router (file-based routing), NativeWind
- **Web:** Next.js 15 (App Router), Tailwind CSS
- **Coach Portal:** Next.js 15 (coach review dashboard)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **State:** Zustand
- **Body Map:** react-native-svg (mobile) + SVG (web)
- **Voice:** Web Speech API adapter + custom parser in `packages/shared/src/voice/`
- **Camera:** getUserMedia + MediaRecorder (web form recording)
- **Payments:** Stripe (web) + RevenueCat (mobile, planned)
- **Language:** TypeScript (strict mode everywhere)

## Key Commands
```bash
pnpm install              # Install all dependencies
pnpm build                # Build all packages and apps
pnpm dev                  # Dev servers for all apps
pnpm dev:mobile           # Expo dev server only
pnpm dev:web              # Next.js web app only
pnpm dev:coach            # Coach portal only
pnpm lint                 # Lint all packages
pnpm typecheck            # Type-check all packages
pnpm test                 # Run all tests
pnpm clean                # Clean all build artifacts
```

## Architecture

### Monorepo Structure
```
MyWorkouts/
├── apps/
│   ├── mobile/           # Expo — React Native (iOS + Android)
│   │   └── app/          # Expo Router (file-based routing)
│   ├── web/              # Next.js 15 — App Router
│   │   └── app/          # Next.js App Router pages
│   └── coach-portal/     # Next.js 15 — Coach dashboard (stub)
├── packages/
│   ├── shared/           # Cross-platform business logic
│   │   └── src/
│   │       ├── types/    # Shared TypeScript types & enums
│   │       ├── voice/    # Voice command parser (pause, resume, skip, record, etc.)
│   │       ├── workout/  # Workout engine (state machine, builder, plans)
│   │       ├── body-map/ # Muscle group data + exercise mappings
│   │       ├── exercise/ # Exercise store factory
│   │       ├── subscription/ # Pricing tiers, premium feature gates
│   │       ├── plan/     # Plan builder store, progress calculation
│   │       ├── progress/ # Streaks, volume tracking, PR detection
│   │       └── utils/    # Shared utilities
│   ├── ui/               # Shared UI components
│   ├── supabase/         # Database types, client config, migrations
│   └── config/           # Shared ESLint, TypeScript, Tailwind configs
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Package Dependency Graph
```
apps/mobile     → @myworkouts/shared, @myworkouts/supabase
apps/web        → @myworkouts/shared, @myworkouts/supabase, @myworkouts/ui
apps/coach-portal → @myworkouts/shared, @myworkouts/supabase
packages/ui     → (standalone, React)
packages/shared → (standalone, no deps)
packages/supabase → @supabase/supabase-js
packages/config → (standalone, config files only)
```

## Git Workflow
- **Branch naming:** `feature/<name>`, `fix/<name>`, `refactor/<name>`
- **Commit format:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)
- **Default branch:** `main`
- **Squash merge** to `main`

## File Ownership (Parallel Agent Work)
- `apps/mobile/` — Mobile agent
- `apps/web/` — Web agent
- `apps/coach-portal/` — Coach portal agent
- `packages/shared/` — Shared logic (coordinate changes)
- `packages/ui/` — UI agent
- `packages/supabase/` — Backend agent
- `packages/config/` — Config changes require coordination

## Agent Teams Strategy

When 2+ plans target this project with overlapping scope, use an Agent Team instead of parallel subagents. Custom agent definitions from `/Users/trey/Desktop/Apps/.claude/agents/` and `/Users/trey/Desktop/Apps/MyLife/.claude/agents/`:
- `plan-executor` -- Execute plan phases with testing and verification
- `test-writer` -- Write tests without modifying source code
- `docs-agent` -- Update documentation
- `reviewer` -- Read-only code review (uses Sonnet)

Agents working in different File Ownership Zones can run in parallel without conflicts. Agents sharing a zone must coordinate via the team task list.

## Web Routes
```
/                        — Landing page
/auth/sign-in            — Sign in
/auth/sign-up            — Sign up
/auth/forgot-password    — Forgot password
/auth/callback           — OAuth callback
/explore                 — Exercise library with body map filters
/exercise/[id]           — Exercise detail with mini body maps
/workouts                — Workout list
/workouts/builder        — Workout builder (create/edit)
/workout/[id]            — Workout player (voice, recording, timer)
/plans                   — Workout plan list
/plans/[id]              — Plan detail with progress
/plans/builder           — Plan builder (create/edit)
/recordings              — Form recording list (Premium)
/recordings/[id]         — Recording review with coach feedback
/progress                — Progress tracking (streaks, volume, PRs)
/profile                 — User profile
/pricing                 — Subscription pricing
/api/webhooks/stripe     — Stripe webhook handler
```

## Important Notes
- All packages use TypeScript strict mode
- The `packages/shared` library is platform-agnostic (no React, no DOM, no Node.js APIs)
- Supabase types in `packages/supabase/src/types.ts` are a placeholder — run `supabase gen types` to regenerate
- Supabase typed client resolves some tables to `never` — use `(supabase as any).from('table')` as a workaround until types are regenerated
- NativeWind v4 is used for mobile styling (Tailwind classes in React Native)
- The web app uses `@supabase/ssr` for server-side Supabase access
- Coach portal runs on port 3001 to avoid conflicts with the web app
- Form recording requires Premium subscription — gated via `useSubscriptionStore().isPremium()`
- Recordings stored in Supabase Storage `recordings` bucket with path pattern `{userId}/{sessionId}/{exerciseId}-{timestamp}.webm`
- 4 SQL migrations in `packages/supabase/migrations/` (schema, auth trigger, seed data, storage bucket)


## Writing Style
- Do not use em dashes in documents or writing.
