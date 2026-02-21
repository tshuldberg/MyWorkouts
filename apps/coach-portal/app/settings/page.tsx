'use client';

import { useEffect, useState } from 'react';
import type { User } from '@myworkouts/shared';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }

      const { data: profile } = await (supabase as any)
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) setUser(profile as User);

      const { count } = await (supabase as any)
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', authUser.id);

      setClientCount(count ?? 0);
      setLoading(false);
    })();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Profile Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 mb-4">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Coach Profile</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Name</span>
            <span className="text-sm font-medium text-gray-900">
              {user?.display_name ?? 'Not set'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-medium text-gray-900">
              {user?.email}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Active Clients</span>
            <span className="text-sm font-medium text-gray-900">
              {clientCount}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Account Created</span>
            <span className="text-sm font-medium text-gray-900">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Account</h2>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
