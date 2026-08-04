/**
 * Which day an instant fell on, in the studio's zone.
 *
 * <b>Not the device's zone, and not UTC.</b> A payment taken at 23:40 in Istanbul is 20:40 UTC the
 * same day, but one taken at 01:20 is 22:20 UTC the day before — so a UTC date puts the start of
 * every Turkish morning in yesterday, which is exactly when a studio reconciles the previous day's
 * takings and finds them short.
 *
 * `en-CA` because its date format is `YYYY-MM-DD`, which is the shape every other date helper in
 * this app already speaks. The locale is a formatting trick, not a language choice — the label the
 * studio reads is produced from this by `formatDayLabel`.
 */
export function localDayOf(instant: string, timeZoneId: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timeZoneId,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(instant));
}

/**
 * An instant as the studio saw it — `'3 Ağustos 14:05'`.
 *
 * The zone is the organization's, not the device's, for the same reason {@link localDayOf} exists:
 * a delivery recorded at 01:20 in Istanbul is the previous evening in UTC and a different day again
 * on a laptop in London.
 */
export function formatInstantIn(instant: string, timeZoneId: string): string {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: timeZoneId,
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(instant));
}

/** Today, in the studio's zone, as `YYYY-MM-DD`. */
export function studioToday(timeZoneId: string): string {
  return localDayOf(new Date().toISOString(), timeZoneId);
}

/** The first day of the month `instant` falls in, in the studio's zone. */
export function startOfMonth(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

/** The last day of the month `isoDate` falls in. */
export function endOfMonth(isoDate: string): string {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));

  // Day zero of the next month is the last day of this one, and it handles February without a
  // leap-year rule written here.
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return `${isoDate.slice(0, 7)}-${String(last).padStart(2, '0')}`;
}
