import assert from 'node:assert/strict';
import test from 'node:test';

import { fetchCurrentUser, logout } from '../src/lib/auth.ts';

const guest = {
  id: 'guest-identity-1',
  email: null,
  full_name: null,
  avatar_url: null,
  is_guest: true,
};

function installBrowserStorage() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { localStorage: storage },
  });
}

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

test('401 bootstraps one guest and the session is reused after refresh', async () => {
  installBrowserStorage();
  let meRequests = 0;
  let guestRequests = 0;
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    if (url.endsWith('/auth/me')) {
      meRequests += 1;
      return meRequests === 1 ? response({}, 401) : response(guest);
    }
    if (url.endsWith('/auth/guest')) {
      guestRequests += 1;
      assert.equal(init?.method, 'POST');
      assert.equal(init?.credentials, 'include');
      return response(guest, 200);
    }
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;

  assert.deepEqual(await fetchCurrentUser(), guest);
  assert.deepEqual(await fetchCurrentUser(), guest);
  assert.equal(guestRequests, 1);
  assert.equal(meRequests, 2);
});

test('concurrent session checks share one guest-creation request', async () => {
  installBrowserStorage();
  let guestRequests = 0;
  let releaseGuest: ((value: Response) => void) | undefined;
  const pendingGuest = new Promise<Response>((resolve) => {
    releaseGuest = resolve;
  });
  globalThis.fetch = (async (input) => {
    const url = String(input);
    if (url.endsWith('/auth/me')) return response({}, 401);
    if (url.endsWith('/auth/guest')) {
      guestRequests += 1;
      return pendingGuest;
    }
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;

  const first = fetchCurrentUser();
  const second = fetchCurrentUser();
  releaseGuest?.(response(guest));
  assert.deepEqual(await Promise.all([first, second]), [guest, guest]);
  assert.equal(guestRequests, 1);
});

test('logout restores guest access instead of leaving the app signed out', async () => {
  installBrowserStorage();
  const requests: string[] = [];
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    requests.push(`${init?.method || 'GET'} ${url}`);
    if (url.endsWith('/auth/logout')) return response({ status: 'signed_out' });
    if (url.endsWith('/auth/guest')) return response(guest);
    throw new Error(`Unexpected request: ${url}`);
  }) as typeof fetch;

  await logout();
  assert.match(requests[0], /POST .*\/auth\/logout$/);
  assert.match(requests[1], /POST .*\/auth\/guest$/);
});
