export const radii = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radii;
