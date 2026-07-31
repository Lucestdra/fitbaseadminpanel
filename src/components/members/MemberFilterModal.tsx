import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { MemberStatus } from '@/types/members';

export interface MemberFilters {
  packages: string[];
  trainers: string[];
  statuses: MemberStatus[];
}

interface MemberFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: MemberFilters;
  onChange: (filters: MemberFilters) => void;
  packageOptions: string[];
  trainerOptions: string[];
}

const STATUS_OPTIONS: { id: MemberStatus; label: string }[] = [
  { id: 'aktif', label: 'Aktif' },
  { id: 'donduruldu', label: 'Donduruldu' },
  { id: 'pasif', label: 'Pasif' },
];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function MemberFilterModal({ visible, onClose, filters, onChange, packageOptions, trainerOptions }: MemberFilterModalProps) {
  const activeCount = filters.packages.length + filters.trainers.length + filters.statuses.length;

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

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Durum</Text>
            <View style={styles.chipRow}>
              {STATUS_OPTIONS.map((option) => {
                const active = filters.statuses.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => onChange({ ...filters, statuses: toggleValue(filters.statuses, option.id) })}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.chipPressed]}
                  >
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Paket</Text>
            <View style={styles.chipRow}>
              {packageOptions.map((option) => {
                const active = filters.packages.includes(option);
                return (
                  <Pressable
                    key={option}
                    onPress={() => onChange({ ...filters, packages: toggleValue(filters.packages, option) })}
                    accessibilityRole="button"
                    accessibilityLabel={option}
                    style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.chipPressed]}
                  >
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Eğitmen</Text>
            <View style={styles.chipRow}>
              {trainerOptions.map((option) => {
                const active = filters.trainers.includes(option);
                return (
                  <Pressable
                    key={option}
                    onPress={() => onChange({ ...filters, trainers: toggleValue(filters.trainers, option) })}
                    accessibilityRole="button"
                    accessibilityLabel={option}
                    style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.chipPressed]}
                  >
                    <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{option}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={() => onChange({ packages: [], trainers: [], statuses: [] })}
              accessibilityRole="button"
              accessibilityLabel="Filtreleri temizle"
              style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
            >
              <Text style={styles.clearLabel}>Temizle {activeCount > 0 ? `(${activeCount})` : ''}</Text>
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
    width: 400,
    maxWidth: '90%',
    maxHeight: '85%',
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
  body: {
    gap: spacing.sm,
  },
  fieldLabel: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
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
