'use client';

// ============================================================================
// File: frontend/src/lib/auth.ts
// Description: Client-side session helpers for the real Google sign-in.
//   The session itself is an HttpOnly cookie issued by the backend; this
//   module only asks the backend who is signed in. Nothing here stores or
//   reads credentials in the browser.
// ============================================================================

import { useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

const SESSION_USER_KEY = 'placemind.sessionUser';
const PLACEMIND_PREFIX = 'placemind.';

/**
 * Browser convenience data (profile, active resume, chat caches, ...) is
 * scoped to the signed-in account: when the account behind this browser
 * changes - or vanishes on sign-out - every placemind.* key is cleared so one
 * Google user's data never leaks into another user's session on a shared
 * browser.
 */
function reconcileStoredUser(userId: string | null) {
  try {
    const previous = window.localStorage.getItem(SESSION_USER_KEY);
    if (previous !== userId) {
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith(PLACEMIND_PREFIX) && k !== SESSION_USER_KEY)
        .forEach((k) => window.localStorage.removeItem(k));
    }
    if (userId) {
      window.localStorage.setItem(SESSION_USER_KEY, userId);
    } else {
      window.localStorage.removeItem(SESSION_USER_KEY);
    }
  } catch {
    // storage unavailable - nothing to scope
  }
}

const backendUrl = () =>
  (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${backendUrl()}/api/v1/auth/me`, { credentials: 'include' });
    const user = res.ok ? ((await res.json()) as AuthUser) : null;
    reconcileStoredUser(user ? user.id : null);
    return user;
  } catch {
    return null;
  }
}

export function loginWithGoogle() {
  window.location.href = `${backendUrl()}/api/v1/auth/google/login`;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${backendUrl()}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // Network failure: the cookie remains, but the UI still navigates away.
  }
  // Sign-out also drops this browser's convenience data for the account.
  reconcileStoredUser(null);
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

/**
 * Client-only hook: loading=true during SSR/first paint, then resolves to the
 * signed-in account (or null). Use for auth gates and returning-user CTAs
 * without hydration mismatches.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });
  useEffect(() => {
    let live = true;
    fetchCurrentUser().then((user) => {
      if (live) setState({ user, loading: false });
    });
    return () => {
      live = false;
    };
  }, []);
  return state;
}
