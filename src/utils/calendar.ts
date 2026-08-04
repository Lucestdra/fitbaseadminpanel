import { TURKISH_MONTHS, fromIsoDate, toIsoDate } from './date';

/**
 * The clock time an instant falls on, where the studio is.
 *
 * <b>Not the device's clock.</b> Every session comes back as an ISO-8601 instant, and rendering it
 * with `Date#getHours` formats in whatever zone the laptop is in — so an owner checking the
 * timetable from London sees a Turkish studio's 09:00 class at 06:00. The studio's zone is the only
 * one the answer means anything in.
 *
 * Falls back to the device when the runtime cannot resolve the zone, which is all that is left to
 * do: wrong by an hour beats a blank calendar.
 */
export function formatTimeIn(instant: string, timeZoneId: string): string {
  const date = new Date(instant);

  if (Number.isNaN(date.getTime())) return '';

  try {
    return new Intl.DateTimeFormat('tr-TR', {
      timeZone: timeZoneId || undefined,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
}

/** `09:00 – 09:50`, both ends in the studio's zone. */
export function formatTimeRangeIn(from: string, to: string, timeZoneId: string): string {
  return `${formatTimeIn(from, timeZoneId)} – ${formatTimeIn(to, timeZoneId)}`;
}

/** `3 Ağustos 2026` from a `YYYY-MM-DD`, parsed by parts so it cannot shift a day. */
export function formatDayLabel(isoDate: string): string {
  const date = fromIsoDate(isoDate);
  return date ? `${date.getDate()} ${TURKISH_MONTHS[date.getMonth()]} ${date.getFullYear()}` : isoDate;
}

/** `3 Ağustos` — the same without the year, for a header that already names one. */
export function formatShortDayLabel(isoDate: string): string {
  const date = fromIsoDate(isoDate);
  return date ? `${date.getDate()} ${TURKISH_MONTHS[date.getMonth()]}` : isoDate;
}

export interface MonthGrid {
  /** First day of the rendered grid, `YYYY-MM-DD`. Usually in the previous month. */
  from: string;
  /** Last day. Usually in the next. */
  to: string;
  /** Six weeks of seven days, each a real `YYYY-MM-DD`. Never a weekday id. */
  days: MonthGridDay[];
  year: number;
  /** Zero-based, matching `TURKISH_MONTHS`. */
  month: number;
}

export interface MonthGridDay {
  isoDate: string;
  dayOfMonth: number;
  /** False for the leading and trailing days borrowed from the neighbouring months. */
  inMonth: boolean;
}

/**
 * A month as real dates.
 *
 * <b>This is what replaces the weekday template.</b> The panel's month grid asked "which mock
 * sessions have `day === 'sal'`" and painted them onto every Tuesday in every month there has ever
 * been — so a class that started last March renders in March 2019, and cancelling one Tuesday is
 * not expressible. Here every cell is a date, and a session belongs to a cell when its `occursOn`
 * equals that date.
 *
 * Always six rows. A month can span six calendar weeks, and a grid that sometimes has five rows and
 * sometimes six changes height as you page through the year.
 *
 * Weeks start on Monday, matching the studio's `weekStartDay` — the only value the product ships.
 */
export function buildMonthGrid(year: number, month: number): MonthGrid {
  const firstOfMonth = new Date(year, month, 1);

  // JavaScript's Sunday-is-zero, shifted so Monday is zero. Without the shift the grid is off by a
  // day for every month beginning on a Sunday, which is the kind of wrong that looks like a
  // rendering glitch rather than a date bug.
  const leading = (firstOfMonth.getDay() + 6) % 7;

  const start = new Date(year, month, 1 - leading);
  const days: MonthGridDay[] = [];

  for (let index = 0; index < 42; index++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);

    days.push({
      isoDate: toIsoDate(date),
      dayOfMonth: date.getDate(),
      inMonth: date.getMonth() === month,
    });
  }

  return { from: days[0].isoDate, to: days[days.length - 1].isoDate, days, year, month };
}

/** The Monday-anchored week containing `isoDate`, as seven `YYYY-MM-DD`. */
export function buildWeek(isoDate: string): string[] {
  const date = fromIsoDate(isoDate) ?? new Date();
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, index) =>
    toIsoDate(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index)),
  );
}

/** Moves a `YYYY-MM-DD` by whole days, by parts, so a DST boundary cannot shift it. */
export function shiftIsoDate(isoDate: string, days: number): string {
  const date = fromIsoDate(isoDate);

  if (!date) return isoDate;

  return toIsoDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
}

/**
 * Whether `isoDate` is past what the server has generated.
 *
 * <b>The question the panel could never ask.</b> `materializedThrough` is null before the
 * materialiser has ever run and a date afterwards; either way, a day past it holds no class
 * occurrences <i>yet</i> — which is a different fact from a day the studio has nothing on, and the
 * two must not render the same.
 */
export function isBeyondGenerated(isoDate: string, materializedThrough: string | null): boolean {
  return materializedThrough === null || isoDate > materializedThrough;
}

/** `pzt`…`paz` → JavaScript's Sunday-zero index, matching `WEEKDAYS` in `date.ts`. */
const WEEKDAY_INDEX: Record<string, number> = {
  paz: 0,
  pzt: 1,
  sal: 2,
  car: 3,
  per: 4,
  cum: 5,
  cmt: 6,
};

/**
 * A studio-local date and time as an ISO-8601 instant.
 *
 * <b>The offset is computed for that date, not taken from today.</b> Assembling a November session
 * from a browser sitting in August would otherwise carry August's offset — an hour wrong, in a zone
 * with daylight saving, in a direction nobody would think to check.
 *
 * Falls back to the device's own reading when the zone cannot be resolved, which is the same answer
 * for everybody who is not travelling.
 */
export function toInstant(isoDate: string, time: string, timeZoneId: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const naive = new Date(
    `${isoDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`,
  );

  try {
    // What that UTC instant reads as in the studio's zone. The gap between the two is the offset in
    // force on that date, and subtracting it gives the instant the wall-clock time actually names.
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneId,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).formatToParts(naive);

    const find = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value ?? '0');

    const asZoned = Date.UTC(
      find('year'),
      find('month') - 1,
      find('day'),
      find('hour') % 24,
      find('minute'),
      find('second'),
    );

    return new Date(naive.getTime() - (asZoned - naive.getTime())).toISOString();
  } catch {
    const local = fromIsoDate(isoDate) ?? new Date();
    local.setHours(hour, minute, 0, 0);
    return local.toISOString();
  }
}

/**
 * "Next Tuesday at 14:00" as an instant.
 *
 * <b>Next, never today.</b> A consultant booking a Tuesday meeting on a Tuesday afternoon means the
 * following week — scheduling it into an hour that has already passed would put a trial lesson in
 * the past, and nothing downstream would flag it.
 */
export function nextWeekdayInstant(weekdayId: string, time: string, timeZoneId: string): string {
  const target = WEEKDAY_INDEX[weekdayId] ?? 1;
  const today = new Date();
  const delta = ((target - today.getDay() + 7) % 7) || 7;

  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + delta);

  return toInstant(toIsoDate(date), time, timeZoneId);
}
