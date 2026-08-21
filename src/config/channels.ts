import type { ChannelConnectionSummary } from '@/api/channels';
import { formatInstantIn } from '@/utils/instants';
import {
  CHANNEL_LABELS,
  CHANNEL_ORDER,
  CHANNEL_PROVIDERS,
  type ChannelConnection,
  type MessagingChannelId,
} from '@/types/messaging';

/**
 * The channels the product offers, before any of them is connected.
 *
 * <b>Not a mock, and deliberately not in `src/mock/`.</b> A mock stands in for data the server would
 * have sent; this is the catalogue of what the product supports, which is a client-side fact either
 * way — the server returns the studio's *connections*, and a channel with no connection has nothing
 * to return. The list is what the connect screen enumerates; the server's rows overwrite the status
 * of any channel it has one for.
 *
 * Every entry starts `Disconnected`, which is the true statement for a studio that has authorized
 * nothing: three cards, each offering to connect.
 */
export const AVAILABLE_CHANNELS: ChannelConnection[] = CHANNEL_ORDER.map((id) => ({
  id,
  label: CHANNEL_LABELS[id],
  connectionId: null,
  accountName: null,
  status: 'Disconnected',
  connectedSince: null,
  lastInboundAt: null,
}));

/** Wire provider → the id this panel keys presentation by. Derived, so the two cannot drift. */
const CHANNEL_BY_PROVIDER = new Map<string, MessagingChannelId>(
  CHANNEL_ORDER.map((id) => [CHANNEL_PROVIDERS[id], id]),
);

/**
 * The presentation id for a wire provider, or null for one this panel does not render.
 *
 * <b>Exported because the inbox needs the same answer</b> — a conversation carries `provider` as a
 * bare string and has to reach the same icon, label and badge a channel card does. A second map
 * built from the same constants would agree today and drift the first time a channel is added.
 *
 * Null rather than a throw: `ChannelProvider` carries `Telegram` and `TikTok`, which are registered
 * in the vocabulary and unimplemented here, so a row naming one is an ordinary state the caller
 * decides about — a channel card drops it, and the inbox drops the conversation with it.
 */
export function channelIdForProvider(provider: string): MessagingChannelId | null {
  return CHANNEL_BY_PROVIDER.get(provider) ?? null;
}

/**
 * One server row, in the shape the cards read.
 *
 * <b>The instants are formatted here rather than in the components.</b> Both are rendered in two
 * places, and both have to be read in the *studio's* zone rather than the device's — a delivery at
 * 01:20 in Istanbul is the previous evening in UTC and a different day again on a laptop in London.
 * Doing it once, at the edge where the server's ISO strings arrive, means no card has to remember.
 *
 * @param timeZoneId The organization's zone, from `useAuth`.
 */
export function toChannelConnection(
  summary: ChannelConnectionSummary,
  timeZoneId: string,
): ChannelConnection | null {
  const id = channelIdForProvider(summary.provider);

  // `ChannelProvider` carries `Telegram` and `TikTok`, which are registered and unimplemented
  // (vocabulary §ChannelProvider). A row for one of them has no card, no icon and no label, so it
  // is dropped rather than rendered as a blank entry — and it reappears the moment this panel
  // learns the channel, because the map above is what decides.
  if (!id) return null;

  return {
    id,
    label: CHANNEL_LABELS[id],
    connectionId: summary.id,
    accountName: summary.displayName,
    status: summary.status,
    connectedSince: formatInstantIn(summary.connectedAt, timeZoneId),
    lastInboundAt: summary.lastWebhookAt
      ? formatInstantIn(summary.lastWebhookAt, timeZoneId)
      : null,
  };
}

/**
 * Overlays the studio's real connections onto the catalogue.
 *
 * The screen enumerates every channel the product supports rather than only the ones with a row, so
 * "Messenger'ı nereden bağlıyorum" is answered by a card rather than by its absence.
 *
 * <b>The newest row wins, which is why the fold keeps the first and not the last.</b> A studio that
 * connected WhatsApp, disconnected it and connected it again has two rows for one card, and the
 * list arrives newest first. Overwriting as it goes — the obvious `new Map(connections.map(...))` —
 * would leave the oldest in place and show a live channel as `Disconnected` on the strength of a
 * row it has already replaced.
 */
export function mergeChannelConnections(
  connections: readonly ChannelConnection[],
): ChannelConnection[] {
  const byId = new Map<MessagingChannelId, ChannelConnection>();

  for (const connection of connections) {
    if (!byId.has(connection.id)) {
      byId.set(connection.id, connection);
    }
  }

  return AVAILABLE_CHANNELS.map((channel) => byId.get(channel.id) ?? channel);
}
