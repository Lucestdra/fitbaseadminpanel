import { client, withAuth } from './client';
import type { components } from './schema';

export type OrganizationSettings = components['schemas']['OrganizationSettings'];
export type OrganizationProfile = components['schemas']['OrganizationProfile'];
export type OrganizationLocalization = components['schemas']['OrganizationLocalization'];
export type TaxProfileSummary = components['schemas']['TaxProfileSummary'];
export type BusinessHourInterval = components['schemas']['BusinessHourInterval'];
export type BusinessClosurePeriod = components['schemas']['BusinessClosurePeriod'];
export type NotificationPreference = components['schemas']['NotificationPreference'];
export type NotificationTopic = components['schemas']['NotificationTopic'];
export type NotificationChannel = components['schemas']['NotificationChannel'];
export type OrganizationSettingsSummary = components['schemas']['OrganizationSettingsSummary'];

export async function getSettings(): Promise<OrganizationSettings> {
  return withAuth(() => client.GET('/api/v1/organization/settings', {}));
}

/**
 * Every tile's counter, in one call.
 *
 * The settings screen is a grid of tiles each showing a count. Fetching each from its own endpoint
 * would be ten round trips to draw a menu.
 */
export async function getSettingsSummary(): Promise<OrganizationSettingsSummary> {
  return withAuth(() => client.GET('/api/v1/organization/settings/summary', {}));
}

export async function updateProfile(body: {
  name: string;
  address: string | null;
  phoneNumber: string | null;
  contactPersonName: string | null;
}): Promise<OrganizationProfile> {
  return withAuth(() => client.PUT('/api/v1/organization/settings/profile', { body }));
}

export async function updateLocalization(
  body: OrganizationLocalization,
): Promise<OrganizationLocalization> {
  return withAuth(() => client.PUT('/api/v1/organization/settings/localization', { body }));
}

/**
 * Updates the tax profile.
 *
 * `taxIdentifier` is write-only and three-valued, which is the whole reason this signature is
 * awkward: `null` leaves the stored number alone, `''` clears it, and a string replaces it. The
 * screen never receives the number back — only its last two digits — so without the null case a
 * form saving the company title would silently erase the identifier it never displayed.
 */
export async function updateTaxProfile(body: {
  companyTitle: string | null;
  taxOffice: string | null;
  taxIdentifier: string | null;
  billingAddress: string | null;
}): Promise<TaxProfileSummary> {
  return withAuth(() => client.PUT('/api/v1/organization/settings/tax', { body }));
}

/** Replaces the whole week. Anything omitted is deleted, so send every interval. */
export async function replaceBusinessHours(intervals: BusinessHourInterval[]): Promise<void> {
  await withAuth(() =>
    client.PUT('/api/v1/organization/settings/business-hours', {
      body: { intervals },
    }),
  );
}

export async function addClosure(body: {
  startsOn: string;
  endsOn: string;
  reason: string;
}): Promise<BusinessClosurePeriod> {
  return withAuth(() => client.POST('/api/v1/organization/settings/closures', { body }));
}

export async function removeClosure(closureId: string): Promise<void> {
  await withAuth(() =>
    client.DELETE('/api/v1/organization/settings/closures/{closureId}', {
      params: { path: { closureId } },
    }),
  );
}

/**
 * Turns one cell of the notification matrix on or off.
 *
 * A channel with no sender behind it is refused with `organizations.notification.channel_unavailable`
 * rather than stored — so the screen renders those rows as unavailable instead of as switches, and
 * never sends this for one.
 */
export async function setNotificationPreference(body: {
  topic: NotificationTopic;
  channel: NotificationChannel;
  isEnabled: boolean;
}): Promise<void> {
  await withAuth(() => client.PUT('/api/v1/organization/settings/notifications', { body }));
}
