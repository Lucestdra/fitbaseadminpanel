/**
 * Money, formatted for reading.
 *
 * <b>One direction only.</b> The panel stores prices as display strings — `'₺2.400'` — and parses
 * them back with `replace(/[^0-9]/g, '')`, which reads ₺2.400,50 as 240050. Amounts arrive from the
 * server as numbers with a currency beside them and are formatted at the point they are rendered;
 * nothing ever reads a formatted string back.
 *
 * `null` is not zero. A price the caller may not see (no `members.financial.read`) comes back as
 * null, and rendering it as ₺0 would tell a coach the package was free.
 */
export function formatMoney(amount: number | null, currency: string | null): string | null {
  if (amount === null) return null;

  const formatted = amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 });

  // TRY is the only currency the server accepts today, so the symbol is right in every case it can
  // currently produce — and the code is shown for anything else rather than a wrong symbol.
  return currency === null || currency === 'TRY' ? `₺${formatted}` : `${formatted} ${currency}`;
}
