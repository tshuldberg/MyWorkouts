# CLAUDE.md — MyWorkouts

## Overview
MyWorkouts is a personalized workout companion app with voice-first controls, an interactive body map for exercise discovery, coach-led video workouts, and form recording for coach review. Cross-platform (iOS, Android, Web) with a coach review portal.

## Stack
- **Monorepo:** Turborepo + pnpm workspaces
- **Mobile:** Expo SDK 52+ with Expo Router (file-based routing), NativeWind
- **Web:** Next.js 15 (App Router), Tailwind CSS
- **Coach Portal:** Next.js 15 (stub)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **State:** Zustand
- **Body Map:** react-native-svg (mobile) + SVG (web)
- **Voice:** Custom parser in `packages/shared/src/voice/`
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
│   │       ├── voice/    # Voice command parser
│   │       ├── workout/  # Workout engine (timers, sets, reps)
│   │       ├── body-map/ # Muscle group data + exercise mappings
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

## Important Notes
- All packages use TypeScript strict mode
- The `packages/shared` library is platform-agnostic (no React, no DOM, no Node.js APIs)
- Supabase types in `packages/supabase/src/types.ts` are a placeholder — run `supabase gen types` to regenerate
- NativeWind v4 is used for mobile styling (Tailwind classes in React Native)
- The web app uses `@supabase/ssr` for server-side Supabase access
- Coach portal runs on port 3001 to avoid conflicts with the web app
