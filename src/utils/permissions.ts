/**
 * Which screens the signed-in caller reaches.
 *
 * <b>The role map is gone.</b> This file used to hold `role → navIds`, which gave the panel a
 * second, independent opinion about who may see what — one that could drift from the server's
 * without anything noticing, because a hidden nav item is not a permission. The server now sends
 * the list (`/me`.navigation), resolved from the same permission matrix that answers the
 * endpoints, so what is on screen and what is allowed cannot disagree.
 *
 * These helpers therefore take the list rather than a role. It comes from `useAuth()`.
 */

/** Whether the caller reaches this screen. */
export function canAccess(allowedNavIds: readonly string[], navId: string): boolean {
  return allowedNavIds.includes(navId);
}

/**
 * Hiding a screen is presentation, not protection.
 *
 * Every screen behind these ids is enforced server-side as well: somebody who types the URL of a
 * screen they lack the permission for gets a 403 from the API that screen calls, not an empty
 * page. Stated here because "the button is hidden" is the exact reasoning that produces an
 * unprotected endpoint.
 */
export const NAVIGATION_IS_PRESENTATION_ONLY = true;
