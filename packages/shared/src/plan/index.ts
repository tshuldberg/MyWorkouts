import type { WorkoutPlan, WorkoutPlanWeek, WorkoutPlanDay } from '../types/index.js';

export interface PlanBuilderState {
  title: string;
  weekCount: number;
  weeks: WorkoutPlanWeek[];
  isEditing: boolean;
  editingPlanId: string | null;
}

export interface PlanBuilderActions {
  setTitle: (title: string) => void;
  setWeekCount: (count: number) => void;
  setDayWorkout: (weekIndex: number, dayIndex: number, workoutId: string | null) => void;
  setDayNotes: (weekIndex: number, dayIndex: number, notes: string | null) => void;
  toggleRestDay: (weekIndex: number, dayIndex: number) => void;
  loadPlan: (plan: WorkoutPlan) => void;
  reset: () => void;
}

export type PlanBuilderStore = PlanBuilderState & PlanBuilderActions;

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export { DAY_NAMES };

function createEmptyWeek(weekNumber: number): WorkoutPlanWeek {
  return {
    week_number: weekNumber,
    days: Array.from({ length: 7 }, (_, i) => ({
      day_number: i + 1,
      workout_id: null,
      rest_day: i >= 5, // Saturday and Sunday default to rest
      notes: null,
    })),
  };
}

function buildWeeks(count: number, existing: WorkoutPlanWeek[]): WorkoutPlanWeek[] {
  return Array.from({ length: count }, (_, i) =>
    existing[i] ?? createEmptyWeek(i + 1)
  );
}

export function toPlanPayload(
  state: PlanBuilderState,
  coachId: string,
): Omit<WorkoutPlan, 'id' | 'created_at'> {
  return {
    title: state.title,
    coach_id: coachId,
    weeks: state.weeks,
    is_premium: true,
  };
}

export function getPlanProgress(
  plan: WorkoutPlan,
  completedWorkoutIds: Set<string>,
): { completed: number; total: number; percent: number } {
  let total = 0;
  let completed = 0;
  for (const week of plan.weeks) {
    for (const day of week.days) {
      if (!day.rest_day && day.workout_id) {
        total++;
        if (completedWorkoutIds.has(day.workout_id)) {
          completed++;
        }
      }
    }
  }
  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function getCurrentWeekDay(
  plan: WorkoutPlan,
  startDate: Date,
): { weekIndex: number; dayIndex: number } | null {
  const now = new Date();
  const diffMs = now.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return null;
  const weekIndex = Math.floor(diffDays / 7);
  const dayIndex = diffDays % 7;
  if (weekIndex >= plan.weeks.length) return null;
  return { weekIndex, dayIndex };
}

export function createPlanBuilderStore(
  set: (partial: Partial<PlanBuilderStore> | ((s: PlanBuilderStore) => Partial<PlanBuilderStore>)) => void,
): PlanBuilderStore {
  return {
    title: '',
    weekCount: 4,
    weeks: buildWeeks(4, []),
    isEditing: false,
    editingPlanId: null,

    setTitle: (title) => set({ title }),

    setWeekCount: (count) =>
      set((s) => ({
        weekCount: count,
        weeks: buildWeeks(count, s.weeks),
      })),

    setDayWorkout: (weekIndex, dayIndex, workoutId) =>
      set((s) => ({
        weeks: s.weeks.map((w, wi) =>
          wi === weekIndex
            ? {
                ...w,
                days: w.days.map((d, di) =>
                  di === dayIndex ? { ...d, workout_id: workoutId, rest_day: false } : d
                ),
              }
            : w
        ),
      })),

    setDayNotes: (weekIndex, dayIndex, notes) =>
      set((s) => ({
        weeks: s.weeks.map((w, wi) =>
          wi === weekIndex
            ? {
                ...w,
                days: w.days.map((d, di) =>
                  di === dayIndex ? { ...d, notes } : d
                ),
              }
            : w
        ),
      })),

    toggleRestDay: (weekIndex, dayIndex) =>
      set((s) => ({
        weeks: s.weeks.map((w, wi) =>
          wi === weekIndex
            ? {
                ...w,
                days: w.days.map((d, di) =>
                  di === dayIndex
                    ? { ...d, rest_day: !d.rest_day, workout_id: d.rest_day ? d.workout_id : null }
                    : d
                ),
              }
            : w
        ),
      })),

    loadPlan: (plan) =>
      set({
        title: plan.title,
        weekCount: plan.weeks.length,
        weeks: plan.weeks,
        isEditing: true,
        editingPlanId: plan.id,
      }),

    reset: () =>
      set({
        title: '',
        weekCount: 4,
        weeks: buildWeeks(4, []),
        isEditing: false,
        editingPlanId: null,
      }),
  };
}
