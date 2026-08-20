import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography, radii } from '@/theme';
import {
  CHANNEL_META,
  CHANNEL_STATUS_LABELS,
  CHANNEL_STATUS_TONES,
  type ChannelConnection,
} from '@/types/messaging';

interface ChannelDetailModalProps {
  channel: ChannelConnection | null;
  visible: boolean;
  /** Whether this caller holds `integrations.manage`. False leaves the panel read-only. */
  canManage: boolean;
  onClose: () => void;
  onDisconnect: (channel: ChannelConnection) => void;
}

export function ChannelDetailModal({
  channel,
  visible,
  canManage,
  onClose,
  onDisconnect,
}: ChannelDetailModalProps) {
  if (!channel) return null;
  const meta = CHANNEL_META[channel.id];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: meta.backgroundColor }]}>
              <AppIcon name={meta.icon} size={18} color={meta.color} />
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.title}>{channel.label}</Text>
              <Text style={styles.accountName} numberOfLines={1}>
                {channel.accountName ?? '—'}
              </Text>
            </View>
            <Badge
              label={CHANNEL_STATUS_LABELS[channel.status]}
              tone={CHANNEL_STATUS_TONES[channel.status]}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Bağlantı Tarihi</Text>
              <Text style={styles.statValue}>{channel.connectedSince ?? '—'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Son Gelen Mesaj</Text>
              <Text style={styles.statValue}>{channel.lastInboundAt ?? 'Henüz yok'}</Text>
            </View>
          </View>

          {/* "Oluşan Müşteri Adayı" was here, as a mock count. Leads are not created from
              conversations automatically (ADR-0073) — promotion is a deliberate action — so the
              number was describing a behaviour the product does not have. */}

          {/* A coach reads this panel to see whether the channel is healthy; ending a connection
              stops every conversation on it, and that is `integrations.manage`. */}
          {canManage && (
            <Pressable
              onPress={() => {
                onDisconnect(channel);
                onClose();
              }}
              accessibilityRole="button"
              accessibilityLabel={`${channel.label} bağlantısını kes`}
              style={({ pressed }) => [styles.disconnectButton, pressed && styles.disconnectButtonPressed]}
            >
              <AppIcon name="unlink-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.disconnectLabel}>Bağlantıyı Kes</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayDismiss: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(32, 35, 33, 0.5)',
  },
  panel: {
    width: 340,
    maxWidth: '90%',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
    gap: 1,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  accountName: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statsRow: {
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disconnectButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  disconnectLabel: {
    ...typography.button,
    color: colors.textSecondary,
  },
});
