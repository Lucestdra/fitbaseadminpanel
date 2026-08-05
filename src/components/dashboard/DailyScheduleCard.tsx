import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography, radii } from '@/theme';
import { formatTimeIn } from '@/utils/calendar';
import { todayIn } from '@/utils/date';
import { useTodaySchedule } from '@/hooks/useDashboardPanels';
import { useAuth } from '@/context/AuthContext';

const VISIBLE = 5;

/**
 * What is on today.
 *
 * <b>Real sessions on a real date, in the studio's zone.</b> The panel's calendar had no dates at
 * all — it repeated a weekday template on every matching weekday — so this card showed the same
 * five classes every day of the year.
 *
 * `materializedThrough` is read before calling a day empty. The server generates class occurrences
 * on a rolling horizon, and a day past it is not a day with no classes; both come back as an empty
 * array and that field is the only thing that tells them apart.
 */
export function DailyScheduleCard() {
  const router = useRouter();
  const { timeZoneId } = useAuth();

  // The studio's day, not the device's. A coach opening the app at 00:30 in another zone would
  // otherwise be shown yesterday's classes under today's heading.
  const today = timeZoneId ? todayIn(timeZoneId) : null;
  const [showAll, setShowAll] = useState(false);

  const { sessions, materializedThrough, status } = useTodaySchedule(today);

  const ordered = [...sessions].sort((left, right) => left.startsAt.localeCompare(right.startsAt));
  const visibleItems = showAll ? ordered : ordered.slice(0, VISIBLE);
  const remainingCount = ordered.length - visibleItems.length;

  const beyondHorizon =
    today !== null && (materializedThrough === null || today > materializedThrough);

  return (
    <Card style={styles.card}>
      <SectionHeader
        title="Günlük Takvim"
        icon="calendar-outline"
        actionLabel="Tümünü Gör"
        actionIcon="chevron-forward"
        onActionPress={() => router.replace('/takvim')}
      />

      {status === 'loading' ? <Text style={styles.notice}>Yükleniyor…</Text> : null}
      {status === 'error' ? <Text style={styles.notice}>Takvim yüklenemedi.</Text> : null}

      {status === 'ready' && ordered.length === 0 ? (
        <Text style={styles.notice}>
          {beyondHorizon
            ? 'Bu gün için takvim henüz oluşturulmadı.'
            : 'Bugün planlanmış ders yok.'}
        </Text>
      ) : null}

      <View style={styles.list}>
        {visibleItems.map((item, index) => {
          const fillPercentage = item.capacity > 0 ? (item.bookedCount / item.capacity) * 100 : 0;
          const remaining = item.capacity - item.bookedCount;
          const isFull = remaining <= 0;
          const isLast = index === visibleItems.length - 1;
          const cancelled = item.state === 'Cancelled';

          return (
            <View key={item.id} style={styles.row}>
              <View style={styles.timelineCol}>
                <Text style={styles.time}>{formatTimeIn(item.startsAt, timeZoneId)}</Text>
                <View style={[styles.dot, isFull && styles.dotFull]} />
                {!isLast && <View style={styles.timelineLine} />}
              </View>

              <View style={styles.rowMain}>
                <View style={styles.rowHeader}>
                  <Text style={styles.className} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Badge
                    label={cancelled ? 'İptal' : isFull ? 'Dolu' : `${remaining} Koltuk Boş`}
                    tone={cancelled ? 'warning' : isFull ? 'dark' : 'mint'}
                  />
                </View>

                {/* A roster id resolved to a name by the server. The panel stored the name on the
                    session, so a coach who married appeared twice in one week's calendar. */}
                <Text style={styles.trainer} numberOfLines={1}>
                  {item.coachName ?? 'Antrenör atanmadı'}
                </Text>

                <ProgressBar
                  percentage={fillPercentage}
                  accessibilityLabel={`${item.title} dersi kapasitesi ${item.bookedCount} bölü ${item.capacity}`}
                />
              </View>
            </View>
          );
        })}
      </View>

      {remainingCount > 0 && !showAll ? (
        <Pressable
          onPress={() => setShowAll(true)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.more, pressed && styles.morePressed]}
        >
          <Text style={styles.moreLabel}>{remainingCount} ders daha</Text>
          <AppIcon name="chevron-down" size={14} color={colors.primaryDark} />
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  notice: {
    ...typography.body,
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineCol: {
    alignItems: 'center',
    width: 52,
  },
  time: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  dotFull: {
    backgroundColor: colors.textPrimary,
  },
  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  rowMain: {
    flex: 1,
    gap: 4,
    paddingBottom: spacing.md,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  className: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  trainer: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 40,
    borderRadius: radii.md,
    backgroundColor: colors.mintLight,
  },
  morePressed: {
    opacity: 0.85,
  },
  moreLabel: {
    ...typography.button,
    color: colors.primaryDark,
  },
});
