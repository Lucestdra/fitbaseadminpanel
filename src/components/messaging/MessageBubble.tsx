import { View, Text, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { ChatMessage } from '@/types/inbox';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isStudio = message.sender === 'studio';

  return (
    <View style={[styles.row, isStudio && styles.rowStudio]}>
      <View style={[styles.bubble, isStudio ? styles.bubbleStudio : styles.bubbleContact]}>
        <Text style={[styles.senderName, isStudio && styles.senderNameStudio]}>{message.senderName}</Text>
        <Text style={[styles.text, isStudio && styles.textStudio]}>{message.text}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.time, isStudio && styles.timeStudio]}>{message.time}</Text>
          {isStudio && message.read && (
            <View style={styles.readRow}>
              <AppIcon name="checkmark-done-outline" size={12} color="rgba(255,255,255,0.85)" />
              <Text style={styles.readLabel}>Okundu</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  rowStudio: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 4,
  },
  bubbleContact: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: 4,
  },
  bubbleStudio: {
    backgroundColor: colors.primaryDark,
    borderTopRightRadius: 4,
  },
  senderName: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  senderNameStudio: {
    color: 'rgba(255,255,255,0.75)',
  },
  text: {
    ...typography.body,
    color: colors.textPrimary,
  },
  textStudio: {
    color: colors.white,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  time: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  timeStudio: {
    color: 'rgba(255,255,255,0.75)',
  },
  readRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  readLabel: {
    ...typography.caption,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },
});
