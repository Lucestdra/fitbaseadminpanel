import { client, withAuth } from './client';
import type { components } from './schema';

export type CalendarView = components['schemas']['CalendarView'];
export type CalendarRange = components['schemas']['CalendarRange'];
export type CalendarSession = components['schemas']['CalendarSession'];
export type SessionDetail = components['schemas']['SessionDetail'];
export type SessionSeat = components['schemas']['SessionSeat'];
export type AttendanceSummary = components['schemas']['AttendanceSummary'];
export type ClassSummary = components['schemas']['ClassSummary'];
export type ClassSlotSummary = components['schemas']['ClassSlotSummary'];
export type BookingReceipt = components['schemas']['BookingReceipt'];
export type CancellationReceipt = components['schemas']['CancellationReceipt'];
export type SessionCancellation = components['schemas']['SessionCancellation'];
export type MaterializationResult = components['schemas']['MaterializationResult'];

export type SessionKind = components['schemas']['SessionKind'];
export type SessionState = components['schemas']['SessionState'];
export type BookingState = components['schemas']['BookingState'];
export type AttendanceMark = components['schemas']['AttendanceMark'];

export interface CalendarQuery {
  /** Inclusive, `YYYY-MM-DD` in the studio's zone. */
  from: string;
  /** Inclusive. */
  to: string;
  coachId?: string;
  classId?: string;
  includeCancelled?: boolean;
}

/**
 * What is on between two dates.
 *
 * <b>Read `range.materializedThrough` before rendering an empty week.</b> The server generates class
 * occurrences on a rolling 84-day horizon, and a week past what it has reached is not a week with no
 * classes — it is a week that does not exist yet. Both come back as an empty `sessions` array, and
 * that field is the only thing that tells them apart. `null` means generation has never run.
 *
 * A window past `range.horizonThrough` is refused with `scheduling.horizon.exceeded` rather than
 * answered emptily.
 */
export async function getCalendar(query: CalendarQuery): Promise<CalendarView> {
  return withAuth(() =>
    client.GET('/api/v1/scheduling/calendar', {
      params: {
        query: {
          from: query.from,
          to: query.to,
          coachId: query.coachId,
          classId: query.classId,
          includeCancelled: query.includeCancelled,
        },
      },
    }),
  );
}

/** One session, its register and its counts. Serves the drawer and the attendance sheet. */
export async function getSession(sessionId: string): Promise<SessionDetail> {
  return withAuth(() =>
    client.GET('/api/v1/scheduling/sessions/{sessionId}', { params: { path: { sessionId } } }),
  );
}

export interface OneOffSessionBody {
  title: string;
  /** ISO-8601 instant. The server derives the studio-local date from it. */
  startsAt: string;
  durationMinutes: number;
  capacity: number;
  coachStaffMemberId: string | null;
  classDefinitionId: string | null;
  notes: string | null;
}

export async function createSession(body: OneOffSessionBody): Promise<SessionDetail> {
  return withAuth(() => client.POST('/api/v1/scheduling/sessions', { body }));
}

/**
 * Calls off a session.
 *
 * Everybody booked onto it is refunded, whatever the twelve-hour cutoff says — the member did not
 * choose this. The response reports how many seats were released and how many credits came back;
 * the two differ when some of those members are on unlimited packages.
 */
export async function cancelSession(
  sessionId: string,
  reason: string | null,
): Promise<SessionCancellation> {
  return withAuth(() =>
    client.POST('/api/v1/scheduling/sessions/{sessionId}/cancel', {
      params: { path: { sessionId } },
      body: { reason },
    }),
  );
}

/**
 * Claims a seat and charges a credit, in one transaction.
 *
 * Fails with `scheduling.session.capacity_exceeded` when the last seat went between the screen
 * rendering and the button being pressed — which is why the client must not decide from
 * `bookedCount < capacity` and skip the call.
 */
export async function bookSeat(sessionId: string, memberId: string): Promise<BookingReceipt> {
  return withAuth(() =>
    client.POST('/api/v1/scheduling/sessions/{sessionId}/bookings', {
      params: { path: { sessionId } },
      body: { memberId },
    }),
  );
}

/** Gives a seat up. The credit comes back only outside the twelve-hour window. */
export async function cancelBooking(bookingId: string): Promise<CancellationReceipt> {
  return withAuth(() =>
    client.DELETE('/api/v1/scheduling/bookings/{bookingId}', {
      params: { path: { bookingId } },
    }),
  );
}

export interface AttendanceEntryBody {
  bookingId: string;
  mark: AttendanceMark;
}

/**
 * Marks a whole register in one request.
 *
 * Bulk by design: one call per member turns a twelve-person class into twelve transactions that can
 * half-succeed. `Unmarked` is a legitimate mark and undoes a mistake.
 */
export async function markAttendance(
  sessionId: string,
  entries: AttendanceEntryBody[],
): Promise<AttendanceSummary> {
  return withAuth(() =>
    client.POST('/api/v1/scheduling/sessions/{sessionId}/attendance', {
      params: { path: { sessionId } },
      body: { entries },
    }),
  );
}

export async function listClasses(includeInactive = false): Promise<ClassSummary[]> {
  return withAuth(() =>
    client.GET('/api/v1/scheduling/classes', { params: { query: { includeInactive } } }),
  );
}

export interface ClassBody {
  name: string;
  categoryId: string | null;
  description: string | null;
  defaultCapacity: number;
  defaultDurationMinutes: number;
  defaultCoachStaffMemberId: string | null;
}

export async function createClass(body: ClassBody): Promise<ClassSummary> {
  return withAuth(() => client.POST('/api/v1/scheduling/classes', { body }));
}

export async function updateClass(classId: string, body: ClassBody): Promise<ClassSummary> {
  return withAuth(() =>
    client.PUT('/api/v1/scheduling/classes/{classId}', { params: { path: { classId } }, body }),
  );
}

/** Retires a class, or brings it back. Never a delete — the sessions it produced stay. */
export async function setClassActive(classId: string, isActive: boolean): Promise<ClassSummary> {
  return withAuth(() =>
    client.POST('/api/v1/scheduling/classes/{classId}/status', {
      params: { path: { classId } },
      body: { isActive },
    }),
  );
}

export interface SlotBody {
  dayOfWeek: components['schemas']['DayOfWeek'];
  /** `HH:mm:ss`, wall-clock in the studio's zone. Never an instant. */
  startsAtLocal: string;
  durationMinutes: number | null;
  capacity: number | null;
  coachStaffMemberId: string | null;
  intervalWeeks: number | null;
  validFrom: string | null;
  validTo: string | null;
}

/**
 * Adds a weekly slot.
 *
 * The server materialises it in the same transaction, so the occurrences are on the calendar by the
 * time this resolves. No second call, and no waiting for a job.
 */
export async function addSlot(classId: string, body: SlotBody): Promise<ClassSummary> {
  return withAuth(() =>
    client.POST('/api/v1/scheduling/classes/{classId}/slots', {
      params: { path: { classId } },
      body,
    }),
  );
}

/**
 * Stops a slot running from a date.
 *
 * Future occurrences nobody has booked are removed; ones with members on them are cancelled and
 * refunded. Both happen server-side in one transaction — this is not a delete of one row.
 */
export async function endSlot(
  classId: string,
  slotId: string,
  effectiveFrom?: string,
): Promise<ClassSummary> {
  return withAuth(() =>
    client.DELETE('/api/v1/scheduling/classes/{classId}/slots/{slotId}', {
      params: { path: { classId, slotId }, query: { effectiveFrom } },
    }),
  );
}

/** Generates missing occurrences through the horizon. Idempotent, so pressing it twice is free. */
export async function materialize(): Promise<MaterializationResult> {
  return withAuth(() => client.POST('/api/v1/scheduling/materialize', {}));
}
