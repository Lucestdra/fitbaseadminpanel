import { View, Text, StyleSheet } from 'react-native';
import { CalendarSessionCard } from './CalendarSessionCard';
import { colors, spacing, typography, radii } from '@/theme';
import type { CalendarDay, CalendarSession } from '@/types/calendar';

interface DayColumnProps {
  day: CalendarDay;
  sessions: CalendarSession[];
  isToday: boolean;
}

export function DayColumn({ day, sessions, isToday }: DayColumnProps) {
  return (
    <View style={[styles.container, isToday && styles.containerToday]}>
      <View style={styles.header}>
        <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{day.label}</Text>
        <Text style={styles.dateLabel}>{day.dateLabel}</Text>
      </View>

      <View style={styles.list}>
        {sessions.length > 0 ? (
          sessions.map((session) => <CalendarSessionCard key={session.id} session={session} />)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Ders yok</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 176,
    gap: spacing.sm,
  },
  containerToday: {
    backgroundColor: colors.mintLight,
    borderRadius: radii.lg,
    padding: spacing.sm,
    marginHorizontal: -spacing.sm,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dayLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  dayLabelToday: {
    color: colors.primaryDark,
  },
  dateLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
