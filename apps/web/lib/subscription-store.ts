import { create } from 'zustand';
import {
  createSubscriptionStore,
  type SubscriptionStore,
} from '@myworkouts/shared';

export const useSubscriptionStore = create<SubscriptionStore>((set, get) =>
  createSubscriptionStore(set as (partial: Partial<SubscriptionStore>) => void, get),
);
