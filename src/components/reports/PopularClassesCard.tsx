import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, spacing, typography } from '@/theme';
import { absentLabel, formatMetric } from '@/utils/metrics';
import { METRIC } from '@/api/analytics';
import type { ClassRow } from '@/api/analytics';

interface PopularClassesCardProps {
  classes: ClassRow[];
}

/**
 * Classes by bookings, with the occupancy each one actually reached.
 *
 * <b>A class with too few sessions in the window has no occupancy rate</b>, and says so rather than
 * showing one computed from a single busy Saturday. The floor is on sessions, not on seats: one
 * class of forty is one observation of one class's popularity.
 *
 * The class name is resolved server-side through the naming seam, never stored beside the fact —
 * a class renamed in June would otherwise appear twice on a report covering March and July.
 */
export function PopularClassesCard({ classes }: PopularClassesCardProps) {
  return (
    <Card style={styles.card}>
      <SectionHeader title="Popüler Dersler" icon="flame-outline" />

      {classes.length === 0 ? (
        <Text style={styles.empty}>Bu dönemde ders yapılmadı.</Text>
      ) : (
        <View style={styles.list}>
          {classes.map((item) => {
            const bookings = item.metrics.find((entry) => entry.id === METRIC.classBookings);
            const occupancy = item.metrics.find((entry) => entry.id === METRIC.classOccupancyRate);
            const occupancyText = occupancy ? formatMetric(occupancy) : null;

            return (
              <View key={item.classDefinitionId} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.bookings}>
                    {bookings?.value ?? 0} rezervasyon
                  </Text>
                </View>

                {/* 0..1 on the wire, scaled once here. */}
                <ProgressBar percentage={(occupancy?.value ?? 0) * 100} />

                <Text style={styles.occupancyLabel}>
                  {occupancyText
                    ? `${occupancyText} doluluk`
                    : occupancy
                      ? absentLabel(occupancy.insufficientData)
                      : ''}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    gap: 6,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  bookings: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  occupancyLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
