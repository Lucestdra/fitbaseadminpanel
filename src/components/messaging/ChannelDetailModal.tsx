import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography, radii } from '@/theme';
import { CHANNEL_META, type ChannelConnection } from '@/types/messaging';

interface ChannelDetailModalProps {
  channel: ChannelConnection | null;
  visible: boolean;
  onClose: () => void;
  onDisconnect: (channel: ChannelConnection) => void;
}

export function ChannelDetailModal({ channel, visible, onClose, onDisconnect }: ChannelDetailModalProps) {
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
              <Text style={styles.accountName} numberOfLines={1}>{channel.accountName}</Text>
            </View>
            <Badge label="Bağlı" tone="mint" />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Bağlantı Tarihi</Text>
              <Text style={styles.statValue}>{channel.connectedSince}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Son Senkron</Text>
              <Text style={styles.statValue}>{channel.lastSync}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Oluşan Müşteri Adayı</Text>
              <Text style={styles.statValue}>{channel.leadsGenerated}</Text>
            </View>
          </View>

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
