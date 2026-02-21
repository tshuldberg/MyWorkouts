# MyWorkouts — Timeline

## 2026-02-21 — Feature Build Sprint (11/11 features complete)

### F2: Auth + User Profiles (`8d6e6e0`)
- Supabase Auth with email/password (sign-in, sign-up, forgot password)
- Auth middleware for protected routes on web and mobile
- User profile page (web) and screen (mobile) with display name, avatar
- Supabase RLS policies for users table

### F9: Subscription + Payments (`763180b`)
- Pricing tiers (Free/Premium) with shared `PRICING` config
- Stripe webhook handler for web (`/api/webhooks/stripe`)
- Subscription store (Zustand, cross-platform) with `isPremium()` gate
- Premium feature access control (`canAccessFeature`)
- Pricing pages on web and mobile

### F3: Exercise Library + Body Map (`42aba15`)
- Interactive SVG body map (web: react-body-highlighter, mobile: react-native-body-highlighter)
- Muscle group highlight/filter system with slug-to-enum mapping
- Exercise detail pages with mini body maps showing targeted muscles
- Explore page with category pills, search, body map multi-select filtering
- Supabase seed migration with 50 exercises across 7 categories

### F6: Workout Builder (`ff6fc5b`)
- Workout builder page with exercise picker modal, search, reordering
- Sets/reps/duration/rest controls per exercise
- Edit mode (load existing workout)
- Zustand store for builder state
- Duration estimator utility

### F4: Workout Player (`8b68bd6`)
- Reducer-based state machine (idle/playing/paused/rest/completed)
- Tick loop with speed-adjusted timing (0.5x-2.0x)
- Web player with progress bar, rest overlay, transport controls
- Mobile player with same functionality via NativeWind
- Session saving on completion

### F5: Voice Command System (`81b7622`)
- Web Speech API adapter with continuous listening, auto-restart
- Voice command integration into workout player (pause/resume/skip/speed)
- Transcript feedback indicator, voice command logging

### F7: Form Recording (`4586641`)
- Camera recorder adapter (getUserMedia + MediaRecorder)
- PiP camera preview overlay in workout player
- Start/stop recording (UI + voice commands), premium gate
- Supabase Storage upload with signed URLs, RLS policies
- Recordings list page and review page with video playback
- Coach feedback timeline with timestamp-seeking
- Storage bucket migration (`00004_storage_recordings.sql`)

### F8: Progress Tracking (`620e3dd`)
- Progress tracking page with streaks, volume, PRs, history
- Shared progress utilities in `packages/shared/src/progress/`

### F11: Personalized Workout Plans (`6058bb6`)
- Plan builder with weekly grid, workout picker per day
- Plan consumer store with follow/unfollow, current position tracking
- Plan list and detail pages (web + mobile) with premium gating
- Coach plan creation UI in coach portal
- `plan_subscriptions` table migration with RLS

### F10: Coach Review Portal (`35597f6`, `790babc`)
- Coach dashboard with stat cards (active clients, plans, recent sessions)
- Client list page with enriched data (session count, last workout, active plan)
- Client detail page with workout history, form recordings, and coach feedback
- Inline feedback submission form for timestamped coaching notes
- Coach role detection (not-a-coach guard)
- Settings page with profile info and sign out

**Final stats:** 98 files changed, 11,466 insertions, 53 deletions across 13 commits.

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
