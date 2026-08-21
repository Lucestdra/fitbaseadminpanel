import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AvatarWithBadge } from './AvatarWithBadge';
import { colors, spacing, typography, radii } from '@/theme';
import type { Conversation } from '@/types/inbox';

interface ConversationListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onPress: () => void;
}

export function ConversationListItem({ conversation, isActive, onPress }: ConversationListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${conversation.contactName} sohbeti, ${conversation.lastMessage}`}
      style={({ pressed, hovered }: any) => [
        styles.row,
        isActive && styles.rowActive,
        hovered && !isActive && styles.rowHovered,
        pressed && styles.rowPressed,
      ]}
    >
      <AvatarWithBadge
        initials={conversation.avatarInitials}
        channel={conversation.channel}
        imageUrl={conversation.avatarUrl}
        size={44}
      />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, conversation.unread && styles.nameUnread]} numberOfLines={1}>
            {conversation.contactName}
          </Text>
          <Text style={styles.time}>{conversation.lastMessageTime}</Text>
        </View>
        <View style={styles.previewRow}>
          <Text style={[styles.preview, conversation.unread && styles.previewUnread]} numberOfLines={1}>
            {conversation.lastMessage}
          </Text>
          {conversation.tagId && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{conversation.tagId}</Text>
            </View>
          )}
          {conversation.unread && <View style={styles.unreadDot} />}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
  },
  rowHovered: {
    backgroundColor: colors.pageBackground,
  },
  rowPressed: {
    backgroundColor: colors.mintLight,
  },
  rowActive: {
    backgroundColor: colors.mintLight,
  },
  body: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  name: {
    ...typography.body,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  nameUnread: {
    ...typography.bodyStrong,
  },
  time: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  preview: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  previewUnread: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    backgroundColor: colors.pageBackground,
  },
  tagText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
