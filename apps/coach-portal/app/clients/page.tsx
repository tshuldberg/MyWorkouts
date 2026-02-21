'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

interface ClientRow {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
  last_workout: string | null;
  total_sessions: number;
  plan_title: string | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch clients assigned to this coach
      const { data: users } = await supabase
        .from('users')
        .select('id, display_name, email, avatar_url, created_at')
        .eq('coach_id', user.id)
        .order('display_name');

      if (!users || users.length === 0) {
        setClients([]);
        setLoading(false);
        return;
      }

      // Enrich with session data
      const enriched: ClientRow[] = await Promise.all(
        (users as any[]).map(async (u: any) => {
          const { data: sessions } = await supabase
            .from('workout_sessions')
            .select('started_at')
            .eq('user_id', u.id)
            .order('started_at', { ascending: false })
            .limit(1);

          const { count } = await supabase
            .from('workout_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', u.id);

          // Check if following a plan
          const { data: planSub } = await (supabase as any)
            .from('plan_subscriptions')
            .select('plan_id')
            .eq('user_id', u.id)
            .limit(1);

          let planTitle: string | null = null;
          if (planSub && planSub.length > 0) {
            const { data: plan } = await supabase
              .from('workout_plans')
              .select('title')
              .eq('id', (planSub[0] as { plan_id: string }).plan_id)
              .single();
            planTitle = (plan as any)?.title ?? null;
          }

          return {
            ...u,
            last_workout: (sessions as any)?.[0]?.started_at ?? null,
            total_sessions: count ?? 0,
            plan_title: planTitle,
          };
        }),
      );

      setClients(enriched);
      setLoading(false);
    }
    load();
  }, []);

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function getInitials(name: string | null, email: string): string {
    if (name) return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    return email[0].toUpperCase();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-40 rounded bg-gray-200" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <p className="mt-1 text-sm text-gray-500">
          {clients.length} active client{clients.length !== 1 ? 's' : ''}
        </p>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">No clients assigned yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Clients will appear here when they set you as their coach.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {client.avatar_url ? (
                  <img src={client.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  getInitials(client.display_name, client.email)
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {client.display_name || client.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{client.total_sessions} workout{client.total_sessions !== 1 ? 's' : ''}</span>
                  {client.last_workout && (
                    <span>Last: {formatDate(client.last_workout)}</span>
                  )}
                </div>
              </div>

              {client.plan_title && (
                <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                  {client.plan_title}
                </div>
              )}

              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
