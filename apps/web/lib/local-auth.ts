import { getDb } from './database';
import { getUserById, getUserByEmail, createUser, seedDefaultUser } from './db';

const LOCAL_USER_ID = 'local-user';

export interface LocalUser {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

/**
 * Get the current local user. In SQLite mode there is always a single local
 * user. We auto-create them on first access.
 */
export function getLocalUser(): LocalUser {
  const db = getDb();
  seedDefaultUser(db);
  const user = getUserById(db, LOCAL_USER_ID);
  if (!user) {
    // Should not happen after seedDefaultUser, but guard anyway
    const id = createUser(db, {
      id: LOCAL_USER_ID,
      email: 'user@myworkouts.local',
      display_name: 'Local User',
    });
    return {
      id,
      email: 'user@myworkouts.local',
      display_name: 'Local User',
      avatar_url: null,
    };
  }
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
  };
}

/**
 * Simulate sign-in: always succeeds in local mode and returns the local user.
 */
export function localSignIn(
  _email: string,
  _password: string,
): { user: LocalUser; error: null } {
  return { user: getLocalUser(), error: null };
}

/**
 * Simulate sign-up: creates or returns the local user.
 */
export function localSignUp(
  email: string,
  _password: string,
  displayName?: string,
): { user: LocalUser; error: null } {
  const db = getDb();
  let user = getUserByEmail(db, email);
  if (!user) {
    seedDefaultUser(db);
    user = getUserById(db, LOCAL_USER_ID)!;
  }
  return {
    user: {
      id: user.id,
      email: user.email,
      display_name: displayName ?? user.display_name,
      avatar_url: user.avatar_url,
    },
    error: null,
  };
}
