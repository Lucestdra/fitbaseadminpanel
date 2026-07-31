import { View, Text, StyleSheet } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography, radii, cardShadow } from '@/theme';
import type { CalendarSession } from '@/types/calendar';

interface CalendarSessionCardProps {
  session: CalendarSession;
}

export function CalendarSessionCard({ session }: CalendarSessionCardProps) {
  const remaining = session.capacity - session.booked;
  const isFull = remaining <= 0;
  const accentColor = session.type === 'randevu' ? colors.info : session.type === 'deneme' ? colors.warning : colors.primary;

  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.time}>{session.time}</Text>
          <Badge label={isFull ? 'Dolu' : `${remaining} Boş`} tone={isFull ? 'dark' : 'mint'} />
        </View>
        <Text style={styles.title} numberOfLines={2}>{session.title}</Text>
        <Text style={styles.trainer} numberOfLines={1}>{session.trainer}</Text>
      </View>
    </View>
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
  trainer: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
