'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { WorkoutPlan, User, WorkoutSession } from '@myworkouts/shared';
import { createClient } from '@/lib/supabase/client';

interface DashboardData {
  clients: Pick<User, 'id' | 'display_name' | 'avatar_url'>[];
  plans: WorkoutPlan[];
  recentActivity: {
    clientName: string;
    clientId: string;
    workoutDate: string;
    exerciseCount: number;
  }[];
}

export default function CoachDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notCoach, setNotCoach] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/sign-in');
        return;
      }

      // Fetch coach's clients (users whose coach_id = this user)
      const { data: clients } = await (supabase as any)
        .from('users')
        .select('id, display_name, avatar_url')
        .eq('coach_id', user.id);

      const clientList = (clients ?? []) as Pick<User, 'id' | 'display_name' | 'avatar_url'>[];

      // If no clients and user has a coach_id themselves, they're not a coach
      if (clientList.length === 0) {
        const { data: profile } = await (supabase as any)
          .from('users')
          .select('coach_id')
          .eq('id', user.id)
          .single();
        if ((profile as any)?.coach_id) {
          setNotCoach(true);
          setLoading(false);
          return;
        }
      }

      // Fetch coach's plans
      const { data: plans } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch recent sessions from clients
      const recentActivity: DashboardData['recentActivity'] = [];
      if (clientList.length > 0) {
        const clientIds = clientList.map((c) => c.id);
        const { data: sessions } = await supabase
          .from('workout_sessions')
          .select('*')
          .in('user_id', clientIds)
          .order('started_at', { ascending: false })
          .limit(10);

        if (sessions) {
          const clientNameMap: Record<string, string> = {};
          for (const c of clientList) {
            clientNameMap[c.id] = c.display_name ?? 'Client';
          }

          for (const s of sessions as WorkoutSession[]) {
            if (s.completed_at) {
              recentActivity.push({
                clientName: clientNameMap[s.user_id] ?? 'Client',
                clientId: s.user_id,
                workoutDate: s.completed_at,
                exerciseCount: s.exercises_completed.filter((e) => !e.skipped).length,
              });
            }
          }
        }
      }

      setData({
        clients: clientList,
        plans: (plans ?? []) as WorkoutPlan[],
        recentActivity,
      });
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (notCoach) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-gray-500">This portal is for coaches only.</p>
        <p className="text-sm text-gray-400">
          You are currently assigned to a coach. Contact support if you believe this is an error.
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href="/clients"
          className="rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-200 hover:shadow-sm transition-all"
        >
          <div className="text-xs text-gray-500 mb-1">Active Clients</div>
          <div className="text-3xl font-bold text-gray-900">{data.clients.length}</div>
          <div className="text-xs text-gray-400 mt-1">View all clients</div>
        </Link>
        <Link
          href="/plans"
          className="rounded-xl border border-gray-200 bg-white p-5 hover:border-indigo-200 hover:shadow-sm transition-all"
        >
          <div className="text-xs text-gray-500 mb-1">Workout Plans</div>
          <div className="text-3xl font-bold text-gray-900">{data.plans.length}</div>
          <div className="text-xs text-gray-400 mt-1">Manage plans</div>
        </Link>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-xs text-gray-500 mb-1">Recent Sessions</div>
          <div className="text-3xl font-bold text-gray-900">{data.recentActivity.length}</div>
          <div className="text-xs text-gray-400 mt-1">Last 10 client workouts</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Client Activity */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Recent Client Activity</h2>
          {data.recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No client activity yet.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.recentActivity.slice(0, 5).map((activity, i) => (
                <Link
                  key={i}
                  href={`/clients/${activity.clientId}`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {activity.clientName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(activity.workoutDate).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {activity.exerciseCount} exercises
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Your Plans */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">Your Plans</h2>
            <Link
              href="/plans/new"
              className="text-xs text-indigo-500 hover:underline"
            >
              + New Plan
            </Link>
          </div>
          {data.plans.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">
              No plans created yet.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.plans.slice(0, 5).map((plan) => (
                <Link
                  key={plan.id}
                  href={`/plans/new?edit=${plan.id}`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{plan.title}</div>
                    <div className="text-xs text-gray-400">
                      {plan.weeks.length} weeks
                    </div>
                  </div>
                  {plan.is_premium && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      Premium
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
