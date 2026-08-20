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
import { colors, radii, spacing, typography } from '@/theme';
import { conversations as initialConversations, messagesByConversation as initialMessages } from '@/mock/inbox';
import type { ChannelConnection } from '@/types/messaging';
import type { ChatMessage } from '@/types/inbox';

/** The statuses that mean the channel is carrying traffic. */
const LIVE: ChannelConnection['status'][] = ['Active', 'Degraded'];

export default function MessagesScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const { permissions } = useAuth();

  // Every channel the product supports, with the studio's real connections overlaid.
  const { channels, status: channelsStatus, connect, disconnect, reload } = useChannels();

  // Connecting binds a provider account to this organization and refuses it to every other one,
  // which is not a decision a coach makes: `integrations.manage` is held only by
  // OrganizationManager. Hiding the button is presentation — the endpoint refuses them anyway.
  const canManageChannels = permissions['integrations.manage'] !== undefined;

  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [connectDialogChannel, setConnectDialogChannel] = useState<ChannelConnection | null>(null);
  const [starting, setStarting] = useState(false);
  const [detailChannel, setDetailChannel] = useState<ChannelConnection | null>(null);
  const [conversations, setConversations] = useState(initialConversations);
  const [messagesByConversation, setMessagesByConversation] = useState(initialMessages);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConversations[0]?.id ?? null);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const { show } = useToast();

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;
  const activeMessages = activeConversationId ? messagesByConversation[activeConversationId] ?? [] : [];

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
    setActiveConversationId(id);
    setConversations((current) => current.map((c) => (c.id === id ? { ...c, unread: false } : c)));
    setMobileView('thread');
  };

  const handleSendMessage = (text: string) => {
    if (!activeConversationId) return;
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: activeConversationId,
      sender: 'studio',
      senderName: 'Sen',
      text,
      time: 'Şimdi',
      read: false,
    };
    setMessagesByConversation((current) => ({
      ...current,
      [activeConversationId]: [...(current[activeConversationId] ?? []), newMessage],
    }));
    setConversations((current) =>
      current.map((c) => (c.id === activeConversationId ? { ...c, lastMessage: text, lastMessageTime: 'Şimdi' } : c))
    );
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
                messages={activeMessages}
                onBack={isMobile ? () => setMobileView('list') : undefined}
                onCloseConversation={() => show('Görüşme kapatıldı.')}
                onMarkReplied={() => show('Konuşma cevaplandı olarak işaretlendi.')}
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
