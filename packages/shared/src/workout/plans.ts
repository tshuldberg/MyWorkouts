import type {
  WorkoutPlan,
  WorkoutPlanWeek,
  WorkoutPlanDay,
} from '../types/index.js';

// ── Plan Consumer Store ──
// Used by clients (non-coaches) to browse, follow, and track plans.
// The PlanBuilderStore in ../plan/index.ts is for coaches creating plans.

export interface PlanConsumerState {
  plans: WorkoutPlan[];
  activePlan: WorkoutPlan | null;
  activePlanStartDate: string | null;
  loading: boolean;
}

export interface PlanConsumerActions {
  setPlans: (plans: WorkoutPlan[]) => void;
  setActivePlan: (plan: WorkoutPlan | null, startDate?: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export type PlanConsumerStore = PlanConsumerState & PlanConsumerActions;

export function createPlanConsumerStore(
  set: (partial: Partial<PlanConsumerStore> | ((s: PlanConsumerStore) => Partial<PlanConsumerStore>)) => void,
): PlanConsumerStore {
  return {
    plans: [],
    activePlan: null,
    activePlanStartDate: null,
    loading: true,

    setPlans: (plans) => set({ plans }),
    setActivePlan: (plan, startDate = null) =>
      set({ activePlan: plan, activePlanStartDate: startDate }),
    setLoading: (loading) => set({ loading }),
  };
}

/**
 * Get the schedule for a specific week number within a plan.
 */
export function getWeekSchedule(
  plan: WorkoutPlan,
  weekNumber: number,
): WorkoutPlanDay[] | null {
  const week = plan.weeks.find((w) => w.week_number === weekNumber);
  return week ? week.days : null;
}

/**
 * Determine which week and day the user is currently on based on their start date.
 */
export function getCurrentPlanPosition(
  plan: WorkoutPlan,
  startDate: string,
): { weekNumber: number; dayIndex: number; isComplete: boolean } {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { weekNumber: 1, dayIndex: 0, isComplete: false };
  }

  const weekIndex = Math.floor(diffDays / 7);
  const dayIndex = diffDays % 7;

  if (weekIndex >= plan.weeks.length) {
    return {
      weekNumber: plan.weeks.length,
      dayIndex: 6,
      isComplete: true,
    };
  }

  return {
    weekNumber: weekIndex + 1,
    dayIndex,
    isComplete: false,
  };
}

/**
 * Get the workout IDs for a given day in the plan relative to the start date.
 */
export function getTodaysWorkout(
  plan: WorkoutPlan,
  startDate: string,
): { workoutId: string | null; restDay: boolean; notes: string | null } {
  const pos = getCurrentPlanPosition(plan, startDate);
  const week = plan.weeks.find((w) => w.week_number === pos.weekNumber);
  if (!week) return { workoutId: null, restDay: true, notes: null };
  const day = week.days[pos.dayIndex];
  if (!day) return { workoutId: null, restDay: true, notes: null };
  return {
    workoutId: day.workout_id,
    restDay: day.rest_day,
    notes: day.notes,
  };
}

/**
 * Get all workout IDs referenced in a plan (for bulk-fetching titles).
 */
export function getAllPlanWorkoutIds(plan: WorkoutPlan): string[] {
  const ids = new Set<string>();
  for (const week of plan.weeks) {
    for (const day of week.days) {
      if (day.workout_id) ids.add(day.workout_id);
    }
  }
  return Array.from(ids);
}
