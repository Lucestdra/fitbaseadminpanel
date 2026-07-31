import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { CalendarSessionType } from '@/types/calendar';

interface CalendarFilterModalProps {
  visible: boolean;
  visibleTypes: CalendarSessionType[];
  onClose: () => void;
  onChange: (types: CalendarSessionType[]) => void;
}

const TYPE_OPTIONS: { id: CalendarSessionType; label: string }[] = [
  { id: 'ders', label: 'Dersler' },
  { id: 'randevu', label: 'Randevular' },
  { id: 'deneme', label: 'Müşteri Adayı Deneme Dersleri' },
];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function CalendarFilterModal({ visible, visibleTypes, onClose, onChange }: CalendarFilterModalProps) {
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

          <Text style={styles.fieldLabel}>Gösterilecek Türler</Text>
          <View style={styles.optionList}>
            {TYPE_OPTIONS.map((option) => {
              const active = visibleTypes.includes(option.id);
              return (
                <Pressable
                  key={option.id}
                  onPress={() => onChange(toggleValue(visibleTypes, option.id))}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  style={({ pressed }) => [styles.optionRow, pressed && styles.optionRowPressed]}
                >
                  <View style={[styles.checkbox, active && styles.checkboxActive]}>
                    {active ? <AppIcon name="checkmark" size={13} color={colors.white} /> : null}
                  </View>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

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
  optionList: {
    gap: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  optionRowPressed: {
    opacity: 0.7,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionLabel: {
    ...typography.body,
    color: colors.textPrimary,
  },
  applyButton: {
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
