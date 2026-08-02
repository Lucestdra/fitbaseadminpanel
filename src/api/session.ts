import { CLIENT_KIND, client, setAccessToken, storeRefreshHandle, withAuth } from './client';
import { ApiError, toProblem } from './problem';
import type { components } from './schema';

export type MeResponse = components['schemas']['MeResponse'];
export type AuthenticationResponse = components['schemas']['AuthenticationResponse'];
export type InvitationPreview = components['schemas']['InvitationPreview'];
export type StaffRole = components['schemas']['StaffRole'];

/**
 * Stores what a sign-in returned.
 *
 * The access token goes to memory; the refresh handle goes to SecureStore on native and is
 * `null` on web, where the server put it in a cookie this code cannot see. Both halves in one
 * place so a new sign-in path cannot accidentally keep one and drop the other.
 */
function adopt(tokens: AuthenticationResponse): void {
  setAccessToken(tokens.accessToken);
  void storeRefreshHandle(tokens.refreshHandle ?? null);
}

/**
 * Registers a studio and its owner.
 *
 * <b>Answers 202 whether or not the address is already registered</b>, so this resolves either
 * way and the screen says "check your mail" either way. That is deliberate on the server's part —
 * a different answer would turn the form into a directory of who has an account — and the client
 * must not undo it by, say, probing first.
 */
export async function register(input: {
  organizationName: string;
  fullName: string;
  email: string;
  password: string;
  acceptedKvkkNotice: boolean;
}): Promise<void> {
  const { error, response } = await client.POST('/api/v1/auth/register', { body: input });

  if (!response.ok) {
    throw new ApiError(toProblem(response.status, error));
  }
}

export async function verifyEmail(token: string): Promise<void> {
  const { error, response } = await client.POST('/api/v1/auth/verify-email', {
    body: { token },
  });

  if (!response.ok) {
    throw new ApiError(toProblem(response.status, error));
  }
}

export async function resendVerification(email: string): Promise<void> {
  await client.POST('/api/v1/auth/resend-verification', { body: { email } });
}

export async function signIn(email: string, password: string): Promise<void> {
  const { data, error, response } = await client.POST('/api/v1/auth/login', {
    body: { email, password, clientKind: CLIENT_KIND },
  });

  if (!response.ok || !data) {
    throw new ApiError(toProblem(response.status, error));
  }

  adopt(data);
}

export async function signOut(): Promise<void> {
  // Best effort. The server ends the session and puts it on the revocation list; if the call
  // fails, the client still forgets its tokens — a sign-out that refused to sign you out locally
  // because the network was down would be the wrong way round.
  try {
    await client.POST('/api/v1/auth/logout', {});
  } catch {
    // Intentionally ignored; the caller clears local state regardless.
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  // 202 for an unknown address too, so there is nothing to branch on and nothing to leak.
  await client.POST('/api/v1/auth/forgot-password', { body: { email } });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  const { error, response } = await client.POST('/api/v1/auth/reset-password', {
    body: { token, password },
  });

  if (!response.ok) {
    throw new ApiError(toProblem(response.status, error));
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await withAuth(() =>
    client.POST('/api/v1/auth/change-password', {
      body: { currentPassword, newPassword },
    }),
  );
}

export async function previewInvitation(token: string): Promise<InvitationPreview> {
  const { data, error, response } = await client.GET('/api/v1/auth/invitations/{token}', {
    params: { path: { token } },
  });

  if (!response.ok || !data) {
    throw new ApiError(toProblem(response.status, error));
  }

  return data;
}

/**
 * Accepts an invitation.
 *
 * @returns the outcome. `SignedIn` means a new account was created and a session issued;
 * `AccountLinked` means the address already had an account, which is now on the roster — and
 * deliberately <b>without</b> a session, because accepting an invitation must not be a way to
 * sign in as somebody whose password you do not have.
 */
export async function acceptInvitation(input: {
  token: string;
  fullName: string;
  password: string;
  acceptedKvkkNotice: boolean;
}): Promise<{ outcome: string; organizationName: string; signedIn: boolean }> {
  const { data, error, response } = await client.POST('/api/v1/auth/invitations/accept', {
    body: { ...input, clientKind: CLIENT_KIND },
  });

  if (!response.ok || !data) {
    throw new ApiError(toProblem(response.status, error));
  }

  if (data.authentication) {
    adopt(data.authentication);
  }

  return {
    outcome: data.outcome,
    organizationName: data.organizationName,
    signedIn: data.authentication != null,
  };
}

/** Who the caller is, what studio they are in, and what they may reach. */
export async function fetchMe(): Promise<MeResponse> {
  return withAuth(() => client.GET('/api/v1/me', {}));
}
