import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { CHANNEL_META, type ChannelConnection } from '@/types/messaging';

/**
 * Explains how a channel is actually connected, and that the flow is not open yet.
 *
 * <b>This replaces `QrConnectModal`, which was a compliance violation rather than an unfinished
 * feature.</b> That modal told the studio to open "WhatsApp > Ayarlar > Bağlı Cihazlar > Cihaz
 * Bağla" and scan a code — WhatsApp Web linked-device pairing, which backend CLAUDE.md §11.1 and
 * §35 forbid outright. Meta forbids it too: pairing a business number as a linked device is not an
 * approved integration path, and building a product around it risks the number.
 *
 * It was also a lie in a second way. The confirm button flipped a boolean in local state, so the
 * panel reported a connected channel on the studio's say-so with nothing behind it. Connection
 * status is server-computed and always will be.
 *
 * The real flow is Embedded Signup: the studio authorizes through Meta, Meta hands the server a
 * code, and the server exchanges it. That is Phase 3.2 and is gated on Meta's Business
 * Verification and App Review, so this says so plainly instead of offering a button that cannot
 * work. An honest closed door beats a door that appears to open.
 *
 * forbidden-integration-check: discusses the prohibition. The words above name the flow this file
 * exists to refuse; naming it is how the next person understands why the door is closed.
 */
interface ChannelConnectNoticeProps {
  channel: ChannelConnection | null;
  visible: boolean;
  onClose: () => void;
}

const STEPS: Record<ChannelConnection['id'], string[]> = {
  whatsapp: [
    'Meta ile resmî yetkilendirme ekranı açılır.',
    'WhatsApp Business hesabını ve numaranı seçersin.',
    'Bağlantıyı sunucu kurar; onay burada görünür.',
  ],
  instagram: [
    'Meta ile resmî yetkilendirme ekranı açılır.',
    'İşletme veya içerik üretici Instagram hesabını seçersin.',
    'Bağlantıyı sunucu kurar; onay burada görünür.',
  ],
};

export function ChannelConnectNotice({ channel, visible, onClose }: ChannelConnectNoticeProps) {
  if (!channel) return null;
  const meta = CHANNEL_META[channel.id];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={styles.overlayDismiss}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />
        <View style={styles.panel}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: meta.backgroundColor }]}>
              <AppIcon name={meta.icon} size={18} color={meta.color} />
            </View>
            <Text style={styles.title}>{channel.label} Bağlantısı</Text>
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

          <View style={styles.pendingRow}>
            <AppIcon name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.pendingLabel}>Henüz açılmadı</Text>
          </View>

          <Text style={styles.body}>
            Kanal bağlama, Meta&apos;nın resmî yetkilendirme akışıyla yapılır. Bu akış Meta&apos;nın işletme
            doğrulaması ve uygulama incelemesi tamamlandığında açılacak.
          </Text>

          <View style={styles.steps}>
            {STEPS[channel.id].map((step, index) => (
              <View key={step} style={styles.step}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <Text style={styles.stepLabel}>{step}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Anladım"
            style={({ pressed }) => [styles.dismissButton, pressed && styles.dismissButtonPressed]}
          >
            <Text style={styles.dismissLabel}>Anladım</Text>
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
    width: 360,
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
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.pageBackground,
  },
  pendingLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  body: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  steps: {
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pageBackground,
  },
  stepNumber: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stepLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
  },
  dismissButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dismissButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  dismissLabel: {
    ...typography.button,
    color: colors.textPrimary,
  },
});
