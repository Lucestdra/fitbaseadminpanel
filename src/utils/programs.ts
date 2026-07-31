import type { WeeklyProgramEntry } from '@/types/programs';

/** Builds the plain-text program message sent to the member over WhatsApp. */
export function buildProgramMessage(memberName: string, month: string, entries: WeeklyProgramEntry[]): string {
  const lines = [`Merhaba ${memberName},`, '', `${month} antrenman programın:`, ''];
  entries.forEach((entry) => {
    if (!entry.plan.trim()) return;
    lines.push(`Hafta ${entry.week}: ${entry.plan.trim()}`);
  });
  lines.push('', 'Sorularında bana yazabilirsin. İyi antrenmanlar!');
  return lines.join('\n');
}

/** wa.me requires a digits-only international number. */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
