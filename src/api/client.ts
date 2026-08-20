import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './schema';
import { ApiError, toProblem } from './problem';
import {
  CLIENT_KIND,
  clearTokens,
  getAccessToken,
  readRefreshHandle,
  setAccessToken,
  storeRefreshHandle,
} from './tokens';

/**
 * Where the API is.
 *
 * `EXPO_PUBLIC_` because it has to be readable in the bundle — it is a URL, not a secret.
 *
 * <b>The empty default is a development convenience, not the production value.</b> It was the
 * production value while the panel and the API shared one origin behind Caddy; the deployment now
 * splits them across sibling subdomains, so a bundle built without this set aims every request at
 * the panel's own host. The refresh cookie is unaffected — sibling subdomains are different origins
 * but the same site, and `SameSite=Lax` is a site-level rule — so what the split costs is a base URL
 * here and a CORS policy on the API, not ADR-0019's cookie design.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

/** Paths where a 401 is the answer rather than a reason to refresh. */
const AUTH_PATHS = ['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/logout'];

/** Called when a session ends underneath a request. Set by the auth context. */
let onSessionLost: () => void = () => {};

export function setSessionLostHandler(handler: () => void): void {
  onSessionLost = handler;
}

/**
 * The in-flight refresh, if any.
 *
 * <b>Single-flight, and it is not an optimisation.</b> ADR-0024 gives the server no grace window:
 * a refresh handle is consumed the moment it is exchanged, and presenting a consumed handle is
 * treated as theft and revokes the whole session. Two screens refreshing at once would therefore
 * sign the user out and report a compromise — so every caller awaits the same promise, and only
 * one handle is ever presented.
 */
let refreshing: Promise<boolean> | null = null;

const authMiddleware: Middleware = {
  onRequest({ request }) {
    const token = getAccessToken();

    if (token && !request.headers.has('Authorization')) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }

    return request;
  },
};

const client = createClient<paths>({
  baseUrl: BASE_URL,

  // So the refresh cookie is sent on web. Cross-origin in both environments now — the panel and the
  // API are sibling subdomains in production and different localhost ports in development — and in
  // both cases still the same *site*, so the SameSite=Lax cookie travels. What makes it actually
  // arrive is the API's CORS policy allowing credentials for this origin.
  credentials: 'include',
});

client.use(authMiddleware);

export { client };

/**
 * Exchanges the refresh handle for a new pair. At most one runs at a time.
 *
 * @returns whether a usable access token is now held.
 */
export async function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const handle = await readRefreshHandle();

      // Web sends nothing: the handle is in a cookie it cannot read, and the server reads it from
      // there. Native sends what it stored. A native client with no handle has no session to
      // resume, so there is nothing to try.
      if (CLIENT_KIND === 'Native' && handle === null) {
        return false;
      }

      const { data, error, response } = await client.POST('/api/v1/auth/refresh', {
        body: { refreshHandle: handle },
      });

      if (error || !data?.accessToken) {
        // Includes `auth.refresh_reuse_detected`, where the session has already been revoked
        // server-side. Nothing to salvage either way.
        await clearTokens();
        return response.ok;
      }

      setAccessToken(data.accessToken);
      await storeRefreshHandle(data.refreshHandle ?? null);
      return true;
    } catch {
      // A network failure is not a dead session. The tokens are left alone so the next attempt can
      // succeed; the caller sees the original 401 and decides.
      return false;
    } finally {
      refreshing = null;
    }
  })();

  return refreshing;
}

/**
 * Runs a call, refreshing once and retrying if the access token had expired.
 *
 * Wrapping rather than middleware, deliberately: a retry inside `onResponse` has to re-send a
 * Request whose body has already been consumed, and the clone-and-stash dance that makes that work
 * is more machinery than re-invoking the caller's own closure.
 *
 * Retries exactly once. A loop here would turn a permanently-refused call into an infinite one,
 * and the second 401 means the refresh did not help — which is a dead session, not a slow one.
 */
export async function withAuth<T>(
  run: () => Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  let result = await run();

  if (result.response.status === 401 && !isAuthPath(result.response.url)) {
    if (await refreshSession()) {
      result = await run();
    }
  }

  if (result.error !== undefined || !result.response.ok) {
    const problem = toProblem(result.response.status, result.error);

    // 401 after a retry means the session is gone: the handle was rejected, the session was
    // revoked, or the permission version moved and the refresh could not catch up. The app has to
    // return to sign-in, and doing it here means no screen has to remember to.
    if (result.response.status === 401) {
      await clearTokens();
      onSessionLost();
    }

    throw new ApiError(problem);
  }

  return result.data as T;
}

function isAuthPath(url: string): boolean {
  return AUTH_PATHS.some((path) => url.includes(path));
}

export { ApiError } from './problem';
export type { Problem } from './problem';
export { ProblemCode, describeProblem } from './problem';
export { CLIENT_KIND, clearTokens, getAccessToken, setAccessToken, storeRefreshHandle } from './tokens';
