/**
 * Phone numbers, stored one way and typed several.
 *
 * <b>The server matches on digits, not on the string.</b> `MemberProvisioningService` compares the
 * trailing ten, so "0532 111 22 33" and "+90 532 111 22 33" are already the same person to it. That
 * is what makes it safe to settle on one written form here without breaking the duplicate check on
 * everything entered before today.
 */

export interface Country {
  /** ISO 3166-1 alpha-2, used as the option id. */
  code: string;
  name: string;
  /** Without the plus. */
  dial: string;
  flag: string;
  /** Digits in a full national number, when it is fixed. Used for grouping and for the hint. */
  nationalLength?: number;
}

/**
 * A short list rather than all 200.
 *
 * Türkiye first, then where this product's studios actually see members from — a Turkish gym's
 * foreign members are overwhelmingly residents or visitors from these. A country that is missing is
 * a one-line addition; a 200-row scroll on every phone field is not.
 */
export const COUNTRIES: Country[] = [
  { code: 'TR', name: 'Türkiye', dial: '90', flag: '🇹🇷', nationalLength: 10 },
  { code: 'DE', name: 'Almanya', dial: '49', flag: '🇩🇪' },
  { code: 'NL', name: 'Hollanda', dial: '31', flag: '🇳🇱' },
  { code: 'GB', name: 'Birleşik Krallık', dial: '44', flag: '🇬🇧' },
  { code: 'US', name: 'ABD / Kanada', dial: '1', flag: '🇺🇸', nationalLength: 10 },
  { code: 'FR', name: 'Fransa', dial: '33', flag: '🇫🇷' },
  { code: 'AT', name: 'Avusturya', dial: '43', flag: '🇦🇹' },
  { code: 'BE', name: 'Belçika', dial: '32', flag: '🇧🇪' },
  { code: 'CH', name: 'İsviçre', dial: '41', flag: '🇨🇭' },
  { code: 'IT', name: 'İtalya', dial: '39', flag: '🇮🇹' },
  { code: 'ES', name: 'İspanya', dial: '34', flag: '🇪🇸' },
  { code: 'SE', name: 'İsveç', dial: '46', flag: '🇸🇪' },
  { code: 'RU', name: 'Rusya', dial: '7', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukrayna', dial: '380', flag: '🇺🇦' },
  { code: 'AZ', name: 'Azerbaycan', dial: '994', flag: '🇦🇿' },
  { code: 'GE', name: 'Gürcistan', dial: '995', flag: '🇬🇪' },
  { code: 'IR', name: 'İran', dial: '98', flag: '🇮🇷' },
  { code: 'IQ', name: 'Irak', dial: '964', flag: '🇮🇶' },
  { code: 'SA', name: 'Suudi Arabistan', dial: '966', flag: '🇸🇦' },
  { code: 'AE', name: 'BAE', dial: '971', flag: '🇦🇪' },
  { code: 'QA', name: 'Katar', dial: '974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuveyt', dial: '965', flag: '🇰🇼' },
  { code: 'GR', name: 'Yunanistan', dial: '30', flag: '🇬🇷' },
  { code: 'BG', name: 'Bulgaristan', dial: '359', flag: '🇧🇬' },
  { code: 'RO', name: 'Romanya', dial: '40', flag: '🇷🇴' },
  { code: 'MD', name: 'Moldova', dial: '373', flag: '🇲🇩' },
  { code: 'PL', name: 'Polonya', dial: '48', flag: '🇵🇱' },
  { code: 'KZ', name: 'Kazakistan', dial: '77', flag: '🇰🇿' },
  { code: 'CY', name: 'KKTC / Kıbrıs', dial: '357', flag: '🇨🇾' },
];

/** What a field starts on when nothing says otherwise. */
export const DEFAULT_COUNTRY = COUNTRIES[0];

export function findCountry(code: string): Country {
  return COUNTRIES.find((country) => country.code === code) ?? DEFAULT_COUNTRY;
}

const digitsOf = (value: string) => value.replace(/\D/g, '');

/**
 * Splits a stored number into the country it belongs to and the rest.
 *
 * A number written the old way — `0532 111 22 33`, no country at all — comes back as Türkiye with
 * the leading zero dropped, which is what it always meant.
 */
export function parsePhone(stored: string | null | undefined): {
  country: Country;
  national: string;
} {
  if (!stored || stored.trim().length === 0) {
    return { country: DEFAULT_COUNTRY, national: '' };
  }

  const trimmed = stored.trim();

  if (trimmed.startsWith('+')) {
    const digits = digitsOf(trimmed);

    // Longest dial code first: `+1` must not claim a `+90` number, and `+7` must not claim `+77`.
    const match = [...COUNTRIES]
      .sort((a, b) => b.dial.length - a.dial.length)
      .find((country) => digits.startsWith(country.dial));

    if (match) {
      return { country: match, national: digits.slice(match.dial.length) };
    }

    return { country: DEFAULT_COUNTRY, national: digits };
  }

  // No country marker. Domestic, written the way a receptionist writes it.
  return { country: DEFAULT_COUNTRY, national: digitsOf(trimmed).replace(/^0+/, '') };
}

/**
 * Groups the national part for reading.
 *
 * Only where the shape is known. Inventing groups for a country whose numbering this file does not
 * model would make a correct number look wrong.
 */
export function formatNational(country: Country, national: string): string {
  const digits = digitsOf(national);

  if (country.code === 'TR') {
    // 5xx xxx xx xx, applied progressively so it reads correctly while being typed.
    const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)];
    return parts.filter((part) => part.length > 0).join(' ');
  }

  if (country.code === 'US') {
    const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)];
    return parts.filter((part) => part.length > 0).join(' ');
  }

  return digits;
}

/** Everything a field holds, as the one string the API takes. Null when nothing was typed. */
export function composePhone(country: Country, national: string): string | null {
  const digits = digitsOf(national);
  return digits.length === 0 ? null : `+${country.dial} ${formatNational(country, digits)}`;
}

/**
 * The digits a person may still type.
 *
 * Turkish mobiles are ten digits and a leading zero is the domestic prefix, not part of the number —
 * typing `0532…` into a field already showing `+90` would otherwise store eleven.
 */
export function acceptNationalInput(country: Country, raw: string): string {
  let digits = digitsOf(raw);

  if (country.code === 'TR' && digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }

  return country.nationalLength ? digits.slice(0, country.nationalLength) : digits.slice(0, 15);
}

/** A readable form for anywhere a stored number is displayed rather than edited. */
export function formatPhoneForDisplay(stored: string | null | undefined): string | null {
  if (!stored || stored.trim().length === 0) return null;

  const { country, national } = parsePhone(stored);
  if (national.length === 0) return stored.trim();

  return `+${country.dial} ${formatNational(country, national)}`;
}
