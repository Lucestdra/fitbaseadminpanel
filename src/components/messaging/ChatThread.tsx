import { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import { AvatarWithBadge } from './AvatarWithBadge';
import { MessageBubble } from './MessageBubble';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { Conversation, ChatMessage } from '@/types/inbox';

const CHANNEL_LABEL = { whatsapp: 'WhatsApp', instagram: 'Instagram' } as const;

interface ChatThreadProps {
  conversation: Conversation;
  messages: ChatMessage[];
  onBack?: () => void;
  onCloseConversation: () => void;
  onMarkReplied: () => void;
  onSendMessage: (text: string) => void;
}

export function ChatThread({
  conversation,
  messages,
  onBack,
  onCloseConversation,
  onMarkReplied,
  onSendMessage,
}: ChatThreadProps) {
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    if (!draft.trim()) return;
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
          <Text style={styles.headerChannel}>{CHANNEL_LABEL[conversation.channel]}</Text>
        </View>
      </View>

      <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
        <View style={styles.dateDivider}>
          <Text style={styles.dateDividerText}>Bugün</Text>
        </View>
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
        <Text style={styles.conversationRef}>Konuşma No: {conversation.tagId ?? conversation.id.toUpperCase()}</Text>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Mesaj yaz..."
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          accessibilityLabel="Mesaj yaz"
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
          accessibilityRole="button"
          accessibilityLabel="Gönder"
          style={({ pressed }) => [styles.sendButton, pressed && styles.sendButtonPressed]}
        >
          <AppIcon name="send-outline" size={16} color={colors.white} />
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
  dateDivider: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dateDividerText: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.pageBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
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
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
});
