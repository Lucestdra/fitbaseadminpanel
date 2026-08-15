import {
  CHANNEL_LABELS,
  CHANNEL_ORDER,
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
 * Every entry starts `Disconnected`, which is the true statement today: authorization is not open
 * (ADR-0043 §5, ADR-0045 §4), and no studio has a connection to report.
 */
export const AVAILABLE_CHANNELS: ChannelConnection[] = CHANNEL_ORDER.map((id) => ({
  id,
  label: CHANNEL_LABELS[id],
  accountName: null,
  status: 'Disconnected',
  connectedSince: null,
  lastInboundAt: null,
}));

/**
 * Overlays the studio's real connections onto the catalogue.
 *
 * Written now, used the moment `/api/v1/integrations/channels` exists: the screen enumerates every
 * channel the product supports rather than only the ones with a row, so "Messenger'ı nereden
 * bağlıyorum" is answered by a card rather than by its absence.
 */
export function mergeChannelConnections(
  connections: readonly ChannelConnection[],
): ChannelConnection[] {
  const byId = new Map<MessagingChannelId, ChannelConnection>(
    connections.map((connection) => [connection.id, connection]),
  );

  return AVAILABLE_CHANNELS.map((channel) => byId.get(channel.id) ?? channel);
}
