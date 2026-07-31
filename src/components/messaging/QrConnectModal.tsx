import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { CHANNEL_META, type ChannelConnection } from '@/types/messaging';

interface QrConnectModalProps {
  channel: ChannelConnection | null;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const INSTRUCTIONS: Record<ChannelConnection['id'], string> = {
  whatsapp: 'WhatsApp uygulamanda Ayarlar > Bağlı Cihazlar > Cihaz Bağla adımını takip ederek bu kodu okut.',
  instagram: 'Meta Business Suite üzerinden işletme hesabınla bu kodu okutarak bağlan.',
};

// Fixed decorative pattern (not a real scannable QR code) — 9x9 grid, row-major booleans.
const QR_CELLS = [
  0, 0, 0, 1, 0, 1, 0, 0, 0,
  0, 0, 0, 0, 1, 0, 0, 0, 0,
  0, 0, 0, 1, 0, 1, 1, 0, 0,
  1, 0, 1, 0, 1, 0, 1, 0, 1,
  0, 1, 0, 1, 1, 0, 1, 1, 0,
  1, 0, 0, 0, 1, 0, 0, 0, 1,
  0, 0, 1, 1, 0, 1, 0, 1, 0,
  0, 0, 0, 0, 1, 0, 0, 0, 0,
  0, 0, 1, 0, 1, 0, 1, 0, 0,
].map((value) => value === 1);

function QrPattern() {
  const size = 9;

  const isFinderCell = (row: number, col: number) => {
    const inCorner = (r: number, c: number) => row >= r && row < r + 3 && col >= c && col < c + 3;
    return inCorner(0, 0) || inCorner(0, size - 3) || inCorner(size - 3, 0);
  };

  return (
    <View style={qrStyles.grid}>
      {Array.from({ length: size }).map((_, row) => (
        <View key={row} style={qrStyles.row}>
          {Array.from({ length: size }).map((_, col) => {
            const filled = isFinderCell(row, col) ? true : QR_CELLS[row * size + col];
            return (
              <View
                key={col}
                style={[qrStyles.cell, filled && qrStyles.cellFilled]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function QrConnectModal({ channel, visible, onClose, onConfirm }: QrConnectModalProps) {
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
            <Text style={styles.title}>{channel.label} Hesabını Bağla</Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              hitSlop={8}
              style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
            >
              <AppIcon name="close-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.qrWrapper}>
            <QrPattern />
          </View>

          <Text style={styles.instructions}>{INSTRUCTIONS[channel.id]}</Text>

          <Pressable
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel="Bağlantı kuruldu, devam et"
            style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmButtonPressed]}
          >
            <AppIcon name="checkmark-circle-outline" size={16} color={colors.white} />
            <Text style={styles.confirmLabel}>Bağlantı Kuruldu</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const qrStyles = StyleSheet.create({
  grid: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 2,
  },
  cell: {
    width: 12,
    height: 12,
    backgroundColor: colors.pageBackground,
    borderRadius: 1,
  },
  cellFilled: {
    backgroundColor: colors.textPrimary,
  },
});

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
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flex: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  qrWrapper: {
    alignSelf: 'center',
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  instructions: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  confirmButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  confirmLabel: {
    ...typography.button,
    color: colors.white,
  },
});
