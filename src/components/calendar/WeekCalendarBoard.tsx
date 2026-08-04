import { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { DayColumn } from './DayColumn';
import { colors, spacing, typography, radii } from '@/theme';
import { buildWeek, formatShortDayLabel, shiftIsoDate } from '@/utils/calendar';
import type { CalendarSession } from '@/api/scheduling';

interface WeekCalendarBoardProps {
  /** Any date in the week to show. The board anchors to that week's Monday. */
  anchorDate: string;
  sessions: CalendarSession[];
  materializedThrough: string | null;
  timeZoneId: string;
  today: string;
  onChangeWeek: (isoDate: string) => void;
  onSelectSession: (sessionId: string) => void;
}

export function WeekCalendarBoard({
  anchorDate,
  sessions,
  materializedThrough,
  timeZoneId,
  today,
  onChangeWeek,
  onSelectSession,
}: WeekCalendarBoardProps) {
  const week = useMemo(() => buildWeek(anchorDate), [anchorDate]);

  // Bucketed once. Filtering inside the column render is seven scans of the same array, and the
  // week view is where a busy studio has the most sessions on screen at once.
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarSession[]>();

    for (const session of sessions) {
      const bucket = map.get(session.occursOn);
      if (bucket) bucket.push(session);
      else map.set(session.occursOn, [session]);
    }

    return map;
  }, [sessions]);

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <Pressable
          onPress={() => onChangeWeek(shiftIsoDate(anchorDate, -7))}
          accessibilityRole="button"
          accessibilityLabel="Önceki hafta"
          hitSlop={8}
          style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
        >
          <AppIcon name="chevron-back" size={16} color={colors.textPrimary} />
        </Pressable>

        <Text style={styles.rangeLabel}>
          {formatShortDayLabel(week[0])} – {formatShortDayLabel(week[6])}
        </Text>

        <Pressable
          onPress={() => onChangeWeek(shiftIsoDate(anchorDate, 7))}
          accessibilityRole="button"
          accessibilityLabel="Sonraki hafta"
          hitSlop={8}
          style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
        >
          <AppIcon name="chevron-forward" size={16} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.content}>
        {week.map((isoDate) => (
          <DayColumn
            key={isoDate}
            isoDate={isoDate}
            sessions={byDate.get(isoDate) ?? []}
            materializedThrough={materializedThrough}
            timeZoneId={timeZoneId}
            isToday={isoDate === today}
            onSelectSession={onSelectSession}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  nav: {
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
  rangeLabel: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  content: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingBottom: spacing.sm,
    paddingRight: spacing.md,
  },
});
