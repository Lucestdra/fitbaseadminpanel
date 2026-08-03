import type { components } from '@/api/schema';
import type { IconName } from './dashboard';
import type { BadgeTone } from '@/components/ui/Badge';

export interface TaxInfo {
  taxOffice: string;
  taxNumber: string;
  companyTitle: string;
  billingAddress: string;
  documentName: string | null;
}

export interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'odendi' | 'bekliyor';
  fileName: string;
}

export interface SubscriptionInfo {
  planName: string;
  price: string;
  renewalDate: string;
  memberLimit: number;
  memberUsage: number;
}

export type PackageStatus = 'aktif' | 'pasif';

export interface PackageTemplate {
  id: string;
  name: string;
  price: string;
  sessionCount: number | null;
  durationDays: number;
  status: PackageStatus;
}

export interface GiftTemplate {
  id: string;
  name: string;
  description: string;
}

/**
 * The server's shapes, under the names the screens already use.
 *
 * <b>Aliases, not parallel interfaces.</b> Two declarations of "a lead source" is how the client's
 * idea of one drifts from the server's, and the drift stays invisible until a field nobody mapped
 * turns up missing at runtime.
 *
 * Both widen a field the panel had narrowed: `tone` and `icon` are `string` on the wire. The
 * server validates `tone` against a closed set with a check constraint, and deliberately does not
 * validate `icon` — the client owns which icons it ships, and a server that guessed would reject
 * new ones. Narrow them at the render boundary with the two helpers below.
 */
export type LeadSourceOption = components['schemas']['LeadSourceEntry'];

export type LeadStageOption = components['schemas']['LeadStageEntry'];

/** An interest or a class category — a label and nothing else. */
export type LabelledCatalogEntry = components['schemas']['LabelledEntry'];

export type PackageTemplateEntry = components['schemas']['PackageTemplateEntry'];

export type GiftTemplateEntry = components['schemas']['GiftTemplateEntry'];

/**
 * Narrows a server tone to a badge tone.
 *
 * An unrecognised value falls back to `neutral` rather than throwing. A stage rendering in the
 * wrong colour is a smaller failure than a list that does not render, and the database constraint
 * already makes the case unreachable through the API.
 */
export function toBadgeTone(tone: string): BadgeTone {
  return tone === 'mint' || tone === 'warning' || tone === 'info' || tone === 'dark'
    ? tone
    : 'neutral';
}

/** Same idea for icons, where the panel's `IconName` is the set it actually ships. */
export function toIconName(icon: string, fallback: IconName = 'pricetag-outline'): IconName {
  return icon ? (icon as IconName) : fallback;
}

export interface WorkingHoursDay {
  id: string;
  label: string;
  isOpen: boolean;
  start: string;
  end: string;
}

export interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}
