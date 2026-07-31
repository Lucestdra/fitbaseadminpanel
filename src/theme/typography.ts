export const typography = {
  pageTitle: { fontSize: 26, fontWeight: '700' as const, lineHeight: 32 },
  pageSubtitle: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  cardTitle: { fontSize: 15, fontWeight: '600' as const, lineHeight: 20 },
  kpiValue: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  kpiTitle: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  kpiChange: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodyStrong: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  captionStrong: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  navItem: { fontSize: 14, fontWeight: '500' as const, lineHeight: 18 },
  button: { fontSize: 14, fontWeight: '600' as const, lineHeight: 18 },
} as const;

export type TypographyToken = keyof typeof typography;
