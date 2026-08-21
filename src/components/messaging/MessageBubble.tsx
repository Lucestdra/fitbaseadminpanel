import { View, Text, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { MESSAGE_STATUS_LABELS } from '@/config/inbox';
import { colors, spacing, typography, radii } from '@/theme';
import type { IconName } from '@/types/dashboard';
import type { MessageStatus } from '@/api/messaging';
import type { ChatMessage } from '@/types/inbox';

interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * The mark beside an outbound message's time.
 *
 * <b>A distinct icon per group, because the groups mean different things to the studio.</b> A clock
 * says nothing has left yet, one tick says the provider took it, two say the customer's device has
 * it, and a warning says it will never arrive. The version this replaces drew two ticks and
 * "Okundu" or nothing at all — which made "queued forever" and "sent a second ago" identical.
 */
const STATUS_ICONS: Record<NonNullable<MessageStatus>, IconName> = {
  Pending: 'time-outline',
  Queued: 'time-outline',
  Sending: 'time-outline',
  Sent: 'checkmark-outline',
  Delivered: 'checkmark-done-outline',
  Read: 'checkmark-done-outline',
  Failed: 'alert-circle-outline',
  Cancelled: 'close-circle-outline',
};

/** The statuses that are a problem the studio has to see rather than a step on the way. */
const FAILED: NonNullable<MessageStatus>[] = ['Failed', 'Cancelled'];

export function MessageBubble({ message }: MessageBubbleProps) {
  const isStudio = message.sender === 'studio';
  const status = message.status;
  const failed = status !== undefined && FAILED.includes(status);

  return (
    <View style={[styles.row, isStudio && styles.rowStudio]}>
      <View style={[styles.bubble, isStudio ? styles.bubbleStudio : styles.bubbleContact]}>
        <Text style={[styles.senderName, isStudio && styles.senderNameStudio]}>{message.senderName}</Text>
        <Text style={[styles.text, isStudio && styles.textStudio]}>{message.text}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.time, isStudio && styles.timeStudio]}>{message.time}</Text>
          {isStudio && status !== undefined && (
            <View style={styles.statusRow}>
              <AppIcon
                name={STATUS_ICONS[status]}
                size={12}
                color={failed ? colors.criticalLight : 'rgba(255,255,255,0.85)'}
              />
              <Text style={[styles.statusLabel, failed && styles.statusLabelFailed]}>
                {MESSAGE_STATUS_LABELS[status]}
              </Text>
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statusLabel: {
    ...typography.caption,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },
  statusLabelFailed: {
    color: colors.criticalLight,
    fontWeight: '700',
  },
});
