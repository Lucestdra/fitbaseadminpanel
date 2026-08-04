/**
 * The initials on an avatar.
 *
 * <b>`toLocaleUpperCase('tr')` and not `toUpperCase()`.</b> Turkish has a dotted and a dotless i,
 * and the invariant uppercase of "i" is "I" rather than "İ" — so "İpek Yılmaz" would render as
 * "IY" under the default rule. Every studio using this product types Turkish names.
 *
 * Extracted when the third caller appeared. Two copies of six lines is not worth a shared module;
 * three is the point where they start to drift.
 */
export function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toLocaleUpperCase('tr');
}
