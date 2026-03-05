# MyWorkouts App Store Readiness Report

**Date:** 2026-03-03
**Review Team:** Technical Auditor, Maya Chen (Athlete Persona), James Porter (Businessman Persona)
**Scope:** Full codebase audit + user flow review for production readiness

---

## Executive Summary

**Overall Readiness Score: 4.5/10 (Not Ready for App Store)**

MyWorkouts is a well-architected functional prototype with several genuinely innovative features (interactive body map, voice-controlled workout player, camera PiP form recording, plate calculator). However, it is not production-ready. The app runs entirely in local-only mode with stub authentication, has zero business logic tests, no offline support, no payment integration, and critical runtime bugs.

**Standout Strengths:**
- Interactive body map for exercise discovery (best-in-class UX)
- Voice command integration during workouts (hands-free between sets)
- Superset/drop set/giant set/pyramid support in builder and player
- Camera PiP for form recording with timestamped coach feedback
- Smart rest timer with training-style presets (Hypertrophy/Strength/Power)
- Plate calculator with visual barbell rendering
- Progress photos with side-by-side comparison
- Well-designed RLS policies and Supabase schema

**Critical Blockers (must fix before any release):**
1. No real authentication (hardcoded local-user, all routes unprotected)
2. No offline mode (deal-breaker for gym use)
3. No payment integration (Stripe/RevenueCat are stubs)
4. Form recordings lost on page refresh (ephemeral blob URLs)
5. Zero business logic tests (entire shared package untested)

---

## 1. Technical Readiness

### 1.1 Supabase Integration

| Component | Status | Severity |
|-----------|--------|----------|
| Generated Types | Real types for 8 tables, enums, helper exports | **OK** |
| RLS Policies | Comprehensive, user + coach access patterns | **OK** |
| Auth Flow | Local-only stub, always succeeds, no real Supabase auth | **Critical** |
| Client Config | Returns stub client with empty data when env vars missing | **Critical** |
| Session Refresh | Code exists in middleware but root middleware bypasses it | **Critical** |
| OAuth | Google/Apple buttons present, redirect home without auth call | **Critical** |
| Server Actions | Hardcoded `local-user`, everyone is premium | **Critical** |

**Good news:** The Supabase types are properly generated (not stubs as the initial review suggested), and the RLS policies are production-quality with user isolation, coach cross-read access, and storage folder-based permissions.

**Bad news:** The entire auth layer is bypassed. The app runs as a single hardcoded user with automatic premium access. Session refresh code exists but is never called. No protected route guards exist anywhere.

### 1.2 Test Coverage

**Test-to-source ratio: ~12% (by file count)**

| Layer | Test Files | Source Files | Coverage |
|-------|-----------|-------------|----------|
| Web app (UI) | 7 | ~50 | 14% |
| Mobile app (UI) | 7 | ~40 | 18% |
| Coach portal (UI) | 4 | ~15 | 27% |
| Shared package (business logic) | **0** | **20** | **0%** |

**Untested critical business logic:**
- Workout engine state machine (10 action types, superset/group logic)
- Voice command parser (14 phrase mappings)
- Plan builder (progress calculation, week/day positioning)
- Progress tracking (streaks, volume, PRs, weekly summaries)
- 1RM calculators (Epley, Brzycki formulas)
- Plate calculator
- Subscription gate logic
- Exercise store filtering
- Body map slug mappings
- Auth store
- Database query layer
- Camera recorder
- Recording upload

### 1.3 Auth & Security

| Issue | Severity | Detail |
|-------|----------|--------|
| No real authentication | **Critical** | Hardcoded `local-user` identity |
| No protected routes | **Critical** | All routes accessible without auth |
| Session refresh bypassed | **Critical** | Middleware code exists but is skipped |
| Stripe webhook unvalidated | **Critical** | No signature verification, accepts any POST |
| No STRIPE_WEBHOOK_SECRET | **High** | Env var not referenced |
| No service role key in client | **OK** | Only anon key used (correct) |

### 1.4 Video Storage Architecture

**Current state:** Recordings use `getUserMedia` + `MediaRecorder` to capture webm/mp4, then store as `URL.createObjectURL(blob)`. These blob URLs are **ephemeral** and lost on page refresh.

**What exists but isn't connected:**
- Supabase Storage migration creates `recordings` bucket (100MB max, webm/mp4/quicktime)
- RLS policies for user upload, read, coach read, user delete
- Folder pattern: `{userId}/{sessionId}/{exerciseId}-{timestamp}.webm`

**What's missing:**
- No Supabase Storage upload call from the web app
- No video compression before upload
- No upload retry logic or progress indicator
- No offline video caching (IndexedDB, Cache API, or filesystem)
- No Google Drive content ingestion pipeline for trainer videos

### 1.5 Build & Deploy Readiness

| Component | Status | Severity |
|-----------|--------|----------|
| Expo app.json | Basic config present (name, slug, bundle ID) | **Medium** |
| Splash screen | Missing | **High** |
| App icon | Missing | **High** |
| eas.json | Missing | **High** |
| Assets directory | Missing | **High** |
| expo-updates | Not configured | **Medium** |
| vercel.json | Missing | **Medium** |
| Favicon/OG images | Missing | **Medium** |

### 1.6 Coach Portal

**Status: Functional but basic.** Dashboard, client list, client detail, plans list, new plan, and settings pages all exist with Supabase queries. 4 test files cover the UI layer.

**Missing:** No auth gate middleware. No recording review/feedback UI (the core premium feature). No video playback component for coach-side form review.

### 1.7 Performance Concerns

| Issue | Severity | Detail |
|-------|----------|--------|
| Workout player is 1063 lines | **Medium** | Single component, multiple useEffects, interval at 100ms |
| No list virtualization | **Medium** | Exercise, workout, recording lists load fully |
| Progress not memoized | **Medium** | Streak/volume/PR calculations run on every render |
| Sequential coach portal queries | **Low** | Could be parallelized |

### 1.8 Offline Capability

**Status: None.** No service worker, no IndexedDB, no Cache API, no workbox/next-pwa. The web app uses server-side SQLite (better-sqlite3, Node.js only). Mobile app has no AsyncStorage or expo-sqlite integration visible. Exercise data is fetched on every page load with no local cache.

---

## 2. User Experience Review: Maya Chen (Competitive Athlete)

**Persona:** 29, CrossFit competitor, coaches 3 classes/week, trains 5-6 days (Olympic lifts, powerlifting, metcons, gymnastics). Uses WODIFY/TrainHeroic/BTWB. Apple Watch user.

### Ratings

| Category | Score | Verdict |
|----------|-------|---------|
| Exercise Library | 2/5 | Great UX (body map), insufficient content (50 exercises, zero advanced) |
| Workout Builder | 3.5/5 | Advanced grouping is excellent, missing EMOM/AMRAP/For Time |
| Workout Player | 4/5 | Voice + camera + PR detection is impressive |
| Plans | 2/5 | Basic calendar, no periodization or progressive overload |
| Progress | 3/5 | Good foundation, missing volume trends and weight PRs |
| Form Recording | 3.5/5 | Full pipeline works, needs slow-mo and AI analysis |
| Body Tracking | 4/5 | Measurements + photos + comparison is solid |
| Tools | 4.5/5 | Plate calculator is excellent |
| Overall Polish | 2.5/5 | Many features scaffolded but not production-ready |

### Top Feature Requests

1. **EMOM/AMRAP/For Time workout types** -- dealbreaker for CrossFit athletes
2. **200+ exercises with advanced movements** -- Olympic lifts, gymnastics, strongman (currently 50, all beginner/intermediate)
3. **Progressive overload in plans** -- auto-increment weight/reps per week, periodization (linear, undulating, block)
4. **Percentage-based loading and RPE** -- "75% of 1RM", rate of perceived exertion per set
5. **Exercise videos** -- every page shows "Coach video coming soon"
6. **Apple Watch companion** -- wrist-based controls and heart rate display
7. **Custom exercise creation** -- add exercises not in catalog
8. **Equipment filter** -- barbell, dumbbell, kettlebell, machine, bodyweight, rings
9. **Tempo prescriptions** -- 3-1-2-0 eccentric-pause-concentric-pause notation
10. **AI-powered form analysis** -- "your knees are caving in on rep 4"

### Critical Bugs Found

- Exercise detail page crashes: `createClient()` called but not imported in `handleStartWorkout`
- Plan progress always shows 0%: `getPlanProgress` always passes empty `Set()` for completed IDs
- Template save silently fails: `.catch(() => {})` swallows all errors
- Voice parser too literal: "go to next exercise" doesn't match (only "next"/"skip")
- Workout state lost on page refresh: per-set weights/reps stored only in React state

### Strengths Maya Would Actually Use

- Body map exercise discovery ("better than most competing apps")
- Superset/drop set/giant set/pyramid builder with color-coded groups
- Voice commands during workouts (hands-free between sets)
- Camera PiP for form recording with timestamped coach feedback
- Plate calculator with visual barbell rendering
- Progress photos with side-by-side comparison
- Per-exercise strength history with SVG trend lines

---

## 3. User Experience Review: James Porter (Businessman)

**Persona:** 42, VP of Operations, works out 4 mornings/week at 5:30 AM, 45-min sessions, traditional bodybuilding splits. Uses Strong app. Gym has bad cell service.

### Ratings

| Category | Score | Verdict |
|----------|-------|---------|
| Onboarding | 4/10 | No guest mode, no personalization, no pre-built templates |
| Exercise Library | 7/10 | Body map is great, no favorites/recents |
| Workout Builder | 6/10 | Solid builder, empty-state is painful, templates broken |
| Workout Player | 8/10 | Best part of the app. Voice, rest timer, PRs, weight tracking |
| Plans | 3/10 | Coach-gated, no self-service, no repeating schedules |
| Progress | 5/10 | Good structure, missing weight trends, broken streak logic |
| Offline Mode | 0/10 | Non-existent. Deal-breaker. |
| Pricing | 4/10 | $15/mo too expensive for niche features. Free tier is solid. |

### Top Feature Requests

1. **Offline mode** -- non-negotiable for gym use with spotty connectivity
2. **Actual rep/weight logging per set** -- record what was actually done vs planned
3. **Self-service plans with repeat cycles** -- set up a 4-day split without needing a "coach"
4. **Favorites/recent exercises** -- reduce daily friction
5. **Pre-built templates** -- PPL, Upper/Lower, Bro Split starters
6. **Body weight tracking** -- fundamental fitness data
7. **Workout duplication** -- clone Monday's push day, tweak for Thursday
8. **Data export** -- portability matters after years of data
9. **Streak logic fix** -- should count training frequency, not consecutive calendar days
10. **Free trial for Premium** -- no "Try Premium for 7 days" option

### Critical UX Issues

- Nav bar has 10 items (Home, Explore, Workouts, Progress, Templates, Tools, Measurements, Photos, Social, Profile). Strong has 4. Overwhelming for casual users.
- "Start Workout" button on exercise detail page is broken (crashes)
- Template saving silently fails
- Speed controls for video playback permanently visible but no videos exist
- Streak calculation penalizes realistic 4-day/week schedules (rest days break streaks)
- Plans require premium AND coach role to create (self-directed users locked out)
- PR list capped at 5, no "show more"
- No in-app purchase flow (Upgrade button redirects to sign-in)

### What Would Make James Switch from Strong ($4.99/mo)

- Body map exercise discovery (genuinely better than list-based search)
- Voice commands during workouts (killer feature for hands-free mid-set)
- Rest timer presets by training style (shows the app understands lifters)
- PR detection during workouts (motivating)
- Per-exercise history with SVG charts and trend lines

---

## 4. Video Storage & Offline Strategy

### Trainer Video Content (Google Drive Ingest)

The trainer is providing content into Google Drive. Recommended architecture:

1. **Ingest Pipeline:** Cloud function (Supabase Edge Function or standalone) watches a Google Drive folder via Drive API, downloads new videos, transcodes via FFmpeg to HLS segments (multiple quality levels: 360p/720p/1080p), uploads to Supabase Storage or R2.
2. **Metadata Catalog:** Exercise table gets `video_url`, `video_duration`, `video_thumbnail_url` columns. Admin tool or Edge Function updates these when new videos land.
3. **Playback:** Use HLS.js (web) or expo-av (mobile) for adaptive streaming.

### User Form Recordings (Fix Current System)

1. **Immediate fix:** Replace `URL.createObjectURL(blob)` with Supabase Storage upload using the existing bucket/RLS policies. Show upload progress.
2. **Compression:** Use browser-side `VideoEncoder` API or ffmpeg.wasm to compress before upload.
3. **Retry:** Implement exponential backoff for failed uploads.

### Offline Video Playback

1. **Service Worker (Web):** Use workbox with a cache-first strategy for exercise videos. On "download for offline," prefetch all videos for a workout plan into Cache Storage.
2. **expo-file-system (Mobile):** Download videos to device filesystem. Track download state in SQLite.
3. **Offline Mode Toggle:** User-facing setting. When enabled, prompt to download video content for selected workouts/plans. Show storage usage and management UI.
4. **Offline Data Sync:** Queue workout session data in IndexedDB (web) or SQLite (mobile) when offline, sync to Supabase when connectivity returns.

### Storage Cost Estimate

| Content Type | Est. Size Per Unit | Volume | Monthly Storage |
|---|---|---|---|
| Trainer videos (720p, 1-2 min each) | ~15MB | 200 exercises | ~3GB |
| User form recordings (480p, 30-60s) | ~5MB | 100/user/month | Scales with users |

---

## 5. Feature Gap Analysis (Combined Personas)

### Both Personas Requested (Highest Priority)

| Feature | Maya (Athlete) | James (Businessman) | Impact |
|---------|----------------|---------------------|--------|
| Offline mode | Expected | **Deal-breaker** | Critical |
| Exercise videos | Expected | Expected | Critical |
| Favorites/recent exercises | Expected | **Deal-breaker** | High |
| Pre-built templates | Nice-to-have | **Deal-breaker** | High |
| Self-service plans (no coach required) | Expected | Expected | High |
| Body weight tracking | Expected | Expected | High |
| Data export | Expected | Expected | Medium |
| Onboarding personalization | Expected | Expected | Medium |
| Per-set notes | Expected | Nice-to-have | Medium |

### Athlete-Specific (Maya)

| Feature | Priority | Notes |
|---------|----------|-------|
| EMOM/AMRAP/For Time workout types | Critical | Dealbreaker for CrossFit |
| 200+ exercises with advanced movements | Critical | Only 50 currently, zero advanced |
| Progressive overload in plans | Critical | Auto-increment weight/reps per week |
| Percentage-based loading | High | "75% of 1RM" programming |
| RPE/RIR tracking | High | Rate of perceived exertion per set |
| Apple Watch companion | High | Wrist controls + heart rate |
| Equipment filter | High | Barbell, DB, KB, machine, etc. |
| Tempo prescriptions | Medium | 3-1-2-0 notation |
| Custom exercise creation | Medium | Add exercises not in catalog |
| AI form analysis | Medium | "Your knees are caving on rep 4" |

### Businessman-Specific (James)

| Feature | Priority | Notes |
|---------|----------|-------|
| Actual rep logging per set | Critical | Record what was done vs planned |
| Workout duplication | High | Clone and tweak workouts |
| Simplified navigation | High | 10 nav items is overwhelming |
| Streak logic fix | High | Count training frequency, not consecutive days |
| Free trial for Premium | High | No trial mechanism exists |
| Lower pricing or better value | Medium | $15/mo vs Strong's $4.99/mo |
| PR list expansion | Low | Capped at 5, no "show more" |

---

## 6. Prioritized Action Items

### P0: Critical (Must Fix Before Any Release)

1. **Implement real Supabase authentication** -- Connect sign-in/sign-up to Supabase Auth, enable OAuth (Google/Apple), implement session refresh by activating existing middleware code, add protected route guards.

2. **Add offline mode foundation** -- Service worker with workbox (web), expo-file-system (mobile), IndexedDB/SQLite queuing for offline workout sessions, sync-on-reconnect.

3. **Fix form recording persistence** -- Replace blob URLs with Supabase Storage uploads using existing bucket/RLS. Add compression, retry, and progress UI.

4. **Implement payment flow** -- Install Stripe SDK, build checkout session, validate webhook signatures, wire RevenueCat for mobile IAP.

5. **Fix runtime crashes** -- Exercise detail `createClient()` import, template save silent failure, plan progress always-0% bug.

6. **Persist workout state** -- Save per-set weight/rep data to localStorage or SQLite to survive page refresh mid-workout.

### P1: High (Required for Competitive Launch)

7. **Expand exercise catalog to 200+** -- Add Olympic lifts, advanced bodyweight, machine exercises, CrossFit movements. Add equipment filter and movement pattern tags. Include difficulty: advanced.

8. **Add exercise video content** -- Build ingest pipeline from Google Drive. HLS adaptive streaming. Offline download capability.

9. **Write business logic tests** -- Cover workout engine, voice parser, progress tracking, plan builder, 1RM calculators, plate calculator, subscription gates. Target 80% coverage on shared package.

10. **Self-service plans** -- Remove coach-only gate for plan creation. Add repeating/cycling plans. Add "Start Today's Workout" button.

11. **Add favorites and recent exercises** -- Reduce daily friction for returning users.

12. **Add pre-built workout templates** -- PPL, Upper/Lower, Bro Split, Full Body starters.

13. **Implement actual rep/weight logging** -- Let users record what they actually did per set vs planned target.

14. **Build Expo app assets** -- App icon, splash screen, eas.json, OTA update config.

15. **Fix streak logic** -- Count training frequency (workouts per week) not consecutive calendar days.

### P2: Medium (Post-Launch Enhancements)

16. **Add EMOM/AMRAP/For Time workout types** -- Critical for CrossFit audience
17. **Progressive overload in plans** -- Auto-increment weight/reps per week
18. **Simplify navigation** -- Reduce from 10 to 5-6 items, hide unshipped features
19. **Body weight tracking** -- Add to progress dashboard
20. **Onboarding questionnaire** -- Training level, goals, weight unit, frequency
21. **RPE/percentage-based loading** -- For serious strength programming
22. **Workout duplication** -- Clone and tweak from workouts list
23. **Data export** -- CSV/JSON export for portability
24. **Coach portal recording review** -- Video playback + feedback UI
25. **Refactor workout player** -- Break 1063-line component into smaller pieces
26. **Add list virtualization** -- For exercise, workout, recording lists

### P3: Low (Future Roadmap)

27. **Apple Watch companion** -- Wrist controls, heart rate integration
28. **AI form analysis** -- Computer vision for form feedback
29. **Equipment filter** -- Barbell, dumbbell, kettlebell, machine, bodyweight
30. **Tempo prescriptions** -- Eccentric/concentric timing notation
31. **Custom exercise creation** -- User-defined exercises
32. **Free trial mechanism** -- 7-day Premium trial
33. **Social features** -- Complete workout sharing, followers
34. **Data import** -- From Strong, TrainHeroic, WODIFY (CSV)
35. **Pricing review** -- $15/mo may be too high for feature set vs competitors

---

## 7. Competitive Position

| Feature | MyWorkouts | Strong ($4.99/mo) | TrainHeroic ($12.99/mo) | Fitbod ($12.99/mo) |
|---------|------------|------|-------------|------|
| Body map exercise discovery | Best-in-class | No | No | No |
| Voice commands | Yes | No | No | No |
| Form recording + coach feedback | Yes (Premium) | No | Yes | No |
| Plate calculator | Excellent | No | No | No |
| Progress photos + comparison | Yes | No | No | No |
| Offline mode | **No** | Yes | Yes | Yes |
| Exercise library size | 50 | 1000+ | 1000+ | 1000+ |
| Exercise videos | **None** | No | Yes | Yes |
| EMOM/AMRAP support | **No** | No | Yes | No |
| Apple Watch | **No** | Yes | Yes | Yes |
| Pre-built templates | **No** | Yes | Yes | Yes (AI-generated) |
| Progressive overload programming | **No** | Manual | Yes | Yes (AI) |
| Rep logging per set | **No** | Yes | Yes | Yes |

**Competitive advantage:** Body map, voice commands, form recording pipeline, and plate calculator are genuine differentiators that no single competitor offers together. But the gaps in fundamentals (offline, exercise library, videos, rep logging) prevent competing on daily usability.

---

## 8. Recommended Timeline

| Phase | Duration | Focus | Exit Criteria |
|-------|----------|-------|---------------|
| **Alpha Fix** | 3-4 weeks | P0 items 1-6: Auth, offline foundation, recording fix, payments, crash fixes, state persistence | Real users can sign in, pay, and complete a workout without data loss |
| **Content Build** | 2-3 weeks | P1 items 7-8: Exercise catalog expansion to 200+, video ingest pipeline from Google Drive, offline video caching | All exercises have descriptions, 50+ have video, offline playback works |
| **Test & Polish** | 2-3 weeks | P1 items 9-15: Business logic tests, self-service plans, favorites, templates, rep logging, app assets, streak fix | 80% shared package test coverage, no known crashes, Expo build succeeds |
| **Beta** | 2-4 weeks | TestFlight/internal testing with real users (Maya and James archetypes), iterate on feedback | Both personas can complete their primary workflows end-to-end |
| **Launch Prep** | 1-2 weeks | App Store screenshots, description, privacy policy, review submission | App Store submission |

**Estimated total: 10-16 weeks to App Store submission**

---

## Appendix: Files Referenced

### Critical Fix Targets
- `apps/web/middleware.ts` -- Bypass all auth (line: passes through)
- `apps/web/lib/local-auth.ts` -- Hardcoded LOCAL_USER_ID
- `apps/web/lib/actions.ts` -- ensureUser() always returns local-user
- `apps/web/app/exercise/[id]/page.tsx` -- Broken createClient() import
- `apps/web/app/workouts/builder/page.tsx` -- Silent template save failure
- `apps/web/lib/recording-upload.ts` -- Ephemeral blob URLs
- `apps/web/app/api/webhooks/stripe/route.ts` -- Unvalidated webhook
- `packages/shared/src/plan/index.ts` -- getPlanProgress always 0%
- `packages/shared/src/progress/index.ts` -- Streak uses calendar days

### High-Value Test Targets
- `packages/shared/src/workout/engine.ts` -- State machine reducer
- `packages/shared/src/voice/index.ts` -- Voice command parser
- `packages/shared/src/progress/index.ts` -- Streaks, volume, PRs
- `packages/shared/src/workout/oneRM.ts` -- 1RM calculators
- `packages/shared/src/workout/plateCalculator.ts` -- Plate math
- `packages/shared/src/subscription/index.ts` -- Feature gates
- `packages/shared/src/plan/index.ts` -- Plan progress/positioning

### Architecture Docs
- `packages/supabase/migrations/` -- 4 SQL migrations
- `packages/shared/src/exercise/catalog.ts` -- Exercise catalog (50 entries)
- `apps/web/lib/supabase/middleware.ts` -- Session refresh (exists, unused)
