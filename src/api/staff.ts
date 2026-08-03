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
