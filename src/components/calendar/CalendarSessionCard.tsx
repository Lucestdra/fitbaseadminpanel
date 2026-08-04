import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography, radii, cardShadow } from '@/theme';
import { formatTimeIn } from '@/utils/calendar';
import type { CalendarSession } from '@/api/scheduling';

interface CalendarSessionCardProps {
  session: CalendarSession;
  timeZoneId: string;
  onPress: () => void;
}

export function CalendarSessionCard({ session, timeZoneId, onPress }: CalendarSessionCardProps) {
  const remaining = session.capacity - session.bookedCount;
  const isFull = remaining <= 0;
  const cancelled = session.state === 'Cancelled';

  const accentColor = cancelled
    ? colors.textSecondary
    : session.kind === 'Appointment'
      ? colors.info
      : session.kind === 'OneOff'
        ? colors.warning
        : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${session.title} detayları`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.time}>{formatTimeIn(session.startsAt, timeZoneId)}</Text>

          {/*
            Seats, not attendance. `bookedCount` counts claims — a member who does not turn up still
            occupied a place nobody else could have — so "3 Boş" is what a receptionist can sell.
          */}
          {cancelled ? (
            <Badge label="İptal" tone="dark" />
          ) : (
            <Badge label={isFull ? 'Dolu' : `${remaining} Boş`} tone={isFull ? 'dark' : 'mint'} />
          )}
        </View>

        <Text style={[styles.title, cancelled && styles.cancelled]} numberOfLines={2}>
          {session.title}
        </Text>
        <Text style={styles.trainer} numberOfLines={1}>
          {session.coachName ?? 'Eğitmen atanmadı'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...cardShadow,
  },
  cardPressed: {
    backgroundColor: colors.pageBackground,
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: spacing.sm,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  time: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  title: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  cancelled: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  trainer: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
