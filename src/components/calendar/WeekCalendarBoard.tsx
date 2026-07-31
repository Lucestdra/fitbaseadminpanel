import { ScrollView, StyleSheet } from 'react-native';
import { DayColumn } from './DayColumn';
import { spacing } from '@/theme';
import type { CalendarDay, CalendarSession } from '@/types/calendar';

interface WeekCalendarBoardProps {
  days: CalendarDay[];
  sessions: CalendarSession[];
  todayDayId: string;
}

export function WeekCalendarBoard({ days, sessions, todayDayId }: WeekCalendarBoardProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.content}>
      {days.map((day) => (
        <DayColumn
          key={day.id}
          day={day}
          sessions={sessions.filter((session) => session.day === day.id)}
          isToday={day.id === todayDayId}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingBottom: spacing.sm,
    paddingRight: spacing.md,
  },
});
