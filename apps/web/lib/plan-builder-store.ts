import { create } from 'zustand';
import { createPlanBuilderStore, type PlanBuilderStore } from '@myworkouts/shared';

export const usePlanBuilderStore = create<PlanBuilderStore>((set) =>
  createPlanBuilderStore(set as any)
);
