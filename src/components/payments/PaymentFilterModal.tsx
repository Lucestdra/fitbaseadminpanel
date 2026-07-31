import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { PaymentStatus } from '@/types/payments';

interface PaymentFilterModalProps {
  visible: boolean;
  onClose: () => void;
  statuses: PaymentStatus[];
  onChange: (statuses: PaymentStatus[]) => void;
}

const STATUS_OPTIONS: { id: PaymentStatus; label: string }[] = [
  { id: 'tahsil-edildi', label: 'Tahsil Edildi' },
  { id: 'bekliyor', label: 'Bekliyor' },
  { id: 'gecikti', label: 'Gecikti' },
];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function PaymentFilterModal({ visible, onClose, statuses, onChange }: PaymentFilterModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Filtrele</Text>
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

          <Text style={styles.fieldLabel}>Durum</Text>
          <View style={styles.chipRow}>
            {STATUS_OPTIONS.map((option) => {
              const active = statuses.includes(option.id);
              return (
                <Pressable
                  key={option.id}
                  onPress={() => onChange(toggleValue(statuses, option.id))}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.chipPressed]}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => onChange([])}
              accessibilityRole="button"
              accessibilityLabel="Filtreleri temizle"
              style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
            >
              <Text style={styles.clearLabel}>Temizle {statuses.length > 0 ? `(${statuses.length})` : ''}</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Filtreleri uygula"
              style={({ pressed }) => [styles.applyButton, pressed && styles.applyButtonPressed]}
            >
              <Text style={styles.applyLabel}>Uygula</Text>
            </Pressable>
          </View>
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
    justifyContent: 'space-between',
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
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
  fieldLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipPressed: {
    backgroundColor: colors.pageBackground,
  },
  chipActive: {
    backgroundColor: colors.mintLight,
    borderColor: colors.primary,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chipLabelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  clearButton: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  clearLabel: {
    ...typography.button,
    color: colors.textPrimary,
  },
  applyButton: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  applyLabel: {
    ...typography.button,
    color: colors.white,
  },
});
