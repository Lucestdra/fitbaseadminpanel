/**
 * Where the public legal documents live.
 *
 * <b>Built from the API base URL, not from the panel's own origin.</b> The documents are served by
 * the API — they need the deployment's configured company identity, which no static bundle has —
 * and in development the panel runs on a different port. Hard-coding `/gizlilik` would open the
 * Expo dev server's 404 page instead of the notice somebody is being asked to accept.
 *
 * These are the URLs Meta Business Verification and App Review are given, so they must be
 * reachable without a session and without JavaScript. They are.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export const LEGAL_URLS = {
  privacy: `${BASE_URL}/gizlilik`,
  terms: `${BASE_URL}/kosullar`,
  kvkkNotice: `${BASE_URL}/kvkk`,
} as const;
