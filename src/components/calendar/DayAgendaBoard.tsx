import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { CalendarSessionCard } from './CalendarSessionCard';
import { colors, spacing, typography, radii } from '@/theme';
import { TURKISH_MONTHS, addDays } from '@/utils/date';
import type { CalendarSession } from '@/types/calendar';

interface DayAgendaBoardProps {
  sessions: CalendarSession[];
}

const WEEKDAY_BY_JS_INDEX = ['paz', 'pzt', 'sal', 'car', 'per', 'cum', 'cmt'];
const WEEKDAY_FULL_LABELS: Record<string, string> = {
  pzt: 'Pazartesi',
  sal: 'Salı',
  car: 'Çarşamba',
  per: 'Perşembe',
  cum: 'Cuma',
  cmt: 'Cumartesi',
  paz: 'Pazar',
};

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function DayAgendaBoard({ sessions }: DayAgendaBoardProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const today = new Date();

  const weekdayId = WEEKDAY_BY_JS_INDEX[selectedDate.getDay()];
  const daySessions = sessions.filter((session) => session.day === weekdayId).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setSelectedDate((current) => addDays(current, -1))}
          accessibilityRole="button"
          accessibilityLabel="Önceki gün"
          hitSlop={8}
          style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
        >
          <AppIcon name="chevron-back" size={16} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.dateGroup}>
          <Text style={styles.dateLabel}>
            {selectedDate.getDate()} {TURKISH_MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </Text>
          <Text style={styles.weekdayLabel}>{WEEKDAY_FULL_LABELS[weekdayId]}</Text>
        </View>

        <Pressable
          onPress={() => setSelectedDate((current) => addDays(current, 1))}
          accessibilityRole="button"
          accessibilityLabel="Sonraki gün"
          hitSlop={8}
          style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
        >
          <AppIcon name="chevron-forward" size={16} color={colors.textPrimary} />
        </Pressable>

        {!isSameDay(selectedDate, today) ? (
          <Pressable
            onPress={() => setSelectedDate(new Date())}
            accessibilityRole="button"
            accessibilityLabel="Bugüne git"
            style={({ pressed }) => [styles.todayButton, pressed && styles.todayButtonPressed]}
          >
            <Text style={styles.todayLabel}>Bugün</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.list}>
        {daySessions.length > 0 ? (
          daySessions.map((session) => <CalendarSessionCard key={session.id} session={session} />)
        ) : (
          <View style={styles.emptyState}>
            <AppIcon name="calendar-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Bu gün için ders veya randevu yok.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  dateGroup: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  weekdayLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  todayButton: {
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayButtonPressed: {
    backgroundColor: '#DFF7EC',
  },
  todayLabel: {
    ...typography.captionStrong,
    color: colors.primaryDark,
  },
  list: {
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 160,
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
