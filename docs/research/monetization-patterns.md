# Monetization Patterns Research

> **Date:** 2026-02-20
> **Purpose:** Inform F9 (Subscription + Payments) implementation

## What Fitness Apps Gate Behind Premium

### Industry Standard Free vs. Premium Split

| Feature | Typical Tier | MyWorkouts |
|---------|-------------|------------|
| Exercise library / browse | Free | Free |
| Body map / muscle explorer | Free | Free |
| Basic workout player | Free | Free |
| Workout history | Free | Free |
| Custom workout creation | Free or Premium | Free |
| Voice commands | Premium (rare feature) | Free (differentiator) |
| Form recording | Premium | Premium |
| Coach review / feedback | Premium | Premium |
| Personalized plans | Premium | Premium |
| Progress analytics (detailed) | Premium | Free (basic), Premium (advanced) |
| Ad-free experience | Premium | N/A (no ads) |
| Offline downloads | Premium | Future consideration |

### Key Insight
**Voice commands should be FREE** — this is the #1 differentiator. Gating it behind premium would undercut the core value proposition. Instead, gate the coach-human interaction features (recording, feedback, personalized plans) which have inherent per-user cost.

## Paywall Screen Best Practices

### Timing (When to Show)
1. **Soft paywall at natural upgrade moments:**
   - User taps "Record Form" for the first time
   - User tries to access coach feedback
   - User browses personalized plans
   - After completing 5+ free workouts (engaged user)
2. **Never on first launch** — let users experience value first
3. **Never interrupting a workout** — show after workout completion

### Layout Pattern (High-Converting)

```
┌─────────────────────────────┐
│           [X close]          │
│                              │
│    🏋️ Unlock Your Full      │
│       Potential              │
│                              │
│  ┌────────────────────────┐  │
│  │ ✓ Record your form     │  │
│  │ ✓ Get coach feedback   │  │
│  │ ✓ Personalized plans   │  │
│  │ ✓ Advanced analytics   │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  Annual (Best Value)   │  │
│  │  $10/mo billed yearly  │◄─── Pre-selected
│  │  Save 33%              │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │  Monthly               │  │
│  │  $15/mo                │  │
│  └────────────────────────┘  │
│                              │
│  [Start 7-Day Free Trial]   │  ← Primary CTA
│                              │
│  Restore Purchase            │
│  Terms · Privacy             │
└─────────────────────────────┘
```

### Conversion Best Practices
- **Pre-select annual plan** — 70%+ of fitness app revenue comes from annual
- **Show savings** ("Save 33%") on annual vs. monthly
- **7-day free trial** — industry standard, highest conversion for fitness
- **Social proof** if available (ratings, number of users)
- **Dismissible** — always let users close without subscribing
- **Restore purchase** — required by Apple/Google

## RevenueCat + Stripe Cross-Platform Integration

### Architecture

```
                    ┌──────────────┐
                    │   Supabase   │
                    │ subscriptions│
                    │    table     │
                    └──────┬───────┘
                           │ webhook updates
              ┌────────────┼────────────┐
              │            │            │
     ┌────────▼───┐  ┌────▼─────┐  ┌──▼──────────┐
     │ RevenueCat │  │ Stripe   │  │  Supabase   │
     │  (mobile)  │  │  (web)   │  │  Edge Fn    │
     └────────────┘  └──────────┘  │  (webhooks) │
                                   └─────────────┘
```

### RevenueCat (iOS + Android)
- **SDK:** `react-native-purchases` (Expo compatible with config plugin)
- Handles Apple App Store + Google Play subscriptions
- Server-side receipt validation
- Manages trial periods, grace periods, billing retry
- Webhook to Supabase Edge Function on subscription change

### Stripe (Web)
- **SDK:** `@stripe/stripe-js` + `@stripe/react-stripe-js`
- Stripe Checkout for subscription creation
- Customer Portal for subscription management
- Webhook to Supabase Edge Function on subscription change

### Subscription Sync Flow
1. User subscribes via RevenueCat (mobile) or Stripe (web)
2. Provider webhook fires to Supabase Edge Function
3. Edge Function upserts `subscriptions` table row
4. App reads subscription status from Supabase on auth
5. Premium feature gating checks `user.subscription_tier`

### Pricing
- **Monthly:** $15/mo
- **Annual:** $120/yr ($10/mo effective) — 33% savings
- **Trial:** 7-day free trial on both plans
- **Apple/Google cut:** 30% first year, 15% after (STPC)
- **Stripe cut:** 2.9% + $0.30 per transaction

### Key Implementation Notes
- RevenueCat and Stripe track the SAME user via Supabase `user.id`
- A user who subscribes on iOS and later uses web should see premium on both
- The `subscriptions` table is the source of truth, updated by webhooks
- Edge Function validates webhook signatures before updating
- Grace period: keep premium for 3 days after expiry (billing retry window)
