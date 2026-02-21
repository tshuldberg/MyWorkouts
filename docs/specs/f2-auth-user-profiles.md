# F2: Auth + User Profiles — Feature Spec

> **Date:** 2026-02-20
> **Status:** Ready for Implementation
> **Dependencies:** F1 (scaffold)

## Overview
User authentication via Supabase Auth with email/password and social providers (Google, Apple). Includes user profile management, onboarding flow for new users, and auth state management shared across all platforms.

## Supabase Auth Configuration

### Providers
- **Email/Password:** Default, with email confirmation enabled
- **Google OAuth:** Via Supabase dashboard (Google Cloud Console client ID)
- **Sign in with Apple:** Via Supabase dashboard (Apple Developer account)

### Settings
- Email confirmation: Required
- Password minimum: 8 characters
- Session duration: 7 days (refresh token rotates)
- Rate limiting: Supabase defaults (max 5 sign-ups per hour per IP)

## Screen Flows

### Sign Up Flow
```
Welcome Screen → [Email Sign Up] → Email + Password + Display Name
                                  → Email Confirmation Sent
                                  → Confirm Link Clicked → Onboarding
              → [Continue with Google] → OAuth Flow → Onboarding (if new)
              → [Sign in with Apple]   → OAuth Flow → Onboarding (if new)
              → [Already have account?] → Sign In
```

### Sign In Flow
```
Sign In Screen → [Email Sign In] → Email + Password → Home (Explore tab)
               → [Continue with Google] → OAuth Flow → Home
               → [Sign in with Apple]   → OAuth Flow → Home
               → [Forgot Password?] → Forgot Password Flow
```

### Forgot Password Flow
```
Forgot Password → Enter Email → "Reset link sent" confirmation
              → Email link → Reset Password screen → New Password × 2 → Sign In
```

### Onboarding Flow (New Users Only)
```
Step 1: "What's your fitness goal?"
        → [ ] Build Strength  [ ] Lose Weight  [ ] Improve Mobility
        → [ ] General Fitness [ ] Sport-Specific
        (multi-select, stored in user profile preferences)

Step 2: "What's your experience level?"
        → Beginner / Intermediate / Advanced
        (sets default difficulty filter)

Step 3: "Welcome to MyWorkouts!" — quick tour overlay
        → Highlights body map, workout player, voice commands
        → [Get Started] → Home (Explore tab)
```

## Screen Layouts

### Welcome Screen (Unauthenticated Landing)
```
┌─────────────────────────────┐
│                             │
│       MyWorkouts Logo       │
│                             │
│   Your personal workout     │
│   companion with voice      │
│   control                   │
│                             │
│  [Continue with Apple    ]  │  ← Apple first on iOS
│  [Continue with Google   ]  │
│                             │
│  ─── or ───                 │
│                             │
│  [Sign Up with Email     ]  │
│                             │
│  Already have an account?   │
│  [Sign In]                  │
│                             │
└─────────────────────────────┘
```

### Sign Up Screen
```
┌─────────────────────────────┐
│  [◀ Back]   Create Account  │
│                             │
│  Display Name               │
│  ┌─────────────────────┐    │
│  │                     │    │
│  └─────────────────────┘    │
│                             │
│  Email                      │
│  ┌─────────────────────┐    │
│  │                     │    │
│  └─────────────────────┘    │
│                             │
│  Password                   │
│  ┌─────────────────────┐    │
│  │                👁    │    │  ← Toggle visibility
│  └─────────────────────┘    │
│  8+ characters              │
│                             │
│  [Create Account         ]  │
│                             │
│  By signing up you agree    │
│  to our Terms & Privacy     │
└─────────────────────────────┘
```

### Profile Screen
```
┌─────────────────────────────┐
│  Profile              [Edit]│
│                             │
│         [Avatar]            │
│       Display Name          │
│       email@example.com     │
│                             │
│  ┌─────────────────────┐    │
│  │ Fitness Goals        ▶ │  │
│  │ Experience Level     ▶ │  │
│  │ Notification Prefs   ▶ │  │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ Subscription: Free   ▶ │  │  ← Links to paywall (F9)
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │ Sign Out             │  │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

## Profile Fields

| Field | Type | Required | Editable | Source |
|-------|------|----------|----------|--------|
| id | uuid | Yes | No | Supabase Auth |
| email | string | Yes | No | Supabase Auth |
| display_name | string | Yes | Yes | Sign up / profile edit |
| avatar_url | string | No | Yes | Upload or OAuth provider |
| subscription_tier | enum | Yes | No | Subscription system (F9) |
| coach_id | uuid | No | No | Coach assignment (F10) |
| fitness_goals | string[] | No | Yes | Onboarding / profile |
| experience_level | enum | No | Yes | Onboarding / profile |
| created_at | timestamp | Yes | No | Auto |

## Auth State Management

### Zustand Store (`packages/shared`)
```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
}
```

### Supabase Client Setup
- **Mobile:** `@supabase/supabase-js` with `AsyncStorage` adapter for session persistence
- **Web:** `@supabase/ssr` for server-side session handling in Next.js
- Both use the same Supabase project URL and anon key (from env vars)

### Protected Routes
- **Mobile (Expo Router):** Auth guard in root layout — redirect to welcome if no session
- **Web (Next.js):** Middleware checks session cookie, redirects to `/login` if missing
- **Coach Portal:** Same pattern, additionally checks `user.role === 'coach'`

## Supabase RLS Policies

```sql
-- Users can read their own profile
CREATE POLICY "Users read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Coaches can read their clients' profiles
CREATE POLICY "Coaches read client profiles" ON users
  FOR SELECT USING (auth.uid() = coach_id);
```

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only, never in client
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```
