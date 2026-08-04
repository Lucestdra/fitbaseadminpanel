import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from '@/api/enums';
import type { PaymentMethod, PaymentStatus } from '@/api/finance';

export interface PaymentFilters {
  statuses: NonNullable<PaymentStatus>[];
  methods: NonNullable<PaymentMethod>[];
}

export const EMPTY_PAYMENT_FILTERS: PaymentFilters = { statuses: [], methods: [] };

export function countPaymentFilters(filters: PaymentFilters): number {
  return filters.statuses.length + filters.methods.length;
}

interface PaymentFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: PaymentFilters;
  onChange: (filters: PaymentFilters) => void;
}

/**
 * <b>There is no "Gecikti" chip any more.</b> It was a payment status in the panel, which made
 * lateness a property of a payment — but a payment that arrived is never late. Filtering for what
 * is late is what the receivables tab is, and it asks the question against the studio's own today
 * (ADR-0033).
 */
const STATUS_OPTIONS: NonNullable<PaymentStatus>[] = ['Collected', 'Pending', 'Failed', 'Voided'];

const METHOD_OPTIONS: NonNullable<PaymentMethod>[] = ['CreditCard', 'Cash', 'BankTransfer', 'Other'];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function PaymentFilterModal({
  visible,
  onClose,
  filters,
  onChange,
}: PaymentFilterModalProps) {
  const count = countPaymentFilters(filters);

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
              const active = filters.statuses.includes(option);
              return (
                <Pressable
                  key={option}
                  onPress={() =>
                    onChange({ ...filters, statuses: toggleValue(filters.statuses, option) })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={PAYMENT_STATUS_LABELS[option]}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && styles.chipPressed,
                  ]}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {PAYMENT_STATUS_LABELS[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Yöntem</Text>
          <View style={styles.chipRow}>
            {METHOD_OPTIONS.map((option) => {
              const active = filters.methods.includes(option);
              return (
                <Pressable
                  key={option}
                  onPress={() =>
                    onChange({ ...filters, methods: toggleValue(filters.methods, option) })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={PAYMENT_METHOD_LABELS[option]}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && styles.chipPressed,
                  ]}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {PAYMENT_METHOD_LABELS[option]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => onChange(EMPTY_PAYMENT_FILTERS)}
              accessibilityRole="button"
              accessibilityLabel="Filtreleri temizle"
              style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
            >
              <Text style={styles.clearLabel}>Temizle {count > 0 ? `(${count})` : ''}</Text>
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
