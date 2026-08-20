import { client, withAuth } from './client';
import type { components } from './schema';

export type ChannelConnectionSummary = components['schemas']['ChannelConnectionSummary'];
export type ChannelConnectStart = components['schemas']['ChannelConnectStart'];
export type ChannelProvider = components['schemas']['ChannelProvider'];
export type ChannelConnectionStatus = components['schemas']['ChannelConnectionStatus'];

/**
 * The channels this studio has connected.
 *
 * <b>Connections, not channels.</b> A channel nobody has authorized has no row and is absent from
 * this list — the catalogue of what the product supports is a client-side fact (`@/config/channels`)
 * and the two are overlaid for display. Asking the server to enumerate things that do not exist
 * would make it own a product decision it has no way to know.
 *
 * `integrations.read`, which every role holds: a coach who cannot see whether WhatsApp is connected
 * cannot tell a broken inbox from a quiet one.
 */
export async function listChannelConnections(): Promise<ChannelConnectionSummary[]> {
  return withAuth(() => client.GET('/api/v1/channels', {}));
}

/**
 * Begins an authorization and returns where to send the studio.
 *
 * <b>Creates no connection.</b> Nothing is written until the studio comes back and
 * {@link completeChannelConnection} is called with the state this minted — so a dialog that is
 * opened and abandoned leaves no row, and the card still reads "Bağlı Değil".
 *
 * The returned URL is opened, never fetched. It is the provider's own surface, it sets cookies in
 * the studio's browser, and a client that requested it with `fetch` would get an authorization page
 * nobody can interact with.
 *
 * `integrations.manage` — only `OrganizationManager` holds it.
 */
export async function startChannelConnection(
  provider: NonNullable<ChannelProvider>,
): Promise<ChannelConnectStart> {
  return withAuth(() => client.POST('/api/v1/channels/connect', { body: { provider } }));
}

/**
 * Finishes an authorization the studio has returned from.
 *
 * <b>Called by the panel with the session's own bearer token, not by the provider.</b> The obvious
 * shape for an OAuth return is an anonymous callback the provider redirects into; this is
 * deliberately not that. The studio lands back on `/kanallar/baglandi` while still signed in and
 * that screen calls this, so the organization comes from the token rather than from a query string
 * that has been through a third party and a browser the studio controls.
 *
 * @param state The single-use value {@link startChannelConnection} minted, carried through the
 *   redirect. It proves the flow is one this server began; it does not prove who is finishing it.
 * @param accountReference What the provider handed over — an already-connected account id on a
 *   gateway transport, an authorization code on a direct one. The connector knows which.
 */
export async function completeChannelConnection(
  state: string,
  accountReference: string,
): Promise<ChannelConnectionSummary> {
  return withAuth(() =>
    client.POST('/api/v1/channels/connect/complete', { body: { state, accountReference } }),
  );
}

/**
 * Ends a connection and asks the provider to revoke its access.
 *
 * Returns the connection in its `Disconnected` state rather than nothing: the row survives so the
 * history that references it still resolves, and the card can say when it ended.
 */
export async function disconnectChannel(
  connectionId: string,
): Promise<ChannelConnectionSummary> {
  return withAuth(() =>
    client.DELETE('/api/v1/channels/{connectionId}', {
      params: { path: { connectionId } },
    }),
  );
}
