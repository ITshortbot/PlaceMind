'use client';

// ============================================================================
// File: frontend/src/lib/auth.ts
// Description: Client-side helpers for signed HttpOnly Google and guest sessions.
// ============================================================================

import { useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_guest: boolean;
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

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === 'string' &&
    (typeof user.email === 'string' || user.email === null) &&
    (typeof user.full_name === 'string' || user.full_name === null) &&
    (typeof user.avatar_url === 'string' || user.avatar_url === null) &&
    typeof user.is_guest === 'boolean'
  );
}

async function createGuestSession(): Promise<AuthUser> {
  const response = await fetch(`${backendUrl()}/api/v1/auth/guest`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Guest session could not be established (${response.status}).`);
  }
  const value: unknown = await response.json();
  if (!isAuthUser(value)) {
    throw new Error('The backend returned an invalid session identity.');
  }
  reconcileStoredUser(value.id);
  return value;
}

async function fetchCurrentUserOnce(): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${backendUrl()}/api/v1/auth/me`, {
      credentials: 'include',
      cache: 'no-store',
    });
    if (response.status === 401) {
      return await createGuestSession();
    }
    if (!response.ok) return null;
    const value: unknown = await response.json();
    if (!isAuthUser(value)) return null;
    reconcileStoredUser(value.id);
    return value;
  } catch {
    return null;
  }
}

let currentUserRequest: Promise<AuthUser | null> | null = null;

export function fetchCurrentUser(): Promise<AuthUser | null> {
  if (currentUserRequest) return currentUserRequest;
  const request = fetchCurrentUserOnce();
  currentUserRequest = request;
  void request.then(() => {
    if (currentUserRequest === request) currentUserRequest = null;
  });
  return request;
}

export function loginWithGoogle() {
  window.location.href = `${backendUrl()}/api/v1/auth/google/login`;
}

export async function logout(): Promise<void> {
  currentUserRequest = null;
  const response = await fetch(`${backendUrl()}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Sign-out failed (${response.status}).`);
  }
  currentUserRequest = null;
  try {
    const guest = await createGuestSession();
    if (!guest.is_guest) throw new Error('A guest session was not established after sign-out.');
  } catch (error) {
    reconcileStoredUser(null);
    throw error;
  }
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

export function SessionBootstrap() {
  useEffect(() => {
    void fetchCurrentUser();
  }, []);
  return null;
}
