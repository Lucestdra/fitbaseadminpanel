import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Which half of the token pair this platform is responsible for.
 *
 * Web sends `Web` and the server replies with a `HttpOnly; Secure; SameSite=Lax` cookie scoped to
 * `/api/v1/auth` (ADR-0019). The handle never enters JavaScript, so there is nothing here to
 * store and nothing a cross-site script could read. Native has no cookie jar and gets the handle
 * in the response body instead, which is why it is an opaque 32-byte string rather than a JWT —
 * SecureStore's Android backing store starts failing above roughly 2 KB.
 */
export const CLIENT_KIND = Platform.OS === 'web' ? 'Web' : 'Native';

const REFRESH_KEY = 'fitbase.refresh';

/**
 * The access token, in memory only.
 *
 * Never persisted, on either platform. It lives fifteen minutes, so persisting it would save one
 * refresh call on a cold start — and would put a live bearer credential somewhere that survives
 * the process, which on web means anything that can run script in the page and on native means
 * anything that can read app storage. The refresh handle is the thing designed to be stored, and
 * it is stored in the one place per platform designed for it.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * Stores the refresh handle. A no-op on web, where the cookie is the storage.
 *
 * The server returns `refreshHandle: null` to web clients precisely so that a handle cannot end up
 * in both the cookie and script's reach — which would undo what `HttpOnly` was for. Writing that
 * null here would clear a handle native still needs, so the guard is on the platform rather than
 * on the value.
 */
export async function storeRefreshHandle(handle: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  if (handle === null) {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    return;
  }

  await SecureStore.setItemAsync(REFRESH_KEY, handle, {
    // iOS only — the option has no effect on Android, where the keystore's own protection applies.
    // Where it does apply it says: readable only while the device is unlocked, and never restored
    // onto different hardware from a backup. A refresh handle resumes a session, so it should not
    // survive a restore onto a phone that is not the one it was issued to.
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function readRefreshHandle(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    // A keychain read can fail on a device whose secure enclave state changed — a restore onto new
    // hardware, a biometric reset. Treated as "no session", which sends the person to sign in
    // rather than to a crash they cannot act on.
    return null;
  }
}

/** Forgets everything this client holds. Called on sign-out and on a refusal that ends a session. */
export async function clearTokens(): Promise<void> {
  accessToken = null;
  await storeRefreshHandle(null);
}
