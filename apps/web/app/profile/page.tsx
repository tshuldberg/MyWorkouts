import { fetchCurrentUser } from '../../lib/actions';
import { SignOutButton } from './sign-out-button';
import { ProfileForm } from './profile-form';

export default async function ProfilePage() {
  const user = await fetchCurrentUser();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <SignOutButton />
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <ProfileForm
          email={user?.email ?? 'local@myworkouts.app'}
          displayName={user?.display_name ?? 'Local User'}
          avatarUrl={user?.avatar_url ?? ''}
        />
      </div>
    </div>
  );
}
