import { client, withAuth } from './client';
import type { components } from './schema';

export type ProgramMonth = components['schemas']['ProgramMonth'];
export type ProgramWeek = components['schemas']['ProgramWeek'];
export type ProgramRoster = components['schemas']['ProgramRoster'];
export type ProgramRosterEntry = components['schemas']['ProgramRosterEntry'];
export type ProgramCounters = components['schemas']['ProgramCounters'];
export type MemberProgramDetail = components['schemas']['MemberProgramDetail'];
export type ProgramDeliveryRecord = components['schemas']['ProgramDeliveryRecord'];
export type ProgramDeliveryChannel = components['schemas']['ProgramDeliveryChannel'];
export type DeliveryEvidence = components['schemas']['DeliveryEvidence'];

/** How many calendar weeks a month can touch. The panel offered four. */
export const MAX_WEEKS = 6;

/**
 * The programme screen for a month.
 *
 * <b>No trainer id.</b> A coach's rows come from their authenticated staff-member id, resolved
 * server-side from the permission scope; a manager reading the same route gets the whole studio and
 * that is the oversight view. The panel filters `members.assignedTrainer === user.name` in the
 * browser — a display name, compared in a client, that changes the filter the day somebody marries.
 *
 * `year` and `month` are omitted for the studio's current month, decided in the organization's zone.
 * The device clock is in whichever zone the laptop is in.
 */
export async function getRoster(month?: ProgramMonth | null): Promise<ProgramRoster> {
  return withAuth(() =>
    client.GET('/api/v1/programs', {
      params: { query: { year: month?.year, month: month?.month } },
    }),
  );
}

/** One member's programme for a month, with the weeks that were written. */
export async function getProgram(
  memberId: string,
  month?: ProgramMonth | null,
): Promise<MemberProgramDetail> {
  return withAuth(() =>
    client.GET('/api/v1/programs/{memberId}', {
      params: { path: { memberId }, query: { year: month?.year, month: month?.month } },
    }),
  );
}

/**
 * Writes a month's weeks.
 *
 * <b>The weeks sent are the weeks that exist afterwards.</b> A week sent blank is deleted rather
 * than stored empty, so "how many weeks are written" stays a count of rows.
 */
export async function saveProgram(
  memberId: string,
  body: { year: number | null; month: number | null; weeks: { weekNumber: number; plan: string | null }[] },
): Promise<MemberProgramDetail> {
  return withAuth(() =>
    client.PUT('/api/v1/programs/{memberId}', { params: { path: { memberId } }, body }),
  );
}

/**
 * Records that the programme was passed to the member.
 *
 * <b>Append-only, and honest about what it evidences.</b> `SelfReported` is the coach's word — the
 * platform observed nothing — and is excluded from every delivery-rate metric. `PlatformConfirmed`
 * is a registered wire value with no connector behind it and comes back as
 * `programs.delivery.evidence_unavailable` (ADR-0054).
 */
export async function recordDelivery(
  memberId: string,
  body: {
    year: number | null;
    month: number | null;
    channel: NonNullable<ProgramDeliveryChannel>;
    evidence: NonNullable<DeliveryEvidence>;
  },
): Promise<MemberProgramDetail> {
  return withAuth(() =>
    client.POST('/api/v1/programs/{memberId}/deliveries', {
      params: { path: { memberId } },
      body,
    }),
  );
}
