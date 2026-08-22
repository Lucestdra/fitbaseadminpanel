import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { ApiError, describeProblem } from '@/api/problem';
import { ChannelConnectionCard } from '@/components/messaging/ChannelConnectionCard';
import { ConnectedChannelIcon } from '@/components/messaging/ConnectedChannelIcon';
import { ChannelDetailModal } from '@/components/messaging/ChannelDetailModal';
import { AutomationInfoCard } from '@/components/messaging/AutomationInfoCard';
import { ChannelConnectDialog } from '@/components/messaging/ChannelConnectDialog';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ChatThread } from '@/components/messaging/ChatThread';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useChannels } from '@/hooks/useChannels';
import { useInbox } from '@/hooks/useInbox';
import { colors, radii, spacing, typography } from '@/theme';
import type { ChannelConnection } from '@/types/messaging';

/** The statuses that mean the channel is carrying traffic. */
const LIVE: ChannelConnection['status'][] = ['Active', 'Degraded'];

/**
 * Why the composer is locked, in terms the studio can act on.
 *
 * <b>Said before the send, not after it.</b> Both refusals come back from the server as a 422 with
 * a registered code, and both are knowable from the conversation header — so letting somebody write
 * a reply and then refusing it is a choice, not a limitation.
 */
const ARCHIVED_NOTICE =
  'Bu görüşme arşivlendi. Yanıt vermek için önce görüşmeyi yeniden açman gerekiyor.';

const WINDOW_CLOSED_NOTICE =
  'Sağlayıcının ücretsiz yanıt penceresi kapandı. Bu noktadan sonra yanıt vermek onaylı bir '
  + 'şablon gerektiriyor; şablon gönderimi henüz açık değil.';

export default function MessagesScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const { permissions } = useAuth();

  // Every channel the product supports, with the studio's real connections overlaid.
  const { channels, status: channelsStatus, connect, disconnect, reload } = useChannels();

  // Connecting binds a provider account to this organization and refuses it to every other one,
  // which is not a decision a coach makes: `integrations.manage` is held only by
  // OrganizationManager. Hiding the button is presentation — the endpoint refuses them anyway.
  const canManageChannels = permissions['integrations.manage'] !== undefined;

  // The studio's real inbox. Every conversation, message and status on this screen is the
  // server's — the version this replaces held eight fixtures in `useState`, which meant the panel
  // showed a working inbox on a deployment where no channel had ever been connected.
  const {
    conversations,
    counters,
    status: inboxStatus,
    thread,
    activeConversationId,
    activeConversation,
    sending,
    select,
    send,
    setStatus,
  } = useInbox();

  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [connectDialogChannel, setConnectDialogChannel] = useState<ChannelConnection | null>(null);
  const [starting, setStarting] = useState(false);
  const [detailChannel, setDetailChannel] = useState<ChannelConnection | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const { show } = useToast();

  const archived = thread.detail?.status === 'Closed' || thread.detail?.status === 'Spam';

  // Both halves come from the header the server just sent. `canSendFreeForm` is false outside the
  // provider's window; an archived thread is refused by `messaging.conversation.closed` before the
  // window is even consulted, so it is named first.
  const canSend = thread.detail !== null && !archived && thread.detail.canSendFreeForm;
  const sendBlockedReason = thread.detail === null
    ? null
    : archived
      ? ARCHIVED_NOTICE
      : thread.detail.canSendFreeForm
        ? null
        : WINDOW_CLOSED_NOTICE;

  const handleDisconnect = (channel: ChannelConnection) => {
    setDetailChannel(null);

    void (async () => {
      try {
        await disconnect(channel);
        show(`${channel.label} bağlantısı kesildi.`);
      } catch (thrown) {
        show(
          thrown instanceof ApiError
            ? describeProblem(thrown.problem)
            : `${channel.label} bağlantısı kesilemedi.`,
        );
      }
    })();
  };

  // Opens the explanation first. The version this replaces showed a QR code and a "Bağlantı Kuruldu"
  // button that flipped a local boolean — a WhatsApp Web pairing flow the backend forbids
  // (§11.1/§35) plus a connection the studio declared for itself. Connection status is
  // server-computed, and the dialog's own button is what starts the real authorization.
  //
  // forbidden-integration-check: discusses the prohibition.
  const handleConnect = (channel: ChannelConnection) => {
    setConnectDialogChannel(channel);
  };

  // Asks the server for an authorization URL and sends the browser to it.
  //
  // The dialog stays open behind the navigation rather than closing first: on web this replaces the
  // document, so closing it would buy a frame of flicker, and when the call fails the studio is
  // still looking at the thing they pressed.
  const handleStartAuthorization = (channel: ChannelConnection) => {
    if (starting) return;

    setStarting(true);

    void (async () => {
      try {
        const authorizationUrl = await connect(channel);

        // Same tab on web — `expo-linking` assigns `window.location` — which is what an
        // authorization flow wants: the provider returns to /kanallar/baglandi in the session the
        // studio already has, rather than into a second tab they then have to find.
        await Linking.openURL(authorizationUrl);
      } catch (thrown) {
        setStarting(false);
        setConnectDialogChannel(null);
        show(
          thrown instanceof ApiError
            ? describeProblem(thrown.problem)
            : `${channel.label} yetkilendirmesi başlatılamadı.`,
        );
      }
    })();
  };

  const handleSelectConversation = (id: string) => {
    select(id);
    setMobileView('thread');
  };

  // <b>The reply is queued, not sent, and the bubble says so.</b> The server persists it as
  // `Pending` and the outbound dispatcher carries it — so nothing here reports a delivery, and a
  // failure is shown rather than swallowed into a bubble that looks sent.
  //
  // <b>Returns whether it was accepted, and the composer reads the answer.</b> A screen that
  // reported the failure in a toast and cleared the box anyway lost what somebody had written; the
  // toast says what went wrong and the text stays where they can press send again.
  const handleSendMessage = async (text: string): Promise<boolean> => {
    try {
      await send(text);

      return true;
    } catch (thrown) {
      // `describeProblem` turns the server's registered code into a sentence — an archived thread,
      // a closed messaging window, a message the provider cannot carry. Anything else is a
      // connection that did not reach us at all, which is a different instruction to the reader.
      show(
        thrown instanceof ApiError
          ? describeProblem(thrown.problem)
          : 'Mesaj gönderilemedi. Bağlantını kontrol edip tekrar dene.',
      );

      return false;
    }
  };

  // "Görüşmeyi Kapat" and "Cevaplandı Olarak İşaretle" are the two registered states behind those
  // words — `Closed` archives the thread, `Resolved` says the studio is done with it and leaves it
  // reopenable. The version this replaces showed a toast and changed nothing.
  const handleSetStatus = (status: 'Closed' | 'Resolved', done: string) => {
    void (async () => {
      try {
        await setStatus(status);
        show(done);
      } catch (thrown) {
        show(
          thrown instanceof ApiError
            ? describeProblem(thrown.problem)
            : 'Görüşme durumu güncellenemedi.',
        );
      }
    })();
  };

  const showInboxList = !isMobile || mobileView === 'list';
  const showInboxThread = !isMobile || mobileView === 'thread';
  const connectedChannels = channels.filter((channel) => LIVE.includes(channel.status));
  const disconnectedChannels = channels.filter((channel) => !LIVE.includes(channel.status));

  return (
    <AppShell activeId="messages">
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.title}>Mesajlar</Text>
          <Text style={styles.subtitle}>
            WhatsApp, Instagram ve Messenger hesaplarını bağla; gelen mesajları buradan oku ve yanıtla.
          </Text>
        </View>
        {connectedChannels.length > 0 && (
          <View style={styles.connectedIconsRow}>
            {connectedChannels.map((channel) => (
              <ConnectedChannelIcon key={channel.id} channel={channel} onPress={() => setDetailChannel(channel)} />
            ))}
          </View>
        )}
      </View>

      {/*
        Nothing is drawn until the connections are known. The catalogue every card is built from
        says `Disconnected`, which is a claim rather than a placeholder — rendering it while the
        request is still out would tell a studio their live WhatsApp is not connected, and offer
        them a button to connect it again.
      */}
      {channelsStatus === 'error' && (
        <Card style={styles.channelsError}>
          <Text style={styles.channelsErrorText}>
            Kanal durumları alınamadı. Bağlı hesapların çalışmaya devam ediyor; bu ekran şu an
            durumlarını gösteremiyor.
          </Text>
          <Pressable
            onPress={reload}
            accessibilityRole="button"
            accessibilityLabel="Kanal durumlarını yeniden yükle"
            style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
          >
            <Text style={styles.retryLabel}>Tekrar Dene</Text>
          </Pressable>
        </Card>
      )}

      {channelsStatus === 'ready' && disconnectedChannels.length > 0 && (
        <View style={isMobile || isTablet ? styles.stack : styles.row}>
          {disconnectedChannels.map((channel) => (
            <View key={channel.id} style={styles.channelItem}>
              <ChannelConnectionCard
                channel={channel}
                canManage={canManageChannels}
                onDisconnect={handleDisconnect}
                onConnect={handleConnect}
              />
            </View>
          ))}
        </View>
      )}

      <AutomationInfoCard enabled={automationEnabled} onToggle={setAutomationEnabled} />

      <Card style={styles.inboxCard} noPadding>
        <View style={styles.inboxHeader}>
          <SectionHeader title="Gelen Kutusu" icon="chatbubbles-outline" />
        </View>
        <View style={[styles.inboxBody, isMobile && styles.inboxBodyMobile]}>
          {showInboxList && (
            <View style={[styles.listPane, isMobile && styles.listPaneMobile]}>
              <ConversationList
                conversations={conversations}
                openCount={counters?.open ?? null}
                status={inboxStatus}
                activeConversationId={activeConversationId}
                onSelect={handleSelectConversation}
              />
            </View>
          )}
          {!isMobile && <View style={styles.divider} />}
          {showInboxThread && activeConversation && (
            <View style={styles.threadPane}>
              <ChatThread
                conversation={activeConversation}
                messages={thread.messages}
                status={thread.status}
                canSend={canSend}
                sendBlockedReason={sendBlockedReason}
                sending={sending}
                onBack={isMobile ? () => setMobileView('list') : undefined}
                onCloseConversation={() => handleSetStatus('Closed', 'Görüşme kapatıldı.')}
                onMarkReplied={() =>
                  handleSetStatus('Resolved', 'Konuşma cevaplandı olarak işaretlendi.')
                }
                onSendMessage={handleSendMessage}
              />
            </View>
          )}
        </View>
      </Card>

      <ChannelConnectDialog
        channel={connectDialogChannel}
        visible={connectDialogChannel !== null}
        busy={starting}
        onClose={() => setConnectDialogChannel(null)}
        onConfirm={handleStartAuthorization}
      />

      <ChannelDetailModal
        channel={detailChannel}
        visible={detailChannel !== null}
        canManage={canManageChannels}
        onClose={() => setDetailChannel(null)}
        onDisconnect={handleDisconnect}
      />

    </AppShell>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerTextGroup: {
    gap: 4,
    flexShrink: 1,
  },
  title: {
    ...typography.pageTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.pageSubtitle,
    color: colors.textSecondary,
  },
  connectedIconsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xxl,
  },
  stack: {
    gap: spacing.xxl,
  },
  channelItem: {
    flex: 1,
  },
  channelsError: {
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  channelsErrorText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  retryButton: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  retryLabel: {
    ...typography.button,
    color: colors.textSecondary,
  },
  inboxCard: {
    height: 600,
  },
  inboxHeader: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  inboxBody: {
    flex: 1,
    flexDirection: 'row',
    paddingBottom: spacing.lg,
  },
  inboxBodyMobile: {
    paddingHorizontal: spacing.lg,
  },
  listPane: {
    width: 320,
    paddingLeft: spacing.lg,
  },
  listPaneMobile: {
    width: '100%',
    paddingLeft: 0,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  threadPane: {
    flex: 1,
    paddingRight: spacing.xxl,
  },
});
