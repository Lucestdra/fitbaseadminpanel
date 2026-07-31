import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DonutChart } from '@/components/ui/DonutChart';
import { colors, spacing, typography, radii } from '@/theme';
import type { DistributionSegment } from '@/types/shared';

interface DistributionCardProps {
  title: string;
  segments: DistributionSegment[];
  total: number;
  totalUnitLabel: string;
}

export function DistributionCard({ title, segments, total, totalUnitLabel }: DistributionCardProps) {
  return (
    <Card style={styles.card}>
      <SectionHeader title={title} />

      <View style={styles.body}>
        <DonutChart
          segments={segments}
          centerLabel="Toplam"
          centerValue={total.toLocaleString('tr-TR')}
          centerUnit={totalUnitLabel}
        />

        <View style={styles.legend}>
          {segments.map((segment) => (
            <View key={segment.id} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
              <Text style={styles.legendLabel} numberOfLines={1}>{segment.label}</Text>
              <View style={styles.legendBarTrack}>
                <View style={[styles.legendBarFill, { width: `${segment.percentage}%`, backgroundColor: segment.color }]} />
              </View>
              <Text style={styles.legendValue}>
                {segment.count} (%{segment.percentage})
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  legend: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 0,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    width: 98,
  },
  legendBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.pageBackground,
    overflow: 'hidden',
  },
  legendBarFill: {
    height: '100%',
    borderRadius: radii.pill,
  },
  legendValue: {
    ...typography.caption,
    color: colors.textSecondary,
    width: 62,
    textAlign: 'right',
  },
});
