# MyWorkouts Function Speed and Performance Review

**Date:** 2026-03-04
**Scope:** Top-level runtime functions in `packages/shared/src`, `apps/web/lib`, `apps/mobile/lib`, and `apps/coach-portal/lib`
**Functions Reviewed:** 137

## Priority Summary

| Priority | Count |
|---|---:|
| P0 | 8 |
| P1 | 27 |
| P2 | 14 |
| P3 | 88 |

## First 10 Optimization Actions

1. Remove repeated seed checks from `ensureUser` by switching to `INSERT OR IGNORE` bootstrap and request-scoped user cache.
2. Add missing DB indexes: `workout_plans(coach_id, created_at DESC)`, `subscriptions(user_id, status)`, `workout_sessions(user_id, started_at DESC)`, `plan_subscriptions(user_id, plan_id)`, `workouts(title)`, `exercises(name)`.
3. Refactor `reducePlayer` to use precomputed set-group maps instead of repeated scans.
4. Rewrite `getWeeklySummaries` into a single-pass weekly bucket aggregation.
5. Collapse `getFilteredExercises` into one pass and precompute lowercase searchable fields.
6. Add statement caching in `makeAdapter` for frequently executed SQL statements.
7. Rework `uploadRecording` to revoke object URLs and move to durable storage upload path.
8. Update `createCameraRecorder` to stream chunks incrementally instead of buffering whole recordings in memory.
9. Reduce full-tree cloning in `createPlanBuilderStore` and `createWorkoutBuilderStore` updates.
10. Cache hot computed values in progress functions (streak totals, total sets, formatted dates).

## Function-by-Function Review

| Function | Location | Speed Profile | Optimization Recommendation | Priority |
|---|---|---|---|---|
| `createClient` | `apps/coach-portal/lib/supabase/client.ts:3` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getLocalUser` | `apps/web/lib/local-auth.ts:17` | Repeated seed + select path for every auth read. | Memoize local user in process and use `INSERT OR IGNORE` bootstrap. | P1 |
| `localSignIn` | `apps/web/lib/local-auth.ts:46` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `localSignUp` | `apps/web/lib/local-auth.ts:56` | Queries by email then fallback lookup each call. | Directly return memoized local user in SQLite local mode. | P2 |
| `createInitialStatus` | `packages/shared/src/workout/index.ts:67` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `adjustSpeed` | `packages/shared/src/workout/index.ts:80` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `calculateProgress` | `packages/shared/src/workout/index.ts:91` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getPreferredMimeType` | `apps/web/lib/camera-recorder.ts:27` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `createCameraRecorder` | `apps/web/lib/camera-recorder.ts:40` | Long recordings accumulate chunks in memory until stop. | Stream chunks to storage/worker incrementally and cap in-memory buffer. | P0 |
| `ensureUser` | `apps/web/lib/actions.ts:47` | Extra DB round-trip each call (seed check + getDb). | Use `INSERT OR IGNORE` and memoize local user initialization per request/process. | P0 |
| `fetchExercises` | `apps/web/lib/actions.ts:55` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `fetchExerciseById` | `apps/web/lib/actions.ts:59` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `fetchExercisesByIds` | `apps/web/lib/actions.ts:63` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `fetchWorkouts` | `apps/web/lib/actions.ts:69` | Thin wrapper, but always pays ensureUser cost. | Resolve user once per request and pass through action chain. | P1 |
| `fetchAllWorkouts` | `apps/web/lib/actions.ts:74` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `fetchWorkoutById` | `apps/web/lib/actions.ts:78` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `fetchWorkoutTitles` | `apps/web/lib/actions.ts:82` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `saveWorkout` | `apps/web/lib/actions.ts:86` | Write path is DB-bound plus ensureUser overhead. | Reuse request-scoped DB/user context; avoid repeated `getDb()` calls in same action. | P1 |
| `fetchWorkoutSessions` | `apps/web/lib/actions.ts:111` | Thin wrapper, but always pays ensureUser cost. | Reuse request-scoped user context. | P1 |
| `startWorkoutSession` | `apps/web/lib/actions.ts:116` | Thin wrapper, but always pays ensureUser cost. | Reuse request-scoped user context. | P1 |
| `finishWorkoutSession` | `apps/web/lib/actions.ts:121` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `fetchFormRecordings` | `apps/web/lib/actions.ts:136` | Thin wrapper, but always pays ensureUser cost. | Reuse request-scoped user context. | P1 |
| `fetchFormRecordingById` | `apps/web/lib/actions.ts:141` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `saveFormRecording` | `apps/web/lib/actions.ts:145` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `removeFormRecording` | `apps/web/lib/actions.ts:155` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `fetchWorkoutPlans` | `apps/web/lib/actions.ts:161` | Two-step plan lookup plus ensureUser cost. | Cache user context and index `workout_plans(coach_id, created_at)`. | P1 |
| `fetchWorkoutPlanById` | `apps/web/lib/actions.ts:172` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `savePlan` | `apps/web/lib/actions.ts:176` | Write path is DB-bound plus ensureUser overhead. | Reuse request-scoped DB/user context. | P1 |
| `fetchPlanSubscription` | `apps/web/lib/actions.ts:198` | Thin wrapper, but always pays ensureUser cost. | Reuse request-scoped user context. | P1 |
| `followPlan` | `apps/web/lib/actions.ts:209` | Thin wrapper, but always pays ensureUser cost. | Reuse request-scoped user context. | P1 |
| `unfollowPlan` | `apps/web/lib/actions.ts:220` | Thin wrapper, but always pays ensureUser cost. | Reuse request-scoped user context. | P1 |
| `fetchCurrentUser` | `apps/web/lib/actions.ts:227` | Thin wrapper, but always pays ensureUser cost. | Reuse request-scoped user context. | P1 |
| `updateProfile` | `apps/web/lib/actions.ts:232` | Thin wrapper, but always pays ensureUser cost. | Reuse request-scoped user context. | P1 |
| `fetchSubscriptionStatus` | `apps/web/lib/actions.ts:240` | Thin wrapper, but always pays ensureUser cost. | Reuse request-scoped user context and index subscription lookup. | P1 |
| `loadExercisesWithFallback` | `apps/web/lib/exercises.ts:14` | Returns static pre-sorted array by reference. | Freeze array/items to prevent accidental mutation side-effects. | P3 |
| `findFallbackExercise` | `apps/web/lib/exercises.ts:18` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `estimateDuration` | `packages/shared/src/workout/builder.ts:40` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `toWorkoutPayload` | `packages/shared/src/workout/builder.ts:51` | Linear transform is fine, but invoked on save path. | No urgent change; keep linear map and avoid extra recompute before save. | P3 |
| `createWorkoutBuilderStore` | `packages/shared/src/workout/builder.ts:77` | Several actions clone full arrays; grouping checks use linear `includes`. | Use Set for selected indices during grouping and avoid full remap when possible. | P1 |
| `workoutsPath` | `apps/web/lib/routes.ts:6` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `calculatePlates` | `packages/shared/src/workout/plateCalculator.ts:22` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getSpeechRecognitionAPI` | `apps/web/lib/speech-recognition.ts:62` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `createWebSpeechAdapter` | `apps/web/lib/speech-recognition.ts:68` | Event-driven and lightweight, but restart loops can spin on noisy errors. | Add exponential backoff before restart after repeated errors. | P2 |
| `isSupabaseConfigured` | `apps/web/lib/supabase/server.ts:8` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `createClient` | `apps/web/lib/supabase/server.ts:39` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `createPlayerStatus` | `packages/shared/src/workout/engine.ts:24` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `reducePlayer` | `packages/shared/src/workout/engine.ts:55` | Hot reducer path; includes repeated `filter`/`findIndex` scans in group logic. | Precompute group membership/index maps in status for O(1) next/first lookup. | P0 |
| `playerProgress` | `packages/shared/src/workout/engine.ts:298` | Recomputes total sets via reduce each call. | Memoize total set count per workout and cache in status/store. | P2 |
| `formatTime` | `packages/shared/src/workout/engine.ts:306` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `updateSession` | `apps/web/lib/supabase/middleware.ts:4` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `createClient` | `apps/web/lib/supabase/client.ts:58` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `calculateWarmupSets` | `packages/shared/src/workout/warmupCalculator.ts:17` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `seedExerciseLibrary` | `apps/web/lib/db/seed.ts:4` | O(n) insert loop on first run only. | Use one prepared insert statement reused in loop; keep transactional batching. | P2 |
| `seedDefaultUser` | `apps/web/lib/db/seed.ts:40` | COUNT check on each call site is avoidable. | Replace COUNT + INSERT with `INSERT OR IGNORE` on primary key. | P1 |
| `getRawDb` | `apps/web/lib/database.ts:18` | Cold-start cost: schema/index loops and seeding checks. | Keep singleton, but gate seed/migration checks behind schema version and one-time flag. | P1 |
| `makeAdapter` | `apps/web/lib/database.ts:42` | Prepares SQL statements on every execute/query call. | Add prepared-statement cache for hot SQL to reduce parse overhead. | P1 |
| `getDb` | `apps/web/lib/database.ts:56` | Allocates fresh adapter object each call. | Cache adapter instance or inject adapter once per request. | P2 |
| `createPlanConsumerStore` | `packages/shared/src/workout/plans.ts:26` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getWeekSchedule` | `packages/shared/src/workout/plans.ts:45` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getCurrentPlanPosition` | `packages/shared/src/workout/plans.ts:56` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getTodaysWorkout` | `packages/shared/src/workout/plans.ts:90` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getAllPlanWorkoutIds` | `packages/shared/src/workout/plans.ts:109` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `uploadRecording` | `apps/web/lib/recording-upload.ts:13` | Creates blob URLs without revoke, causing memory growth. | Revoke object URLs when recordings are deleted/unmounted, and move to durable upload. | P0 |
| `getRecordingUrl` | `apps/web/lib/recording-upload.ts:41` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `deleteRecording` | `apps/web/lib/recording-upload.ts:48` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `parseJson` | `apps/web/lib/db/queries.ts:18` | JSON.parse in row mappers can dominate large list reads. | Avoid parsing fields that are not used on list pages, or add lazy parsing. | P2 |
| `generateId` | `apps/web/lib/db/queries.ts:27` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `rowToExercise` | `apps/web/lib/db/queries.ts:33` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getExercises` | `apps/web/lib/db/queries.ts:49` | Full-table read + sort by `name` (currently no `name` index). | Add index `exercises(name)` and support pagination for large catalogs. | P1 |
| `getExerciseById` | `apps/web/lib/db/queries.ts:55` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getExercisesByIds` | `apps/web/lib/db/queries.ts:66` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `rowToWorkout` | `apps/web/lib/db/queries.ts:82` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getWorkouts` | `apps/web/lib/db/queries.ts:96` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getAllWorkouts` | `apps/web/lib/db/queries.ts:108` | Full-table read + sort by `title` (currently no `title` index). | Add index `workouts(title)` and paginate. | P1 |
| `getWorkoutById` | `apps/web/lib/db/queries.ts:116` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getWorkoutTitles` | `apps/web/lib/db/queries.ts:127` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `createWorkout` | `apps/web/lib/db/queries.ts:144` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `updateWorkout` | `apps/web/lib/db/queries.ts:167` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `deleteWorkout` | `apps/web/lib/db/queries.ts:205` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `rowToSession` | `apps/web/lib/db/queries.ts:211` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getWorkoutSessions` | `apps/web/lib/db/queries.ts:230` | User-filtered read ordered by started time. | Add composite index `workout_sessions(user_id, started_at DESC)`. | P1 |
| `createWorkoutSession` | `apps/web/lib/db/queries.ts:242` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `completeWorkoutSession` | `apps/web/lib/db/queries.ts:255` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `rowToRecording` | `apps/web/lib/db/queries.ts:279` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getFormRecordings` | `apps/web/lib/db/queries.ts:292` | Join query is DB-bound and can grow with history size. | Ensure `form_recordings(session_id)` and add limit/pagination in caller. | P1 |
| `getFormRecordingById` | `apps/web/lib/db/queries.ts:308` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `createFormRecording` | `apps/web/lib/db/queries.ts:319` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `deleteFormRecording` | `apps/web/lib/db/queries.ts:348` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `rowToPlan` | `apps/web/lib/db/queries.ts:354` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getWorkoutPlans` | `apps/web/lib/db/queries.ts:365` | Coach-filtered read ordered by created_at without supporting composite index. | Add `workout_plans(coach_id, created_at DESC)` index. | P0 |
| `getWorkoutPlanById` | `apps/web/lib/db/queries.ts:377` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `createWorkoutPlan` | `apps/web/lib/db/queries.ts:388` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `updateWorkoutPlan` | `apps/web/lib/db/queries.ts:406` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getPlanSubscription` | `apps/web/lib/db/queries.ts:437` | Lookup by `(user_id, plan_id)` using separate indexes only. | Add composite unique index `(user_id, plan_id)` for faster point lookup. | P1 |
| `createPlanSubscription` | `apps/web/lib/db/queries.ts:449` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `deletePlanSubscription` | `apps/web/lib/db/queries.ts:460` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `rowToUser` | `apps/web/lib/db/queries.ts:473` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getUserById` | `apps/web/lib/db/queries.ts:485` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getUserByEmail` | `apps/web/lib/db/queries.ts:496` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `createUser` | `apps/web/lib/db/queries.ts:507` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `updateUser` | `apps/web/lib/db/queries.ts:520` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getActiveSubscription` | `apps/web/lib/db/queries.ts:544` | Lookup by `(user_id, status)` without index support. | Add index `subscriptions(user_id, status)`. | P0 |
| `calculateEpley1RM` | `packages/shared/src/workout/oneRM.ts:11` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `calculateBrzycki1RM` | `packages/shared/src/workout/oneRM.ts:21` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `calculate1RM` | `packages/shared/src/workout/oneRM.ts:32` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `formatDuration` | `packages/shared/src/utils/index.ts:1` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `formatDate` | `packages/shared/src/utils/index.ts:7` | Creates `toLocaleDateString` formatting each call. | Reuse a cached `Intl.DateTimeFormat` instance in hot list rendering. | P2 |
| `clamp` | `packages/shared/src/utils/index.ts:15` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `createAuthStore` | `packages/shared/src/auth/store.ts:19` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `parseVoiceCommand` | `packages/shared/src/voice/index.ts:33` | Linear phrase scan with `includes` over map entries. | Order phrases by specificity and precompile regex/trie if command volume grows. | P2 |
| `getSupportedCommands` | `packages/shared/src/voice/index.ts:49` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `slugToMuscleGroup` | `packages/shared/src/body-map/index.ts:70` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `muscleGroupToSlugs` | `packages/shared/src/body-map/index.ts:74` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `muscleGroupLabel` | `packages/shared/src/body-map/index.ts:78` | Linear `.find` over MUSCLE_GROUPS each call. | Use a precomputed `Map<MuscleGroup, label>`. | P2 |
| `buildHighlightData` | `packages/shared/src/body-map/index.ts:91` | Nested loops can emit duplicate slugs for overlapping groups. | Deduplicate with Set before emitting highlight data. | P2 |
| `getExercisesForMuscleGroup` | `packages/shared/src/body-map/index.ts:127` | Linear scan over exercise mappings each call. | Build index by muscle group once at module load. | P2 |
| `getMuscleGroupsByRegion` | `packages/shared/src/body-map/index.ts:133` | Linear filter per call. | Cache region buckets once if called in render loops. | P3 |
| `slugify` | `packages/shared/src/exercise/catalog.ts:15` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getDefaultExercises` | `packages/shared/src/exercise/catalog.ts:44` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `calculateStreaks` | `packages/shared/src/progress/index.ts:21` | Set + sort + repeated Date object creation. | Track epoch-day integers to avoid repeated Date parsing. | P1 |
| `calculateVolume` | `packages/shared/src/progress/index.ts:84` | Linear over sessions and completed exercises, expected but hot on large history. | Pre-aggregate per session when sessions are finalized; reuse cached totals. | P1 |
| `calculatePersonalRecords` | `packages/shared/src/progress/index.ts:138` | Linear scan with mutable map updates, generally efficient. | No structural change needed; optionally persist PR cache after session completion. | P2 |
| `getWeeklySummaries` | `packages/shared/src/progress/index.ts:206` | O(weekCount * sessions) due repeated `filter` and Date parsing per week. | Single-pass bucket sessions by ISO week, then read requested weeks. | P0 |
| `buildHistory` | `packages/shared/src/progress/index.ts:259` | filter -> sort -> map with nested filter per session. | Use one pass for completion stats before sort; paginate for long histories. | P1 |
| `calculateWeightPRs` | `packages/shared/src/progress/index.ts:299` | Linear map update, efficient for current use. | Keep as-is; ensure caller does not recompute on every render. | P3 |
| `isPremiumFeature` | `packages/shared/src/subscription/index.ts:48` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `canAccessFeature` | `packages/shared/src/subscription/index.ts:52` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `formatPrice` | `packages/shared/src/subscription/index.ts:62` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `createSubscriptionStore` | `packages/shared/src/subscription/index.ts:83` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getFilteredExercises` | `packages/shared/src/exercise/store.ts:20` | Three full passes with repeated lowercase conversions on each call. | Collapse into single pass and precompute lowercase name/description tokens. | P0 |
| `createExerciseStore` | `packages/shared/src/exercise/store.ts:45` | State updates copy arrays frequently, expected for immutable stores. | Use selector memoization in UI to avoid downstream rerenders. | P2 |
| `createEmptyWeek` | `packages/shared/src/plan/index.ts:26` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `buildWeeks` | `packages/shared/src/plan/index.ts:38` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `toPlanPayload` | `packages/shared/src/plan/index.ts:44` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `getPlanProgress` | `packages/shared/src/plan/index.ts:56` | Linear nested traversal on each call. | Cache total planned workouts and recompute completed count incrementally. | P2 |
| `getCurrentWeekDay` | `packages/shared/src/plan/index.ts:79` | O(1) or DB-bound single operation; no immediate hotspot detected. | Keep current implementation. Revisit only if profiling flags this path. | P3 |
| `createPlanBuilderStore` | `packages/shared/src/plan/index.ts:93` | Nested maps clone full week/day structures on single day edits. | Use targeted immutable update helpers to avoid full tree rebuilds. | P1 |
