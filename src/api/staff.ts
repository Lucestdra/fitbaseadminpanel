import { client, withAuth } from './client';
import type { components } from './schema';

export type StaffMemberSummary = components['schemas']['StaffMemberSummary'];
export type StaffRole = components['schemas']['StaffRole'];
export type StaffStatus = components['schemas']['StaffStatus'];

/**
 * Who works here.
 *
 * <b>This replaces the `responsibles` catalog.</b> The panel keeps a free-text list of names,
 * duplicated from the Team screen and never synchronised with it, and assigns work by matching the
 * string — so a coach who changes their surname becomes two people and the older assignments point
 * at nobody. Assignments key on `staffMemberId` (backend ADR-0016).
 *
 * Names and roles only. It is a different permission from the Ekip screen for that reason.
 *
 * @param includeInactive
 * Whether people who have left are included. Leave it off for a picker; turn it on when rendering
 * an assignment that already exists, so a member whose coach left reads as "coach has left" rather
 * than as a member with no coach.
 */
export async function listStaff(includeInactive = false): Promise<StaffMemberSummary[]> {
  return withAuth(() => client.GET('/api/v1/staff', { params: { query: { includeInactive } } }));
}

/** Everyone who can be a member's primary coach. */
export function coachesAmong(roster: StaffMemberSummary[]): StaffMemberSummary[] {
  // Managers included on purpose: in a small studio the owner teaches, and the panel's own mock
  // data has the owner leading classes. Sales consultants are not offered — nothing in the product
  // gives them a session to lead.
  return roster.filter(
    (member) => member.role === 'Coach' || member.role === 'OrganizationManager',
  );
}

export type PendingInvitation = components['schemas']['PendingInvitation'];
export type InvitationResponse = components['schemas']['InvitationResponse'];
export type InviteStaffMemberBody = components['schemas']['InviteStaffMemberBody'];

/**
 * Invitations that have neither been accepted nor withdrawn.
 *
 * <b>A section the panel had no concept of.</b> Its Ekip screen created a row in local state with a
 * `Date.now()` id and called it a team member — so somebody "added" on Monday was gone on Tuesday,
 * had never been emailed, and could not sign in. On the server an invitation is a real row with an
 * expiry, and the roster entry it creates sits at `Invited` until the person accepts.
 */
export async function listInvitations(): Promise<PendingInvitation[]> {
  return withAuth(() => client.GET('/api/v1/staff/invitations', {}));
}

/** Invites somebody onto the roster and mails them a link. */
export async function invite(body: InviteStaffMemberBody): Promise<void> {
  await withAuth(() => client.POST('/api/v1/staff/invitations', { body }));
}

/**
 * Issues a fresh link, invalidating the previous one.
 *
 * The old link stops working the moment this returns, which is the point: a link that was
 * forwarded, or sat in an inbox for three weeks, should not still open a door.
 */
export async function resendInvitation(invitationId: string): Promise<InvitationResponse> {
  return withAuth(() =>
    client.POST('/api/v1/staff/invitations/{invitationId}/resend', {
      params: { path: { invitationId } },
    }),
  );
}

/** Withdraws an invitation and removes the roster row it created. */
export async function revokeInvitation(invitationId: string): Promise<void> {
  await withAuth(() =>
    client.DELETE('/api/v1/staff/invitations/{invitationId}', {
      params: { path: { invitationId } },
    }),
  );
}

export type UpdateStaffMemberBody = components['schemas']['UpdateStaffMemberBody'];

/**
 * Changes a staff member's role, their status, or both.
 *
 * <b>PATCH, and the partiality matters.</b> Marking a leaver changes one field; sending the whole
 * row back would let a stale form silently reassert somebody's old role. An omitted field is left
 * alone.
 *
 * The server refuses four cases this client does not attempt to pre-empt — the owner, yourself,
 * somebody who has not accepted their invitation, and assigning `Invited` — and each comes back as
 * its own `organizations.staff.*` code with a sentence to show.
 */
export async function updateStaffMember(
  staffMemberId: string,
  body: UpdateStaffMemberBody,
): Promise<StaffMemberSummary> {
  return withAuth(() =>
    client.PATCH('/api/v1/staff/{staffMemberId}', {
      params: { path: { staffMemberId } },
      body,
    }),
  );
}
