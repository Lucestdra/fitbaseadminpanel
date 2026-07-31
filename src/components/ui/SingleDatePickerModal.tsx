import { useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { TURKISH_MONTHS } from '@/utils/date';

interface SingleDatePickerModalProps {
  visible: boolean;
  title?: string;
  initialDate?: Date;
  onClose: () => void;
  onSelect: (date: Date) => void;
}

const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function SingleDatePickerModal({ visible, title = 'Tarih Seç', initialDate, onClose, onSelect }: SingleDatePickerModalProps) {
  const base = initialDate ?? new Date();
  const [viewYear, setViewYear] = useState(base.getFullYear());
  const [viewMonth, setViewMonth] = useState(base.getMonth());
  const [selectedDay, setSelectedDay] = useState(base.getDate());

  const cells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const result: ({ day: number } | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) result.push(null);
    for (let day = 1; day <= daysInMonth; day++) result.push({ day });
    return result;
  }, [viewYear, viewMonth]);

  const goToPreviousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleApply = () => {
    onSelect(new Date(viewYear, viewMonth, selectedDay));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
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

          <View style={styles.monthNav}>
            <Pressable
              onPress={goToPreviousMonth}
              accessibilityRole="button"
              accessibilityLabel="Önceki ay"
              hitSlop={8}
              style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
            >
              <AppIcon name="chevron-back" size={16} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.monthLabel}>{TURKISH_MONTHS[viewMonth]} {viewYear}</Text>
            <Pressable
              onPress={goToNextMonth}
              accessibilityRole="button"
              accessibilityLabel="Sonraki ay"
              hitSlop={8}
              style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
            >
              <AppIcon name="chevron-forward" size={16} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={styles.weekdayLabel}>{label}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((cell, index) => {
              if (!cell) return <View key={index} style={styles.dayCell} />;
              const isSelected = cell.day === selectedDay;
              return (
                <Pressable
                  key={index}
                  onPress={() => setSelectedDay(cell.day)}
                  accessibilityRole="button"
                  accessibilityLabel={`${cell.day} ${TURKISH_MONTHS[viewMonth]} ${viewYear}`}
                  style={styles.dayCell}
                >
                  <View style={[styles.dayInner, isSelected && styles.dayInnerSelected]}>
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{cell.day}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={handleApply}
            accessibilityRole="button"
            accessibilityLabel="Tarihi uygula"
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  monthLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  weekdayRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInnerSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: '700',
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
