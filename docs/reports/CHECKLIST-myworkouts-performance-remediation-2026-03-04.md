# MyWorkouts Performance Remediation Checklist

**Date:** 2026-03-04
**Source:** `REPORT-myworkouts-function-performance-review-2026-03-04.md`
**Scope:** Resolve all P0 and P1 performance findings in priority order.

## P0 (In Order)

- [x] P0-1 `createCameraRecorder` ([apps/web/lib/camera-recorder.ts:40](/Users/trey/Desktop/Apps/MyLife/MyWorkouts/apps/web/lib/camera-recorder.ts:40))
  - Add chunk streaming hook and in-memory buffer cap for long recordings.
- [x] P0-2 `ensureUser` ([apps/web/lib/actions.ts:47](/Users/trey/Desktop/Apps/MyLife/MyWorkouts/apps/web/lib/actions.ts:47))
  - Remove repeated bootstrap overhead via idempotent seed + context reuse.
- [x] P0-3 `reducePlayer` ([packages/shared/src/workout/engine.ts:55](/Users/trey/Desktop/Apps/MyLife/MyWorkouts/packages/shared/src/workout/engine.ts:55))
  - Remove repeated group scans in hot reducer path with precomputed metadata.
- [x] P0-4 `uploadRecording` ([apps/web/lib/recording-upload.ts:13](/Users/trey/Desktop/Apps/MyLife/MyWorkouts/apps/web/lib/recording-upload.ts:13))
  - Revoke object URLs and prevent blob-url memory growth.
- [x] P0-5 `getWorkoutPlans` ([apps/web/lib/db/queries.ts:365](/Users/trey/Desktop/Apps/MyLife/MyWorkouts/apps/web/lib/db/queries.ts:365))
  - Add `workout_plans(coach_id, created_at DESC)` index support.
- [x] P0-6 `getActiveSubscription` ([apps/web/lib/db/queries.ts:544](/Users/trey/Desktop/Apps/MyLife/MyWorkouts/apps/web/lib/db/queries.ts:544))
  - Add `subscriptions(user_id, status)` index support.
- [x] P0-7 `getWeeklySummaries` ([packages/shared/src/progress/index.ts:206](/Users/trey/Desktop/Apps/MyLife/MyWorkouts/packages/shared/src/progress/index.ts:206))
  - Replace repeated per-week filters with single-pass weekly bucketing.
- [x] P0-8 `getFilteredExercises` ([packages/shared/src/exercise/store.ts:20](/Users/trey/Desktop/Apps/MyLife/MyWorkouts/packages/shared/src/exercise/store.ts:20))
  - Collapse multi-pass filtering and reduce repeated lowercase work.

## P1 (In Order)

- [x] P1-1 `getLocalUser`, `seedDefaultUser`
  - Switch to idempotent `INSERT OR IGNORE` bootstrap and local user memoization.
- [x] P1-2 Action layer context reuse
  - `fetchWorkouts`, `saveWorkout`, `fetchWorkoutSessions`, `startWorkoutSession`, `fetchFormRecordings`, `fetchWorkoutPlans`, `savePlan`, `fetchPlanSubscription`, `followPlan`, `unfollowPlan`, `fetchCurrentUser`, `updateProfile`, `fetchSubscriptionStatus`.
  - Use request-scoped DB/user context and reduce repeated `getDb`/seed checks.
- [x] P1-3 DB bootstrap and adapter hot path
  - `getRawDb`: add schema version gating for bootstrap.
  - `makeAdapter`: add prepared-statement cache.
- [x] P1-4 Query/index scaling fixes
  - `getExercises`: add index on `exercises(name)`.
  - `getAllWorkouts`: add index on `workouts(title)`.
  - `getWorkoutSessions`: add composite index on `(user_id, started_at DESC)`.
  - `getFormRecordings`: enforce LIMIT support and avoid unbounded reads.
  - `getPlanSubscription`: add composite unique index `(user_id, plan_id)`.
- [x] P1-5 Shared store and metrics optimizations
  - `createWorkoutBuilderStore`: reduce linear selection checks and full remaps where possible.
  - `calculateStreaks`: reduce repeated Date parsing.
  - `calculateVolume`: pre-aggregate structure and lighter inner loops.
  - `buildHistory`: avoid extra passes and keep sorted output efficient.
  - `createPlanBuilderStore`: reduce full nested structure cloning on single-day edits.

## Validation

- [ ] Run `pnpm -C MyWorkouts typecheck`
- [ ] Run `pnpm -C MyWorkouts test`
- [ ] Run function gate for changed logic (`pnpm gate:function:changed` from repo root)

Validation notes (current workspace state):
- `pnpm -C MyWorkouts typecheck` fails in `@myworkouts/web` due missing test/type dependencies and existing unrelated TS issues in test files/pages.
- `pnpm -C MyWorkouts test` fails because `vitest` is not available in app package scripts in this environment.
- `pnpm gate:function --standalone MyWorkouts` fails at lint stage because `apps/mobile` has no ESLint v9 flat config.
