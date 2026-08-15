import { useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import { TURKISH_MONTHS } from '@/utils/date';

/** Which grid is on screen. */
type PickerMode = 'day' | 'month' | 'year';

interface SingleDatePickerModalProps {
  visible: boolean;
  title?: string;
  initialDate?: Date;
  /**
   * The grid to open on. `'year'` for anything historic — a birth date is thirty years of
   * back-arrow presses away from today, which is the whole reason this exists.
   */
  initialMode?: PickerMode;
  /** Inclusive bounds on the year grid. Defaults to a century back and five years forward. */
  minYear?: number;
  maxYear?: number;
  onClose: () => void;
  onSelect: (date: Date) => void;
}

const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

/** Short forms for the month grid, so four columns fit without wrapping. */
const SHORT_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

/** One page of the year grid. Four columns by five rows. */
const YEARS_PER_PAGE = 20;

const daysIn = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

/**
 * Picks one date, by drilling in rather than paging.
 *
 * <b>Month arrows were the only way to move.</b> Reaching a 1988 birthday from today meant 450-odd
 * presses of the back chevron, so in practice nobody set one. The header is now two buttons: the
 * month opens a twelve-cell grid, the year opens a twenty-year page. Picking a year lands on the
 * months, picking a month lands on the days — three taps to any date in the last century.
 *
 * The day is clamped when the month changes under it. Choosing 31 Ocak and then switching to Şubat
 * would otherwise apply a date that rolls into March, which `new Date(2026, 1, 31)` does silently.
 */
export function SingleDatePickerModal({
  visible,
  title = 'Tarih Seç',
  initialDate,
  initialMode = 'day',
  minYear,
  maxYear,
  onClose,
  onSelect,
}: SingleDatePickerModalProps) {
  const base = initialDate ?? new Date();
  const [viewYear, setViewYear] = useState(base.getFullYear());
  const [viewMonth, setViewMonth] = useState(base.getMonth());
  const [selectedDay, setSelectedDay] = useState(base.getDate());
  const [mode, setMode] = useState<PickerMode>(initialMode);

  const currentYear = new Date().getFullYear();
  const firstYear = minYear ?? currentYear - 100;
  const lastYear = maxYear ?? currentYear + 5;

  // The page holding the year in view, aligned to the range's start so pages stay stable.
  const [yearPageStart, setYearPageStart] = useState(
    () => firstYear + Math.floor((base.getFullYear() - firstYear) / YEARS_PER_PAGE) * YEARS_PER_PAGE,
  );

  const cells = useMemo(() => {
    const total = daysIn(viewYear, viewMonth);
    const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const result: ({ day: number } | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) result.push(null);
    for (let day = 1; day <= total; day++) result.push({ day });
    return result;
  }, [viewYear, viewMonth]);

  const years = useMemo(
    () =>
      Array.from({ length: YEARS_PER_PAGE }, (_, index) => yearPageStart + index).filter(
        (year) => year >= firstYear && year <= lastYear,
      ),
    [yearPageStart, firstYear, lastYear],
  );

  const clampDay = (year: number, month: number) =>
    setSelectedDay((current) => Math.min(current, daysIn(year, month)));

  const stepMonth = (delta: number) => {
    const next = viewMonth + delta;
    const year = viewYear + Math.floor(next / 12);
    const month = ((next % 12) + 12) % 12;
    setViewYear(year);
    setViewMonth(month);
    clampDay(year, month);
  };

  const stepYearPage = (delta: number) =>
    setYearPageStart((current) => {
      const next = current + delta * YEARS_PER_PAGE;
      const maxStart = firstYear + Math.floor((lastYear - firstYear) / YEARS_PER_PAGE) * YEARS_PER_PAGE;
      return Math.min(Math.max(next, firstYear), maxStart);
    });

  const handleApply = () => {
    onSelect(new Date(viewYear, viewMonth, selectedDay));
    onClose();
  };

  const canPageBack = mode === 'year' ? yearPageStart > firstYear : true;
  const canPageForward = mode === 'year' ? yearPageStart + YEARS_PER_PAGE <= lastYear : true;

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

          <View style={styles.nav}>
            <Pressable
              onPress={() => (mode === 'year' ? stepYearPage(-1) : stepMonth(-1))}
              disabled={mode === 'month' || !canPageBack}
              accessibilityRole="button"
              accessibilityLabel={mode === 'year' ? 'Önceki yıllar' : 'Önceki ay'}
              hitSlop={8}
              style={({ pressed }) => [
                styles.navButton,
                pressed && styles.navButtonPressed,
                (mode === 'month' || !canPageBack) && styles.navButtonDisabled,
              ]}
            >
              <AppIcon name="chevron-back" size={16} color={colors.textPrimary} />
            </Pressable>

            {/* The two crumbs. Pressing either steps back out to that grid, which is also how the
                person gets back after drilling in. */}
            <View style={styles.crumbs}>
              <Pressable
                onPress={() => setMode(mode === 'month' ? 'day' : 'month')}
                accessibilityRole="button"
                accessibilityLabel="Ay seç"
                accessibilityState={{ selected: mode === 'month' }}
                style={({ pressed }) => [
                  styles.crumb,
                  mode === 'month' && styles.crumbActive,
                  pressed && styles.crumbPressed,
                ]}
              >
                <Text style={[styles.crumbLabel, mode === 'month' && styles.crumbLabelActive]}>
                  {TURKISH_MONTHS[viewMonth]}
                </Text>
                <AppIcon name="chevron-down" size={13} color={colors.textSecondary} />
              </Pressable>

              <Pressable
                onPress={() => {
                  setMode(mode === 'year' ? 'day' : 'year');
                  setYearPageStart(
                    firstYear + Math.floor((viewYear - firstYear) / YEARS_PER_PAGE) * YEARS_PER_PAGE,
                  );
                }}
                accessibilityRole="button"
                accessibilityLabel="Yıl seç"
                accessibilityState={{ selected: mode === 'year' }}
                style={({ pressed }) => [
                  styles.crumb,
                  mode === 'year' && styles.crumbActive,
                  pressed && styles.crumbPressed,
                ]}
              >
                <Text style={[styles.crumbLabel, mode === 'year' && styles.crumbLabelActive]}>
                  {viewYear}
                </Text>
                <AppIcon name="chevron-down" size={13} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Pressable
              onPress={() => (mode === 'year' ? stepYearPage(1) : stepMonth(1))}
              disabled={mode === 'month' || !canPageForward}
              accessibilityRole="button"
              accessibilityLabel={mode === 'year' ? 'Sonraki yıllar' : 'Sonraki ay'}
              hitSlop={8}
              style={({ pressed }) => [
                styles.navButton,
                pressed && styles.navButtonPressed,
                (mode === 'month' || !canPageForward) && styles.navButtonDisabled,
              ]}
            >
              <AppIcon name="chevron-forward" size={16} color={colors.textPrimary} />
            </Pressable>
          </View>

          {mode === 'year' ? (
            <ScrollView style={styles.gridScroll} contentContainerStyle={styles.quarterGrid}>
              {years.map((year) => {
                const isSelected = year === viewYear;

                return (
                  <Pressable
                    key={year}
                    onPress={() => {
                      setViewYear(year);
                      clampDay(year, viewMonth);
                      setMode('month');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={String(year)}
                    accessibilityState={{ selected: isSelected }}
                    style={styles.quarterCell}
                  >
                    <View style={[styles.quarterInner, isSelected && styles.quarterInnerSelected]}>
                      <Text style={[styles.quarterText, isSelected && styles.quarterTextSelected]}>
                        {year}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : mode === 'month' ? (
            <View style={styles.quarterGrid}>
              {SHORT_MONTHS.map((label, index) => {
                const isSelected = index === viewMonth;

                return (
                  <Pressable
                    key={label}
                    onPress={() => {
                      setViewMonth(index);
                      clampDay(viewYear, index);
                      setMode('day');
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={TURKISH_MONTHS[index]}
                    accessibilityState={{ selected: isSelected }}
                    style={styles.quarterCell}
                  >
                    <View style={[styles.quarterInner, isSelected && styles.quarterInnerSelected]}>
                      <Text style={[styles.quarterText, isSelected && styles.quarterTextSelected]}>
                        {label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <>
              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map((label) => (
                  <Text key={label} style={styles.weekdayLabel}>
                    {label}
                  </Text>
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
                      accessibilityState={{ selected: isSelected }}
                      style={styles.dayCell}
                    >
                      <View style={[styles.dayInner, isSelected && styles.dayInnerSelected]}>
                        <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                          {cell.day}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

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
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
  navButtonDisabled: {
    opacity: 0.35,
  },
  crumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  crumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  crumbPressed: {
    backgroundColor: colors.pageBackground,
  },
  crumbActive: {
    backgroundColor: colors.mintLight,
  },
  crumbLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  crumbLabelActive: {
    color: colors.primaryDark,
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
  // Both the month and the year grid: four columns, so twelve months are three rows and a year
  // page is five. Matching them keeps the panel from resizing as the person drills in.
  gridScroll: {
    maxHeight: 232,
  },
  quarterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quarterCell: {
    width: '25%',
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quarterInner: {
    width: '92%',
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quarterInnerSelected: {
    backgroundColor: colors.primary,
  },
  quarterText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  quarterTextSelected: {
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
