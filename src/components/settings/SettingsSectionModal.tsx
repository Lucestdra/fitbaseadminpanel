import { type ReactNode } from 'react';
import { Modal, View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, radii, spacing } from '@/theme';

interface SettingsSectionModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function SettingsSectionModal({ visible, onClose, children }: SettingsSectionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.closeRow}>
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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {children}
          </ScrollView>
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
    width: 560,
    maxWidth: '92%',
    maxHeight: '88%',
    backgroundColor: colors.pageBackground,
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: colors.border,
  },
  scrollContent: {
    paddingBottom: spacing.xs,
  },
});
