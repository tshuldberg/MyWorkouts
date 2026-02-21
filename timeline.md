# MyWorkouts — Timeline

## 2026-02-20 — Initial Scaffold
- Created Turborepo monorepo with pnpm workspaces
- Set up `apps/mobile` (Expo SDK 52, Expo Router, NativeWind, tab navigation)
- Set up `apps/web` (Next.js 15, App Router, Tailwind CSS, navigation)
- Set up `apps/coach-portal` (Next.js 15 stub with "Coming Soon" page)
- Created `packages/shared` with types, voice command parser, workout engine, body map data
- Created `packages/ui` with Button, Card, BodyMapPlaceholder components
- Created `packages/supabase` with client config, generated types placeholder, initial migration
- Created `packages/config` with shared TypeScript, ESLint, and Tailwind configs
- Initial migration includes all core tables: users, exercises, workouts, workout_sessions, form_recordings, workout_plans, subscriptions with RLS policies
- Added CLAUDE.md, README.md, timeline.md
