import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { CalendarSessionCard } from './CalendarSessionCard';
import { colors, spacing, typography, radii } from '@/theme';
import { formatDayLabel, isBeyondGenerated, shiftIsoDate } from '@/utils/calendar';
import { fromIsoDate } from '@/utils/date';
import type { CalendarSession } from '@/api/scheduling';

interface DayAgendaBoardProps {
  /** `YYYY-MM-DD` in the studio's zone. */
  isoDate: string;
  sessions: CalendarSession[];
  materializedThrough: string | null;
  timeZoneId: string;
  /** The studio's today, so "Bugün" means the studio's day and not the device's. */
  today: string;
  onChangeDay: (isoDate: string) => void;
  onSelectSession: (sessionId: string) => void;
}

const WEEKDAY_LABELS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

/**
 * One real day.
 *
 * <b>Ordering comes from the server</b>, which sorts by the instant. The version this replaces
 * sorted by a `time` string — and `'9:00'.localeCompare('10:00')` is positive, so a studio opening
 * at nine had its first class listed second, every day, in the view a coach opens in the morning.
 */
export function DayAgendaBoard({
  isoDate,
  sessions,
  materializedThrough,
  timeZoneId,
  today,
  onChangeDay,
  onSelectSession,
}: DayAgendaBoardProps) {
  const date = fromIsoDate(isoDate);
  const ungenerated = isBeyondGenerated(isoDate, materializedThrough);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => onChangeDay(shiftIsoDate(isoDate, -1))}
          accessibilityRole="button"
          accessibilityLabel="Önceki gün"
          hitSlop={8}
          style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
        >
          <AppIcon name="chevron-back" size={16} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.dateGroup}>
          <Text style={styles.dateLabel}>{formatDayLabel(isoDate)}</Text>
          <Text style={styles.weekdayLabel}>{date ? WEEKDAY_LABELS[date.getDay()] : ''}</Text>
        </View>

        <Pressable
          onPress={() => onChangeDay(shiftIsoDate(isoDate, 1))}
          accessibilityRole="button"
          accessibilityLabel="Sonraki gün"
          hitSlop={8}
          style={({ pressed }) => [styles.navButton, pressed && styles.navButtonPressed]}
        >
          <AppIcon name="chevron-forward" size={16} color={colors.textPrimary} />
        </Pressable>

        {isoDate !== today ? (
          <Pressable
            onPress={() => onChangeDay(today)}
            accessibilityRole="button"
            accessibilityLabel="Bugüne git"
            style={({ pressed }) => [styles.todayButton, pressed && styles.todayButtonPressed]}
          >
            <Text style={styles.todayLabel}>Bugün</Text>
          </Pressable>
        ) : null}
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
            <AppIcon name="calendar-outline" size={20} color={colors.textSecondary} />
            {/*
              Two different sentences, and the distinction is the whole point of shipping
              `materializedThrough`. "Nothing on" is a fact about the studio; "not generated yet" is
              a fact about a job, and rendering both as the same empty state is what made the
              panel's calendar impossible to trust.
            */}
            <Text style={styles.emptyText}>
              {ungenerated
                ? 'Bu tarih için takvim henüz oluşturulmadı.'
                : 'Bu gün için ders veya randevu yok.'}
            </Text>
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
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
