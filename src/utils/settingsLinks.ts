/**
 * The settings sections, and how to link straight to one.
 *
 * <b>Lives here rather than on the route.</b> An empty state on the member drawer needs to say
 * "Paket Tanımla" and mean the packages section — importing that from `app/ayarlar.tsx` would make
 * a screen a module other screens depend on, and expo-router treats route files as routes.
 */
export const SETTINGS_SECTION_IDS = [
  'studio',
  'tax',
  'hours',
  'closures',
  'localization',
  'receivables',
  'subscription',
  'packages',
  'gifts',
  'stages',
  'sources',
  'interests',
  'categories',
  'notifications',
  'whatsapp',
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number];

/** Narrows whatever arrived on the query string. */
export function toSettingsSection(value: string | string[] | undefined): SettingsSectionId | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return SETTINGS_SECTION_IDS.find((id) => id === candidate) ?? null;
}

/** The href that opens the settings screen with `section` already expanded. */
export function settingsSectionHref(section: SettingsSectionId): string {
  return `/ayarlar?bolum=${section}`;
}
