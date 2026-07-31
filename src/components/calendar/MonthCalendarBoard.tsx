import { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DayDetailModal } from './DayDetailModal';
import { colors, spacing, typography, radii } from '@/theme';
import { TURKISH_MONTHS } from '@/utils/date';
import type { CalendarSession } from '@/types/calendar';

interface MonthCalendarBoardProps {
  sessions: CalendarSession[];
}

const WEEKDAY_LABELS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const WEEKDAY_BY_JS_INDEX = ['paz', 'pzt', 'sal', 'car', 'per', 'cum', 'cmt'];
const MAX_VISIBLE_PER_DAY = 3;

function typeColor(type: CalendarSession['type']) {
  if (type === 'randevu') return colors.info;
  if (type === 'deneme') return colors.warning;
  return colors.primary;
}

export function MonthCalendarBoard({ sessions }: MonthCalendarBoardProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<{ day: number; weekdayId: string } | null>(null);

  const cells = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const result: ({ day: number; weekdayId: string } | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) result.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const weekdayId = WEEKDAY_BY_JS_INDEX[new Date(viewYear, viewMonth, day).getDay()];
      result.push({ day, weekdayId });
    }
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

  const isToday = (day: number) =>
    viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();

  return (
    <View style={styles.container}>
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
          const daySessions = sessions.filter((session) => session.day === cell.weekdayId);
          const visibleSessions = daySessions.slice(0, MAX_VISIBLE_PER_DAY);
          const extraCount = daySessions.length - visibleSessions.length;
          return (
            <View key={index} style={[styles.dayCell, isToday(cell.day) && styles.dayCellToday]}>
              <Text style={[styles.dayNumber, isToday(cell.day) && styles.dayNumberToday]}>{cell.day}</Text>
              <View style={styles.sessionList}>
                {visibleSessions.map((session) => (
                  <View key={session.id} style={styles.sessionChip}>
                    <View style={[styles.sessionDot, { backgroundColor: typeColor(session.type) }]} />
                    <Text style={styles.sessionText} numberOfLines={1}>{session.time} {session.title}</Text>
                  </View>
                ))}
                {extraCount > 0 ? (
                  <Pressable
                    onPress={() => setSelectedDay(cell)}
                    accessibilityRole="button"
                    accessibilityLabel={`${cell.day} ${TURKISH_MONTHS[viewMonth]} için ${extraCount} ders daha göster`}
                    hitSlop={4}
                  >
                    <Text style={styles.moreText}>+{extraCount} daha</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      <DayDetailModal
        visible={selectedDay !== null}
        dateLabel={selectedDay ? `${selectedDay.day} ${TURKISH_MONTHS[viewMonth]} ${viewYear}` : ''}
        sessions={selectedDay ? sessions.filter((session) => session.day === selectedDay.weekdayId) : []}
        onClose={() => setSelectedDay(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
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
    ...typography.cardTitle,
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
    minHeight: 96,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  dayCellToday: {
    backgroundColor: colors.mintLight,
  },
  dayNumber: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  dayNumberToday: {
    color: colors.primaryDark,
  },
  sessionList: {
    gap: 2,
  },
  sessionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sessionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sessionText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  moreText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
  },
});
