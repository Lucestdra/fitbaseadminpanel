import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography, radii } from '@/theme';
import { dailySchedule, additionalScheduleCount } from '@/mock/dashboard';

export function DailyScheduleCard() {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const visibleItems = showAll ? dailySchedule : dailySchedule.slice(0, 5);

  return (
    <Card style={styles.card}>
      <SectionHeader
        title="Günlük Takvim"
        icon="calendar-outline"
        actionLabel="Tümünü Gör"
        actionIcon="chevron-forward"
        onActionPress={() => router.replace('/takvim')}
      />

      <View style={styles.list}>
        {visibleItems.map((item, index) => {
          const fillPercentage = (item.booked / item.capacity) * 100;
          const remaining = item.capacity - item.booked;
          const isFull = remaining <= 0;
          const isLast = index === visibleItems.length - 1;
          return (
            <View key={item.id} style={styles.row}>
              <View style={styles.timelineCol}>
                <Text style={styles.time}>{item.time}</Text>
                <View style={[styles.dot, isFull && styles.dotFull]} />
                {!isLast && <View style={styles.timelineLine} />}
              </View>

              <View style={styles.rowMain}>
                <View style={styles.rowHeader}>
                  <Text style={styles.className} numberOfLines={1}>{item.title}</Text>
                  <Badge label={isFull ? 'Dolu' : `${remaining} Koltuk Boş`} tone={isFull ? 'dark' : 'mint'} />
                </View>
                <Text style={styles.trainer} numberOfLines={1}>{item.trainer}</Text>
                <ProgressBar
                  percentage={fillPercentage}
                  accessibilityLabel={`${item.title} dersi kapasitesi ${item.booked} bölü ${item.capacity}`}
                />
              </View>
            </View>
          );
        })}
      </View>

      {!showAll && additionalScheduleCount > 0 && (
        <Pressable
          onPress={() => setShowAll(true)}
          accessibilityRole="button"
          accessibilityLabel={`${additionalScheduleCount} ders daha göster`}
          style={({ pressed }) => [styles.moreButton, pressed && styles.moreButtonPressed]}
        >
          <Text style={styles.moreText}>+ {additionalScheduleCount} ders daha</Text>
          <AppIcon name="chevron-down" size={14} color={colors.textSecondary} />
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineCol: {
    width: 44,
    alignItems: 'center',
  },
  time: {
    ...typography.captionStrong,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  dotFull: {
    backgroundColor: colors.textPrimary,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
    borderRadius: 1,
  },
  rowMain: {
    flex: 1,
    gap: 6,
    paddingBottom: spacing.sm,
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
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    minHeight: 40,
  },
  moreButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  moreText: {
    ...typography.captionStrong,
    color: colors.textSecondary,
  },
});
