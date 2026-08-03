import { client, withAuth } from './client';
import type { components } from './schema';

export type MemberListItem = components['schemas']['MemberListItem'];
export type MemberCounts = components['schemas']['MemberCounts'];
export type MemberList = components['schemas']['MemberList'];
export type MemberDetail = components['schemas']['MemberDetail'];
export type MembershipSummary = components['schemas']['MembershipSummary'];
export type FreezeSummary = components['schemas']['FreezeSummary'];
export type GiftSummary = components['schemas']['GiftSummary'];
export type SessionLedgerEntry = components['schemas']['SessionLedgerEntry'];
export type SessionPage = components['schemas']['PageOfSessionLedgerEntry'];

export type MembershipState = components['schemas']['MembershipState'];
export type MemberBadge = components['schemas']['MemberBadge'];
export type SessionCreditReason = components['schemas']['SessionCreditReason'];

/** Ordering. A closed set, because the sort is half of the cursor the next page resumes from. */
export type MemberSort = 'RecentlyJoined' | 'NameAscending';

export interface MemberQuery {
  search?: string;
  state?: MembershipState[];
  coachId?: string;
  includeArchived?: boolean;
  sort?: MemberSort;
  /** From a previous page's `nextCursor`. Opaque — never build one. */
  cursor?: string;
  limit?: number;
}

/**
 * A page of members with the counters above the list.
 *
 * <b>One call, not two.</b> The counters are computed from the same predicate as the rows, which is
 * what stops a filter changing the list and not the numbers over it. The panel's KPI row is five
 * hardcoded constants, so it has never been able to disagree — it never described the list at all.
 */
export async function listMembers(query: MemberQuery = {}): Promise<MemberList> {
  return withAuth(() =>
    client.GET('/api/v1/members', {
      params: {
        query: {
          search: query.search,
          state: query.state,
          coachId: query.coachId,
          includeArchived: query.includeArchived,
          sort: query.sort,
          cursor: query.cursor,
          limit: query.limit,
        },
      },
    }),
  );
}

export async function getMember(memberId: string): Promise<MemberDetail> {
  return withAuth(() =>
    client.GET('/api/v1/members/{memberId}', { params: { path: { memberId } } }),
  );
}

export interface MemberBody {
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  birthDate: string | null;
  primaryCoachStaffMemberId: string | null;
  joinedOn: string | null;
  notes: string | null;
  interestIds: string[] | null;
}

export async function createMember(body: MemberBody): Promise<MemberDetail> {
  return withAuth(() => client.POST('/api/v1/members', { body }));
}

export async function updateMember(memberId: string, body: MemberBody): Promise<MemberDetail> {
  return withAuth(() =>
    client.PUT('/api/v1/members/{memberId}', { params: { path: { memberId } }, body }),
  );
}

/**
 * Takes a member off the working roster, or puts them back.
 *
 * Never a delete. Their memberships, ledger and payments are what the studio's revenue was, and a
 * member who comes back after two years should find their history waiting.
 */
export async function setMemberArchived(memberId: string, archived: boolean): Promise<void> {
  await withAuth(() =>
    archived
      ? client.POST('/api/v1/members/{memberId}/archive', { params: { path: { memberId } } })
      : client.POST('/api/v1/members/{memberId}/restore', { params: { path: { memberId } } }),
  );
}

/**
 * Sells a package.
 *
 * The server copies the template's terms onto the membership, so a later price change does not
 * reprice this sale. `priceOverride` is what the studio actually charged when it differs — a
 * discount recorded here shows up in revenue; one applied by editing the template afterwards does
 * not.
 */
export async function sellMembership(
  memberId: string,
  body: { packageTemplateId: string; startsOn: string | null; priceOverride: number | null },
): Promise<MembershipSummary> {
  return withAuth(() =>
    client.POST('/api/v1/members/{memberId}/memberships', {
      params: { path: { memberId } },
      body,
    }),
  );
}

/**
 * Pauses the membership.
 *
 * `endsOn` is when the studio expects to release it, and it is a request rather than a commitment:
 * the term is extended at release by the days actually frozen. Freezing for eight weeks and coming
 * back after two days adds two days, not fifty-six.
 */
export async function freezeMembership(
  memberId: string,
  body: { startsOn: string | null; endsOn: string; reason: string | null },
): Promise<FreezeSummary> {
  return withAuth(() =>
    client.POST('/api/v1/members/{memberId}/membership/freeze', {
      params: { path: { memberId } },
      body,
    }),
  );
}

export async function unfreezeMembership(memberId: string): Promise<FreezeSummary> {
  return withAuth(() =>
    client.POST('/api/v1/members/{memberId}/membership/unfreeze', {
      params: { path: { memberId } },
    }),
  );
}

export async function cancelMembership(
  memberId: string,
  reason: string | null,
): Promise<MembershipSummary> {
  return withAuth(() =>
    client.POST('/api/v1/members/{memberId}/membership/cancel', {
      params: { path: { memberId } },
      body: { reason },
    }),
  );
}

export async function listMemberSessions(
  memberId: string,
  cursor?: string,
  limit?: number,
): Promise<SessionPage> {
  return withAuth(() =>
    client.GET('/api/v1/members/{memberId}/sessions', {
      params: { path: { memberId }, query: { cursor, limit } },
    }),
  );
}

/**
 * Corrects the balance by hand.
 *
 * `note` is required by the server. An unexplained adjustment is the row nobody can defend when the
 * member asks about it, and the ledger is append-only so it cannot be annotated afterwards.
 */
export async function adjustSessionCredits(
  memberId: string,
  body: { delta: number; note: string },
): Promise<SessionLedgerEntry> {
  return withAuth(() =>
    client.POST('/api/v1/members/{memberId}/sessions/adjust', {
      params: { path: { memberId } },
      body,
    }),
  );
}

/**
 * Grants a gift and applies its effect server-side, in one transaction.
 *
 * The panel's gift is a label with a prose description, so granting "3 Seans Hediye" changes a list
 * and nothing else — the member still has the balance they started with, and nobody notices until
 * they try to book.
 */
export async function grantGift(
  memberId: string,
  body: { giftTemplateId: string; note: string | null },
): Promise<GiftSummary> {
  return withAuth(() =>
    client.POST('/api/v1/members/{memberId}/gifts', { params: { path: { memberId } }, body }),
  );
}
