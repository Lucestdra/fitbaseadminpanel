import { client, withAuth } from './client';
import type { components } from './schema';

export type LeadListItem = components['schemas']['LeadListItem'];
export type LeadCounts = components['schemas']['LeadCounts'];
export type LeadList = components['schemas']['LeadList'];
export type LeadBoard = components['schemas']['LeadBoard'];
export type LeadBoardColumn = components['schemas']['LeadBoardColumn'];
export type LeadDetail = components['schemas']['LeadDetail'];
export type LeadNoteEntry = components['schemas']['LeadNoteEntry'];
export type LeadCallEntry = components['schemas']['LeadCallEntry'];
export type LeadTransitionEntry = components['schemas']['LeadTransitionEntry'];
export type LeadMeeting = components['schemas']['LeadMeeting'];
export type LeadConversion = components['schemas']['LeadConversion'];

export type CallOutcome = components['schemas']['CallOutcome'];
export type LeadLossReason = components['schemas']['LeadLossReason'];
export type LeadMeetingKind = components['schemas']['LeadMeetingKind'];

/**
 * How the list and the board are narrowed.
 *
 * <b>One shape for both.</b> The server parses the identical query string for `/leads` and
 * `/leads/board` and applies it identically — two filter sets is how a studio narrows the list,
 * switches to the Kanban view, and sees different leads with nothing on screen explaining why.
 */
export interface LeadQuery {
  search?: string;
  stageId?: string[];
  sourceId?: string[];
  assignedTo?: string[];
  overdueOnly?: boolean;
  /** Off by default. A converted or lost lead is out of the pipeline. */
  includeClosed?: boolean;
  /** From a previous page's `nextCursor`. Opaque — never build one. */
  cursor?: string;
  limit?: number;
}

export async function listLeads(query: LeadQuery = {}): Promise<LeadList> {
  return withAuth(() =>
    client.GET('/api/v1/leads', {
      params: {
        query: {
          search: query.search,
          stageId: query.stageId,
          sourceId: query.sourceId,
          assignedTo: query.assignedTo,
          overdueOnly: query.overdueOnly,
          includeClosed: query.includeClosed,
          cursor: query.cursor,
          limit: query.limit,
        },
      },
    }),
  );
}

/** The same leads grouped into pipeline columns, from the identical filter. No cursor: a board pages per column. */
export async function getLeadBoard(query: LeadQuery = {}): Promise<LeadBoard> {
  return withAuth(() =>
    client.GET('/api/v1/leads/board', {
      params: {
        query: {
          search: query.search,
          stageId: query.stageId,
          sourceId: query.sourceId,
          assignedTo: query.assignedTo,
          overdueOnly: query.overdueOnly,
          includeClosed: query.includeClosed,
          limit: query.limit,
        },
      },
    }),
  );
}

export async function getLead(leadId: string): Promise<LeadDetail> {
  return withAuth(() => client.GET('/api/v1/leads/{leadId}', { params: { path: { leadId } } }));
}

export interface LeadBody {
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  /** Catalog entry id, never a bare string — the studio owns and can rename its sources. */
  sourceId: string | null;
  interestId: string | null;
  /** Roster id, never a display name (ADR-0016). */
  assignedStaffMemberId: string | null;
  note: string | null;
}

export async function createLead(body: LeadBody): Promise<LeadDetail> {
  return withAuth(() => client.POST('/api/v1/leads', { body }));
}

export async function updateLead(leadId: string, body: LeadBody): Promise<LeadDetail> {
  return withAuth(() =>
    client.PUT('/api/v1/leads/{leadId}', { params: { path: { leadId } }, body }),
  );
}

/**
 * Moves a lead to another stage.
 *
 * The server writes the transition that records it, and refuses two destinations: the converted
 * column (which creates a member) and the lost column (which needs a reason). Both have their own
 * action — this is for the ordinary columns in between.
 */
export async function moveLeadStage(
  leadId: string,
  stageId: string,
  reason: string | null,
): Promise<LeadDetail> {
  return withAuth(() =>
    client.POST('/api/v1/leads/{leadId}/stage', {
      params: { path: { leadId } },
      body: { stageId, reason },
    }),
  );
}

export async function addLeadNote(leadId: string, text: string): Promise<LeadNoteEntry> {
  return withAuth(() =>
    client.POST('/api/v1/leads/{leadId}/notes', { params: { path: { leadId } }, body: { text } }),
  );
}

/**
 * Records a call, and lets the server decide whether the lead moves.
 *
 * <b>The promotion rule is not reimplemented here.</b> It resolves stages by semantic role and
 * compares `sortOrder`, so a studio renaming or reordering its board changes nothing. The panel
 * decided this client-side with `indexOf('ilgileniyor')` over the catalog array — which broke
 * silently the moment anybody touched the board.
 *
 * `followUpAt` is refused alongside `Spoke`: a call that reached the lead has nothing to follow up.
 */
export async function logLeadCall(
  leadId: string,
  body: { outcome: CallOutcome; followUpAt: string | null; note: string | null },
): Promise<LeadDetail> {
  return withAuth(() =>
    client.POST('/api/v1/leads/{leadId}/calls', { params: { path: { leadId } }, body }),
  );
}

/**
 * Books a meeting or a trial.
 *
 * The calendar entry and the lead's move happen in one server transaction, so a lead marked
 * "meeting booked" always has a session behind it. A coach who is already busy comes back as
 * `scheduling.trainer.double_booked` and nothing is written.
 */
export async function scheduleLeadMeeting(
  leadId: string,
  body: {
    kind: LeadMeetingKind;
    /** ISO-8601 instant, resolved from the studio's zone by the client. */
    startsAt: string;
    durationMinutes: number;
    coachStaffMemberId: string | null;
  },
): Promise<LeadMeeting> {
  return withAuth(() =>
    client.POST('/api/v1/leads/{leadId}/meetings', { params: { path: { leadId } }, body }),
  );
}

/**
 * Turns a lead into a member.
 *
 * `alreadyExisted` is true when the phone number matched somebody already on the roster and the
 * lead was linked to them — somebody who signed up at the desk on Tuesday should not become a
 * second person when their Instagram lead is converted on Friday. Worth saying out loud in the UI,
 * because "converted" and "linked to an existing member" are different outcomes.
 */
export async function convertLead(leadId: string): Promise<LeadConversion> {
  return withAuth(() =>
    client.POST('/api/v1/leads/{leadId}/convert', { params: { path: { leadId } } }),
  );
}

/**
 * Closes a lead as lost.
 *
 * The reason is a closed set because it is what the funnel groups by. The panel has no way to lose
 * a lead at all, which is why its pipeline only ever grows.
 */
export async function closeLead(
  leadId: string,
  // `NonNullable`, because the generated enum carries `| null` — see LEAD_LOSS_REASON_LABELS. The
  // server requires a reason here, so accepting null would be a signature wider than the truth.
  body: { reason: NonNullable<LeadLossReason>; note: string | null },
): Promise<LeadDetail> {
  return withAuth(() =>
    client.POST('/api/v1/leads/{leadId}/close', { params: { path: { leadId } }, body }),
  );
}

/** Puts a closed lead back in the pipeline. "Not now" in March is a call in June. */
export async function reopenLead(leadId: string): Promise<LeadDetail> {
  return withAuth(() =>
    client.POST('/api/v1/leads/{leadId}/reopen', { params: { path: { leadId } } }),
  );
}
