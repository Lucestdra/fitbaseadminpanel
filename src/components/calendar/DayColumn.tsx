import { View, Text, StyleSheet } from 'react-native';
import { CalendarSessionCard } from './CalendarSessionCard';
import { colors, spacing, typography, radii } from '@/theme';
import { formatShortDayLabel, isBeyondGenerated } from '@/utils/calendar';
import { fromIsoDate } from '@/utils/date';
import type { CalendarSession } from '@/api/scheduling';

interface DayColumnProps {
  /** `YYYY-MM-DD`. A real date, not a weekday id. */
  isoDate: string;
  sessions: CalendarSession[];
  materializedThrough: string | null;
  timeZoneId: string;
  isToday: boolean;
  onSelectSession: (sessionId: string) => void;
}

const WEEKDAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export function DayColumn({
  isoDate,
  sessions,
  materializedThrough,
  timeZoneId,
  isToday,
  onSelectSession,
}: DayColumnProps) {
  const date = fromIsoDate(isoDate);
  const ungenerated = isBeyondGenerated(isoDate, materializedThrough);

  return (
    <View style={[styles.container, isToday && styles.containerToday]}>
      <View style={styles.header}>
        <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
          {date ? WEEKDAY_LABELS[date.getDay()] : ''}
        </Text>
        <Text style={styles.dateLabel}>{formatShortDayLabel(isoDate)}</Text>
      </View>

      <View style={styles.list}>
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <CalendarSessionCard
              key={session.id}
              session={session}
              timeZoneId={timeZoneId}
              onPress={() => onSelectSession(session.id)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{ungenerated ? 'Oluşturulmadı' : 'Ders yok'}</Text>
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
