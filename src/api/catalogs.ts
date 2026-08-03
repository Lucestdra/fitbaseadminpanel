import { client, withAuth } from './client';
import type { components } from './schema';

export type CatalogSnapshot = components['schemas']['CatalogSnapshot'];
export type LeadStageEntry = components['schemas']['LeadStageEntry'];
export type LeadSourceEntry = components['schemas']['LeadSourceEntry'];
export type LabelledEntry = components['schemas']['LabelledEntry'];
export type PackageTemplateEntry = components['schemas']['PackageTemplateEntry'];
export type GiftTemplateEntry = components['schemas']['GiftTemplateEntry'];
export type CatalogEntryUsage = components['schemas']['CatalogEntryUsage'];
export type CatalogReference = components['schemas']['CatalogReference'];
export type GiftEffectType = components['schemas']['GiftEffectType'];
export type LifecycleStatus = components['schemas']['LifecycleStatus'];
export type LeadStageSemanticRole = components['schemas']['LeadStageSemanticRole'];

/**
 * The URL segment for each catalog.
 *
 * Kebab-case in the path, PascalCase in a JSON body — each follows its own convention, and the
 * server maps between them from a closed table rather than parsing the enum, which would accept
 * every casing variant and the numeric value too.
 */
export type CatalogKindSegment =
  | 'lead-stages'
  | 'lead-sources'
  | 'interests'
  | 'class-categories'
  | 'package-templates'
  | 'gift-templates';

export async function getCatalogs(): Promise<CatalogSnapshot> {
  return withAuth(() => client.GET('/api/v1/catalogs', {}));
}

/**
 * What is pointing at an entry.
 *
 * Asked <b>before</b> offering a delete, so the conflict dialog can say what would break rather
 * than the studio finding out from a 409. The server refuses regardless — this is the courteous
 * version of the same answer, not the check.
 */
export async function getCatalogEntryUsage(
  kind: CatalogKindSegment,
  entryId: string,
): Promise<CatalogEntryUsage> {
  return withAuth(() =>
    client.GET('/api/v1/catalogs/{kind}/{entryId}/usage', {
      params: { path: { kind, entryId } },
    }),
  );
}

export async function createLeadStage(body: {
  title: string;
  statusLabel: string;
  tone: string;
}): Promise<LeadStageEntry> {
  return withAuth(() => client.POST('/api/v1/catalogs/lead-stages', { body }));
}

export async function updateLeadStage(
  entryId: string,
  body: { title: string; statusLabel: string; tone: string },
): Promise<LeadStageEntry> {
  return withAuth(() =>
    client.PUT('/api/v1/catalogs/lead-stages/{entryId}', {
      params: { path: { entryId } },
      body,
    }),
  );
}

export async function createLeadSource(body: {
  label: string;
  icon: string;
}): Promise<LeadSourceEntry> {
  return withAuth(() => client.POST('/api/v1/catalogs/lead-sources', { body }));
}

export async function updateLeadSource(
  entryId: string,
  body: { label: string; icon: string },
): Promise<LeadSourceEntry> {
  return withAuth(() =>
    client.PUT('/api/v1/catalogs/lead-sources/{entryId}', {
      params: { path: { entryId } },
      body,
    }),
  );
}

export async function createInterest(label: string): Promise<LabelledEntry> {
  return withAuth(() => client.POST('/api/v1/catalogs/interests', { body: { label } }));
}

export async function updateInterest(entryId: string, label: string): Promise<LabelledEntry> {
  return withAuth(() =>
    client.PUT('/api/v1/catalogs/interests/{entryId}', {
      params: { path: { entryId } },
      body: { label },
    }),
  );
}

export async function createClassCategory(label: string): Promise<LabelledEntry> {
  return withAuth(() => client.POST('/api/v1/catalogs/class-categories', { body: { label } }));
}

export async function updateClassCategory(entryId: string, label: string): Promise<LabelledEntry> {
  return withAuth(() =>
    client.PUT('/api/v1/catalogs/class-categories/{entryId}', {
      params: { path: { entryId } },
      body: { label },
    }),
  );
}

/**
 * Creates a package template.
 *
 * `price` is a number and `sessionCount` is `null` for unlimited. The panel stored `'₺2.400'` and
 * parsed it back by stripping non-digits, which read `₺2.400,50` as 240050 — that regex is gone
 * and this is what replaces it.
 */
export async function createPackageTemplate(body: {
  name: string;
  price: number;
  sessionCount: number | null;
  durationDays: number;
}): Promise<PackageTemplateEntry> {
  return withAuth(() => client.POST('/api/v1/catalogs/package-templates', { body }));
}

export async function updatePackageTemplate(
  entryId: string,
  body: {
    name: string;
    price: number;
    sessionCount: number | null;
    durationDays: number;
  },
): Promise<PackageTemplateEntry> {
  return withAuth(() =>
    client.PUT('/api/v1/catalogs/package-templates/{entryId}', {
      params: { path: { entryId } },
      body,
    }),
  );
}

/**
 * Creates a gift template with a structured effect.
 *
 * The panel encoded the effect in a free-text description — "Üyeliğin bitiş tarihine 1 ay ekler" —
 * which no code can act on, so granting a gift changed nothing but a list. `(effectType, amount)`
 * is what lets Phase 2.2 actually apply it.
 */
export async function createGiftTemplate(body: {
  name: string;
  effectType: GiftEffectType;
  effectAmount: number;
  description: string | null;
}): Promise<GiftTemplateEntry> {
  return withAuth(() => client.POST('/api/v1/catalogs/gift-templates', { body }));
}

export async function updateGiftTemplate(
  entryId: string,
  body: {
    name: string;
    effectType: GiftEffectType;
    effectAmount: number;
    description: string | null;
  },
): Promise<GiftTemplateEntry> {
  return withAuth(() =>
    client.PUT('/api/v1/catalogs/gift-templates/{entryId}', {
      params: { path: { entryId } },
      body,
    }),
  );
}

/**
 * Renumbers a catalog.
 *
 * Sends the complete list. A partial reorder would leave the unnamed entries where they were and
 * two of them sharing a position, which the server refuses rather than half-applies.
 */
export async function reorderCatalog(
  kind: CatalogKindSegment,
  orderedEntryIds: string[],
): Promise<void> {
  await withAuth(() =>
    client.POST('/api/v1/catalogs/{kind}/order', {
      params: { path: { kind } },
      body: { orderedEntryIds },
    }),
  );
}

/** Withdraws an entry from new work, or puts it back. Always available for a non-system entry. */
export async function setCatalogEntryStatus(
  kind: CatalogKindSegment,
  entryId: string,
  status: LifecycleStatus,
): Promise<void> {
  await withAuth(() =>
    client.POST('/api/v1/catalogs/{kind}/{entryId}/status', {
      params: { path: { kind, entryId } },
      body: { status },
    }),
  );
}

/**
 * Removes an entry, optionally moving live references to another first.
 *
 * Throws `ApiError` with `catalogs.entry.in_use` when something still points at it and no
 * replacement was given. The caller renders the conflict rather than swallowing it — the whole
 * point is that the studio decides between deactivating and reassigning.
 */
export async function deleteCatalogEntry(
  kind: CatalogKindSegment,
  entryId: string,
  reassignTo?: string,
): Promise<void> {
  await withAuth(() =>
    client.DELETE('/api/v1/catalogs/{kind}/{entryId}', {
      params: {
        path: { kind, entryId },
        query: reassignTo ? { reassignTo } : undefined,
      },
    }),
  );
}
