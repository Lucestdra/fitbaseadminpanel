import { useCallback, useEffect, useRef, useState } from 'react';
import * as channelsApi from '@/api/channels';
import { useAuth } from '@/context/AuthContext';
import {
  AVAILABLE_CHANNELS,
  mergeChannelConnections,
  toChannelConnection,
} from '@/config/channels';
import { CHANNEL_PROVIDERS, type ChannelConnection } from '@/types/messaging';

export interface ChannelsState {
  /** Every channel the product supports, with the studio's real rows overlaid. */
  channels: ChannelConnection[];
  status: 'loading' | 'ready' | 'error';
}

/**
 * The studio's channels, and the two acts that change them.
 *
 * <b>Connecting leaves this screen, and that is why it is only half a round trip.</b>
 * {@link ChannelsState.connect} asks the server to mint a state and hand back a provider URL, then
 * navigates the browser to it. Nothing is written yet — the connection appears only when the studio
 * returns to `/kanallar/baglandi` and that screen completes the flow. So a dialog that is opened and
 * abandoned leaves no row, and no optimistic status is invented here for one.
 *
 * <b>Disconnecting refetches rather than patching.</b> The server keeps the row and moves it to
 * `Disconnected` so the conversations that reference it still resolve; reproducing that rule here
 * would be a second implementation of it.
 */
export function useChannels(): ChannelsState & {
  connect: (channel: ChannelConnection) => Promise<string>;
  disconnect: (channel: ChannelConnection) => Promise<void>;
  reload: () => void;
} {
  const { status: authStatus, timeZoneId } = useAuth();

  const [state, setState] = useState<ChannelsState>({
    channels: AVAILABLE_CHANNELS,
    status: 'loading',
  });
  const [reloadToken, setReloadToken] = useState(0);

  const generation = useRef(0);

  useEffect(() => {
    if (authStatus !== 'signedIn') {
      generation.current++;
      return;
    }

    const current = ++generation.current;

    void (async () => {
      try {
        const summaries = await channelsApi.listChannelConnections();

        if (generation.current !== current) return;

        const rows = summaries
          .map((summary) => toChannelConnection(summary, timeZoneId))
          .filter((row): row is ChannelConnection => row !== null);

        setState({ channels: mergeChannelConnections(rows), status: 'ready' });
      } catch {
        if (generation.current !== current) return;

        // The catalogue is kept rather than emptied. A studio with nothing connected and a failed
        // request would otherwise render identically — three cards offering to connect — and the
        // second one must not invite somebody to start a flow whose server is unreachable.
        setState((existing) => ({ ...existing, status: 'error' }));
      }
    })();
  }, [authStatus, reloadToken, timeZoneId]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  /**
   * Starts an authorization and returns where to send the studio.
   *
   * The URL is returned rather than opened here: navigating is a platform act — a redirect on web,
   * a browser hand-off on native — and a hook that performed it would be untestable and would make
   * this file import a navigation library to do the work of one line in a screen.
   */
  const connect = useCallback(async (channel: ChannelConnection) => {
    const start = await channelsApi.startChannelConnection(CHANNEL_PROVIDERS[channel.id]);

    return start.authorizationUrl;
  }, []);

  const disconnect = useCallback(
    async (channel: ChannelConnection) => {
      // A card built from the catalogue rather than from a row has nothing to end. Reaching this
      // with a null id would mean the screen offered "Bağlantıyı Kes" on a channel that was never
      // connected, so it is refused loudly rather than sent to the server as an empty path segment.
      if (!channel.connectionId) {
        throw new Error(`${channel.label} bağlı değil.`);
      }

      await channelsApi.disconnectChannel(channel.connectionId);
      reload();
    },
    [reload],
  );

  return { ...state, connect, disconnect, reload };
}
