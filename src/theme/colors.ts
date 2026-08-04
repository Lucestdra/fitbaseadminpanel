export const colors = {
  primary: '#15E887',
  primaryDark: '#0EAE68',
  mintLight: '#ECFBF5',
  pageBackground: '#F7F8F7',
  cardBackground: '#FFFFFF',
  textPrimary: '#202321',
  textSecondary: '#707672',
  border: '#E6EAE7',
  warning: '#F59E0B',
  critical: '#EF4444',
  // Paired with `critical`, as `mintLight` is with `primary`. A refusal notice needs a fill that
  // is not the page background, or it reads as body text with a red icon next to it.
  criticalLight: '#FEF2F2',
  // The third of the same pair. A capacity notice on the booking sheet is a caution rather than a
  // refusal, and using `criticalLight` for it would make a full class look like an error.
  warningLight: '#FFFBEB',
  info: '#3B82F6',
  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
