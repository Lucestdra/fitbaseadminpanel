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
  info: '#3B82F6',
  white: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof colors;
