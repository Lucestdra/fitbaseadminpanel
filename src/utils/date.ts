export const TURKISH_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function formatDateLabel(date: Date): string {
  return `${date.getDate()} ${TURKISH_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function parseDateLabel(label: string): Date | null {
  const parts = label.trim().split(' ');
  if (parts.length < 3) return null;
  const day = parseInt(parts[0], 10);
  const monthIndex = TURKISH_MONTHS.indexOf(parts[1]);
  const year = parseInt(parts[2], 10);
  if (Number.isNaN(day) || monthIndex === -1 || Number.isNaN(year)) return null;
  return new Date(year, monthIndex, day);
}

export function formatDateTimeLabel(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()} ${TURKISH_MONTHS[date.getMonth()]} ${hours}:${minutes}`;
}

/**
 * `YYYY-MM-DD` from a local date.
 *
 * Assembled from the local components rather than `toISOString().slice(0, 10)`, which formats in
 * UTC: a day picked as 3 Ağustos in Istanbul is still 2 Ağustos at UTC, so the studio would close
 * on the wrong date while the picker kept showing the right one.
 */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The inverse, parsed by parts — `new Date('2026-08-03')` is UTC midnight and shifts the same way. */
export function fromIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

export function formatIsoDateLabel(iso: string): string {
  const date = fromIsoDate(iso);
  return date ? formatDateLabel(date) : iso;
}

/**
 * Today's date where the studio is, as `YYYY-MM-DD`.
 *
 * Not the device's today. A studio in Istanbul has an owner travelling in London for whom midnight
 * arrives three hours late, and every "is this in the past" question the panel asks should be
 * answered from the studio's calendar rather than whichever one the laptop happens to be on.
 *
 * Falls back to the device when the runtime cannot resolve the zone, which is the only thing left
 * to do — a wrong-by-hours answer beats a crash on a settings screen.
 */
export function todayIn(timeZoneId: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneId,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const find = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? '';

    const [year, month, day] = [find('year'), find('month'), find('day')];

    return year && month && day ? `${year}-${month}-${day}` : toIsoDate(new Date());
  } catch {
    return toIsoDate(new Date());
  }
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export function formatRelativeDateTimeLabel(date: Date, now: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(date) - startOfDay(now)) / (24 * 60 * 60 * 1000));
  if (dayDiff === 0) return `Bugün ${time}`;
  if (dayDiff === 1) return `Yarın ${time}`;
  return `${date.getDate()} ${TURKISH_MONTHS[date.getMonth()]} ${time}`;
}

export const WEEKDAYS: { id: string; label: string }[] = [
  { id: 'pzt', label: 'Pzt' },
  { id: 'sal', label: 'Sal' },
  { id: 'car', label: 'Çar' },
  { id: 'per', label: 'Per' },
  { id: 'cum', label: 'Cum' },
  { id: 'cmt', label: 'Cmt' },
  { id: 'paz', label: 'Paz' },
];

export function generateTimeOptions(startHour = 6, endHour = 22, stepMinutes = 30): string[] {
  const options: string[] = [];
  for (let totalMinutes = startHour * 60; totalMinutes <= endHour * 60; totalMinutes += stepMinutes) {
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    options.push(`${hours}:${minutes}`);
  }
  return options;
}

/**
 * The organization-local date an instant falls on, as `YYYY-MM-DD`.
 *
 * <b>Not `instant.slice(0, 10)`.</b> That is the UTC date, and for a studio three hours east it is
 * the wrong day for three hours out of every twenty-four — which is exactly when somebody checks
 * whether an invitation expires today.
 *
 * The same fallback as `todayIn`: a wrong-by-hours answer beats a crash while rendering a list.
 */
export function localDateOf(instant: string, timeZoneId: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZoneId,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date(instant));

    const find = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? '';

    const [year, month, day] = [find('year'), find('month'), find('day')];

    return year && month && day ? `${year}-${month}-${day}` : instant.slice(0, 10);
  } catch {
    return instant.slice(0, 10);
  }
}
