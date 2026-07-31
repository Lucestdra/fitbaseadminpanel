import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { ChannelConnectionCard } from '@/components/messaging/ChannelConnectionCard';
import { ConnectedChannelIcon } from '@/components/messaging/ConnectedChannelIcon';
import { ChannelDetailModal } from '@/components/messaging/ChannelDetailModal';
import { AutomationInfoCard } from '@/components/messaging/AutomationInfoCard';
import { QrConnectModal } from '@/components/messaging/QrConnectModal';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ChatThread } from '@/components/messaging/ChatThread';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { colors, spacing, typography } from '@/theme';
import { channelConnections as initialChannels } from '@/mock/messaging';
import { conversations as initialConversations, messagesByConversation as initialMessages } from '@/mock/inbox';
import type { ChannelConnection } from '@/types/messaging';
import type { ChatMessage } from '@/types/inbox';

export default function MessagesScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const [channels, setChannels] = useState<ChannelConnection[]>(initialChannels);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [qrChannel, setQrChannel] = useState<ChannelConnection | null>(null);
  const [detailChannel, setDetailChannel] = useState<ChannelConnection | null>(null);
  const [conversations, setConversations] = useState(initialConversations);
  const [messagesByConversation, setMessagesByConversation] = useState(initialMessages);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConversations[0]?.id ?? null);
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list');
  const { message, visible, show } = useToast();

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;
  const activeMessages = activeConversationId ? messagesByConversation[activeConversationId] ?? [] : [];

  const handleDisconnect = (channel: ChannelConnection) => {
    setChannels((current) => current.map((item) => (item.id === channel.id ? { ...item, connected: false } : item)));
    show(`${channel.label} bağlantısı kesildi.`);
  };

  const handleConnect = (channel: ChannelConnection) => {
    setQrChannel(channel);
  };

  const handleConfirmConnect = () => {
    if (!qrChannel) return;
    setChannels((current) => current.map((item) => (item.id === qrChannel.id ? { ...item, connected: true } : item)));
    show(`${qrChannel.label} hesabı bağlandı.`);
    setQrChannel(null);
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
  const connectedChannels = channels.filter((channel) => channel.connected);
  const disconnectedChannels = channels.filter((channel) => !channel.connected);

  return (
    <AppShell activeId="messages">
      <View style={styles.header}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.title}>Mesajlar</Text>
          <Text style={styles.subtitle}>
            WhatsApp ve Instagram işletme hesaplarını bağla, gelen mesajlardan otomatik müşteri adayı oluştur.
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

      {disconnectedChannels.length > 0 && (
        <View style={isMobile || isTablet ? styles.stack : styles.row}>
          {disconnectedChannels.map((channel) => (
            <View key={channel.id} style={styles.channelItem}>
              <ChannelConnectionCard channel={channel} onDisconnect={handleDisconnect} onConnect={handleConnect} />
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

      <QrConnectModal
        channel={qrChannel}
        visible={qrChannel !== null}
        onClose={() => setQrChannel(null)}
        onConfirm={handleConfirmConnect}
      />

      <ChannelDetailModal
        channel={detailChannel}
        visible={detailChannel !== null}
        onClose={() => setDetailChannel(null)}
        onDisconnect={handleDisconnect}
      />

      <Toast message={message} visible={visible} />
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
