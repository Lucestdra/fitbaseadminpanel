import { client, withAuth } from './client';
import type { components } from './schema';

export type ContactDetail = components['schemas']['ContactDetail'];
export type ContactIdentityView = components['schemas']['ContactIdentityView'];
export type ContactLinkView = components['schemas']['ContactLinkView'];
export type ContactMergeView = components['schemas']['ContactMergeView'];
export type ContactLinkKind = components['schemas']['ContactLinkKind'];
export type ContactMergeReason = components['schemas']['ContactMergeReason'];

/**
 * One contact, with every channel account known to be this person.
 *
 * <b>There is no "create contact" call, deliberately.</b> A contact comes into existence because
 * somebody messaged the studio — the provider identity is what makes them findable, and nothing a
 * person could type would produce one. What a person decides is which records are the same person
 * and which lead or member a contact belongs to.
 *
 * <b>Read `mergedIntoContactId` before rendering.</b> A non-null value means this is a tombstone and
 * the caller is holding an id from before a merge; the surviving contact is the one to show.
 */
export async function getContact(contactId: string): Promise<ContactDetail> {
  return withAuth(() =>
    client.GET('/api/v1/contacts/{contactId}', { params: { path: { contactId } } }),
  );
}

/**
 * Folds another contact into this one.
 *
 * <b>The path id is the survivor</b> and the body names the one that becomes a tombstone — so the URL
 * names the contact the person will be looking at afterwards. Reversible: the response carries the
 * merge in `merges`, and its id is what {@link unmergeContacts} takes.
 */
export async function mergeContacts(
  survivingContactId: string,
  sourceContactId: string,
): Promise<ContactDetail> {
  return withAuth(() =>
    client.POST('/api/v1/contacts/{contactId}/merges', {
      params: { path: { contactId: survivingContactId } },
      body: { sourceContactId },
    }),
  );
}

/**
 * Undoes one merge, moving back exactly what it moved.
 *
 * <b>Keyed on the merge, not the contact.</b> A contact may have several folded into it, and "undo
 * the merge" is ambiguous the moment there are two. Anything the studio added to the survivor after
 * the merge stays where it is.
 */
export async function unmergeContacts(mergeId: string): Promise<ContactDetail> {
  return withAuth(() =>
    client.DELETE('/api/v1/contacts/merges/{mergeId}', { params: { path: { mergeId } } }),
  );
}

/**
 * Points a lead or a member at a contact.
 *
 * Idempotent on the subject: linking the same member twice links once, and pointing it at a
 * different contact moves the link rather than adding a second — a member with two contacts is a
 * member whose conversations are split across two inboxes with nothing saying so.
 */
export async function linkContact(
  contactId: string,
  kind: NonNullable<ContactLinkKind>,
  subjectId: string,
): Promise<ContactDetail> {
  return withAuth(() =>
    client.PUT('/api/v1/contacts/{contactId}/links', {
      params: { path: { contactId } },
      body: { kind, subjectId },
    }),
  );
}
