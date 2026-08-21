import { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { AvatarWithBadge } from './AvatarWithBadge';
import { MessageBubble } from './MessageBubble';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { CHANNEL_LABELS } from '@/types/messaging';
import type { Conversation, ChatMessage } from '@/types/inbox';

interface ChatThreadProps {
  conversation: Conversation;
  messages: ChatMessage[];
  /** Where the thread's own load got to. The header renders from the list row meanwhile. */
  status: 'idle' | 'loading' | 'ready' | 'error';
  /**
   * Whether an ordinary reply may be sent right now.
   *
   * <b>The server's answer, not a guess.</b> `ConversationDetail.canSendFreeForm` is false outside
   * the provider's window, and a composer that stays live there collects a reply, sends it, and
   * shows a 422 the studio cannot act on — after they have already written it.
   */
  canSend: boolean;
  /** Why not, in a sentence. Null while {@link canSend} is true. */
  sendBlockedReason: string | null;
  /** A send is in flight. The button waits rather than queueing a second one. */
  sending: boolean;
  onBack?: () => void;
  onCloseConversation: () => void;
  onMarkReplied: () => void;
  onSendMessage: (text: string) => void;
}

export function ChatThread({
  conversation,
  messages,
  status,
  canSend,
  sendBlockedReason,
  sending,
  onBack,
  onCloseConversation,
  onMarkReplied,
  onSendMessage,
}: ChatThreadProps) {
  const [draft, setDraft] = useState('');

  const composerEnabled = canSend && !sending;

  const handleSend = () => {
    if (!composerEnabled || !draft.trim()) return;
    onSendMessage(draft.trim());
    setDraft('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {onBack && (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Sohbet listesine dön"
            hitSlop={8}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <AppIcon name="chevron-back" size={18} color={colors.textPrimary} />
          </Pressable>
        )}
        <AvatarWithBadge initials={conversation.avatarInitials} channel={conversation.channel} size={36} />
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerName} numberOfLines={1}>{conversation.contactName}</Text>
          <Text style={styles.headerChannel}>{CHANNEL_LABELS[conversation.channel]}</Text>
        </View>
      </View>

      {/*
        No date divider. The version this replaces drew a fixed "Bugün" above every thread, which
        was a caption on data it had not read — a message from last week sat under it unchallenged.
        Each bubble now carries its own date when it is not from today, which is the same fact
        without a heading that can be wrong.
      */}
      <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
        {status === 'loading' && (
          <View style={styles.threadNotice}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.threadNoticeText}>Mesajlar yükleniyor…</Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.threadNotice}>
            <AppIcon name="alert-circle-outline" size={20} color={colors.critical} />
            <Text style={styles.threadNoticeText}>
              Bu konuşma açılamadı. Listeden tekrar seç ya da sayfayı yenile.
            </Text>
          </View>
        )}

        {status === 'ready' && messages.length === 0 && (
          <View style={styles.threadNotice}>
            <Text style={styles.threadNoticeText}>Bu konuşmada henüz mesaj yok.</Text>
          </View>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ScrollView>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onCloseConversation}
          accessibilityRole="button"
          accessibilityLabel="Görüşmeyi kapat"
          style={({ pressed }) => [styles.actionChip, pressed && styles.actionChipPressed]}
        >
          <Text style={styles.actionChipText}>Görüşmeyi Kapat</Text>
        </Pressable>
        <Pressable
          onPress={onMarkReplied}
          accessibilityRole="button"
          accessibilityLabel="Cevaplandı olarak işaretle"
          style={({ pressed }) => [styles.actionChip, pressed && styles.actionChipPressed]}
        >
          <Text style={styles.actionChipText}>Cevaplandı Olarak İşaretle</Text>
        </Pressable>
        {/* The first segment of the id. Enough to quote in a support message, short enough to read. */}
        <Text style={styles.conversationRef}>
          Konuşma No: {conversation.tagId ?? conversation.id.slice(0, 8).toLocaleUpperCase('tr')}
        </Text>
      </View>

      {!canSend && sendBlockedReason !== null && (
        <View style={styles.blockedNotice}>
          <AppIcon name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.blockedNoticeText}>{sendBlockedReason}</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={canSend ? 'Mesaj yaz...' : 'Şu an yanıt gönderilemiyor'}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, !canSend && styles.inputDisabled]}
          accessibilityLabel="Mesaj yaz"
          editable={canSend}
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
          disabled={!composerEnabled}
          accessibilityRole="button"
          accessibilityLabel="Gönder"
          accessibilityState={{ disabled: !composerEnabled }}
          style={({ pressed }) => [
            styles.sendButton,
            !composerEnabled && styles.sendButtonDisabled,
            pressed && composerEnabled && styles.sendButtonPressed,
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <AppIcon name="send-outline" size={16} color={colors.white} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  headerTextGroup: {
    gap: 1,
  },
  headerName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  headerChannel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  threadNotice: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  threadNoticeText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  blockedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.pageBackground,
  },
  blockedNoticeText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionChip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionChipPressed: {
    backgroundColor: colors.pageBackground,
  },
  actionChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  conversationRef: {
    ...typography.caption,
    color: colors.primaryDark,
    marginLeft: 'auto',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    flex: 1,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    color: colors.textPrimary,
    outlineStyle: 'none' as never,
  },
  inputDisabled: {
    color: colors.textSecondary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  sendButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
});
