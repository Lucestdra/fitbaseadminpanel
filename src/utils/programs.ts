import type { ProgramWeek } from '@/api/programs';

/**
 * The programme as plain text, for the coach to copy.
 *
 * <b>Not for a deep link.</b> It is rendered on screen and copied by a person who then pastes it
 * into their own conversation — a human act, with a human's judgement in it. Composing a business
 * message and handing it to WhatsApp prefilled is what {@link buildWhatsAppUrl} deliberately no
 * longer does (ADR-0054).
 */
export function buildProgramMessage(
  memberName: string,
  monthLabel: string,
  weeks: ProgramWeek[],
): string {
  const lines = [`Merhaba ${memberName},`, '', `${monthLabel} antrenman programın:`, ''];

  weeks
    .filter((week) => week.plan.trim().length > 0)
    .forEach((week) => lines.push(`Hafta ${week.weekNumber}: ${week.plan.trim()}`));

  lines.push('', 'Sorularında bana yazabilirsin. İyi antrenmanlar!');
  return lines.join('\n');
}

/**
 * Opens a conversation with the member. Nothing else.
 *
 * <b>No `text` parameter, ever.</b> `?text=` prefills the composer in the coach's own WhatsApp
 * client, so the message is sent by their personal or business account, from their phone, outside
 * every Cloud API rule the rest of this product obeys — while looking to the studio and to the
 * member as though the platform sent it.
 *
 * A link that opens a conversation and composes nothing is unambiguously a shortcut to the coach's
 * own phone. Plan decision D19, adopted in ADR-0054.
 */
export function buildWhatsAppUrl(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}`;
}

const TURKISH_MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

/**
 * `{ year: 2026, month: 8 }` → `'Ağustos 2026'`.
 *
 * Formatting only. The month itself is decided by the server in the organization's zone and arrives
 * as two integers; this turns them into something a Turkish studio reads. The panel did the reverse
 * — it built the label first and used it as the storage key, which is why
 * <code>utils/date.ts</code> has a <code>parseDateLabel</code> that reads it back.
 */
export function formatProgramMonth(month: { year: number; month: number }): string {
  return `${TURKISH_MONTH_NAMES[month.month - 1] ?? ''} ${month.year}`.trim();
}

/** `{ year: 2026, month: 8 }` → `'2026-08'`. Sortable, and a stable React key. */
export function programMonthKey(month: { year: number; month: number }): string {
  return `${month.year}-${String(month.month).padStart(2, '0')}`;
}

/** The month before or after, without touching a `Date`. */
export function shiftProgramMonth(
  month: { year: number; month: number },
  delta: number,
): { year: number; month: number } {
  // Zero-based arithmetic so December → January carries the year without a special case.
  const zeroBased = month.year * 12 + (month.month - 1) + delta;
  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 };
}
