import { useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';

interface DateRange {
  start: string;
  end: string;
}

interface DateRangePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (range: DateRange) => void;
}

const MONTH_LABELS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MONTH_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function formatShort(year: number, month: number, day: number) {
  return `${day} ${MONTH_SHORT[month]}`;
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${month}-${day}`;
}

export function DateRangePickerModal({ visible, onClose, onApply }: DateRangePickerModalProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [start, setStart] = useState<{ year: number; month: number; day: number } | null>(null);
  const [end, setEnd] = useState<{ year: number; month: number; day: number } | null>(null);

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

  const handleDayPress = (day: number) => {
    const picked = { year: viewYear, month: viewMonth, day };
    if (!start || (start && end)) {
      setStart(picked);
      setEnd(null);
      return;
    }
    const pickedTime = new Date(picked.year, picked.month, picked.day).getTime();
    const startTime = new Date(start.year, start.month, start.day).getTime();
    if (pickedTime < startTime) {
      setStart(picked);
      setEnd(null);
    } else {
      setEnd(picked);
    }
  };

  const isInRange = (year: number, month: number, day: number) => {
    if (!start) return false;
    const time = new Date(year, month, day).getTime();
    const startTime = new Date(start.year, start.month, start.day).getTime();
    if (!end) return time === startTime;
    const endTime = new Date(end.year, end.month, end.day).getTime();
    return time >= startTime && time <= endTime;
  };

  const isEdge = (year: number, month: number, day: number) => {
    const key = dateKey(year, month, day);
    return (start && key === dateKey(start.year, start.month, start.day)) || (end && key === dateKey(end.year, end.month, end.day));
  };

  const handleApply = () => {
    if (!start || !end) return;
    onApply({
      start: formatShort(start.year, start.month, start.day),
      end: formatShort(end.year, end.month, end.day),
    });
    setStart(null);
    setEnd(null);
  };

  const handleClose = () => {
    setStart(null);
    setEnd(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.overlayDismiss} onPress={handleClose} accessibilityRole="button" accessibilityLabel="Kapat" />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Tarih Aralığı Seç</Text>
            <Pressable
              onPress={handleClose}
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
            <Text style={styles.monthLabel}>{MONTH_LABELS[viewMonth]} {viewYear}</Text>
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
              const inRange = isInRange(viewYear, viewMonth, cell.day);
              const edge = isEdge(viewYear, viewMonth, cell.day);
              return (
                <Pressable
                  key={index}
                  onPress={() => handleDayPress(cell.day)}
                  accessibilityRole="button"
                  accessibilityLabel={`${cell.day} ${MONTH_LABELS[viewMonth]} ${viewYear}`}
                  style={styles.dayCell}
                >
                  <View style={[styles.dayInner, inRange && styles.dayInnerInRange, edge && styles.dayInnerEdge]}>
                    <Text style={[styles.dayText, inRange && styles.dayTextInRange, edge && styles.dayTextEdge]}>
                      {cell.day}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footer}>
            <Text style={styles.rangeSummary}>
              {start ? formatShort(start.year, start.month, start.day) : 'Başlangıç'} –{' '}
              {end ? formatShort(end.year, end.month, end.day) : 'Bitiş'}
            </Text>
            <Pressable
              onPress={handleApply}
              disabled={!start || !end}
              accessibilityRole="button"
              accessibilityLabel="Tarih aralığını uygula"
              style={({ pressed }) => [
                styles.applyButton,
                (!start || !end) && styles.applyButtonDisabled,
                pressed && start && end && styles.applyButtonPressed,
              ]}
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
  dayInnerInRange: {
    backgroundColor: colors.mintLight,
  },
  dayInnerEdge: {
    backgroundColor: colors.primary,
  },
  dayText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  dayTextInRange: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  dayTextEdge: {
    color: colors.white,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rangeSummary: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  applyButton: {
    height: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: colors.border,
  },
  applyButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  applyLabel: {
    ...typography.button,
    color: colors.white,
  },
});
