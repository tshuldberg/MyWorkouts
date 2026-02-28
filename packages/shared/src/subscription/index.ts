import { SubscriptionPlan, SubscriptionStatus } from '../types/index';

export interface PricingTier {
  plan: SubscriptionPlan;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
}

export const PRICING: PricingTier[] = [
  {
    plan: SubscriptionPlan.Free,
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      'Interactive body map',
      'Exercise library',
      'Workout player with voice commands',
      'Workout builder',
      'Progress tracking',
    ],
  },
  {
    plan: SubscriptionPlan.Premium,
    name: 'Premium',
    monthlyPrice: 15,
    annualPrice: 120,
    features: [
      'Everything in Free',
      'Form recording during workouts',
      'Coach review & feedback',
      'Personalized workout plans',
      'Priority support',
    ],
  },
];

export const PREMIUM_FEATURES = [
  'form_recording',
  'coach_review',
  'personalized_plans',
] as const;

export type PremiumFeature = typeof PREMIUM_FEATURES[number];

export function isPremiumFeature(feature: string): feature is PremiumFeature {
  return PREMIUM_FEATURES.includes(feature as PremiumFeature);
}

export function canAccessFeature(
  subscriptionStatus: SubscriptionStatus | null,
  subscriptionPlan: SubscriptionPlan,
  feature: PremiumFeature
): boolean {
  if (!isPremiumFeature(feature)) return true;
  if (subscriptionPlan !== SubscriptionPlan.Premium) return false;
  return subscriptionStatus === SubscriptionStatus.Active || subscriptionStatus === SubscriptionStatus.Trialing;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export interface SubscriptionState {
  plan: SubscriptionPlan;
  status: SubscriptionStatus | null;
  expiresAt: string | null;
  isLoading: boolean;
}

export interface SubscriptionActions {
  setPlan: (plan: SubscriptionPlan) => void;
  setStatus: (status: SubscriptionStatus | null) => void;
  setExpiresAt: (expiresAt: string | null) => void;
  setLoading: (loading: boolean) => void;
  isPremium: () => boolean;
}

export type SubscriptionStore = SubscriptionState & SubscriptionActions;

export function createSubscriptionStore(
  set: (partial: Partial<SubscriptionStore>) => void,
  get: () => SubscriptionStore
): SubscriptionStore {
  return {
    plan: SubscriptionPlan.Free,
    status: null,
    expiresAt: null,
    isLoading: true,
    setPlan: (plan) => set({ plan }),
    setStatus: (status) => set({ status }),
    setExpiresAt: (expiresAt) => set({ expiresAt }),
    setLoading: (isLoading) => set({ isLoading }),
    isPremium: () => {
      const state = get();
      return (
        state.plan === SubscriptionPlan.Premium &&
        (state.status === SubscriptionStatus.Active || state.status === SubscriptionStatus.Trialing)
      );
    },
  };
}
