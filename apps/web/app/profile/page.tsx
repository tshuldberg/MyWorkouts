import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from './sign-out-button';
import { ProfileForm } from './profile-form';

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single() as { data: UserProfile | null };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <SignOutButton />
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <ProfileForm
          email={user.email ?? ''}
          displayName={profile?.display_name ?? user.user_metadata?.display_name ?? ''}
          avatarUrl={profile?.avatar_url ?? ''}
        />
      </div>
    </div>
  );
}
