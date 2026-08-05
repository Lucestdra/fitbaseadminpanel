import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TrendChart } from '@/components/reports/TrendChart';
import { colors, spacing, typography } from '@/theme';
import { absentLabel, formatMetric, metricLabel } from '@/utils/metrics';
import { METRIC, metric as findMetric } from '@/api/analytics';
import type { MetricValue, TrendPoint } from '@/api/analytics';

interface OccupancyCardProps {
  metrics: MetricValue[];
  /** One point per day in the window, oldest first. Empty under `Own` scope. */
  trend: TrendPoint[];
}

const ROWS: { id: string; color: string }[] = [
  { id: METRIC.bookedOccupancyRate, color: colors.primary },
  { id: METRIC.attendanceRate, color: colors.primaryDark },
  { id: METRIC.noShowRate, color: colors.warning },
];

/**
 * Occupancy and attendance, which the panel showed as one number called "Doluluk".
 *
 * <b>Three rates, and the split is decision D17.</b> A no-show occupied a seat nobody else could
 * have, so it counts as booked and not as attended — collapse the two and every occupancy figure
 * becomes an attendance figure wearing a different name. `noShowRate` is carried by the server
 * rather than derived from `1 − attendanceRate` here, so the two cannot disagree by a rounding step
 * on the same screen.
 *
 * <b>The line above the rates is the daily series</b>, which `GET /analytics/dashboard` now returns
 * as `occupancyTrend`: one point per day in the window, and `null` where there is no answer. The
 * panel's original seven-day chart was seven hardcoded numbers; this one is the same metric as the
 * bar beneath it, read per day instead of per window (backend ADR-0070).
 *
 * <b>A gap is not a zero.</b> A Sunday the studio was closed and a night the rollup did not run both
 * arrive as null and both break the line. Plotting either as zero would tell a studio it had a
 * catastrophe every weekend — `TrendChart` handles that and this card does not second-guess it.
 *
 * The chart is hidden below two points, because a line through one point is a dot pretending to be a
 * trend. That is also what a `Day` window produces, and a day is not a series.
 */
export function OccupancyCard({ metrics, trend }: OccupancyCardProps) {
  const visible = ROWS.map((row) => ({ ...row, metric: findMetric(metrics, row.id) })).filter(
    (row): row is (typeof ROWS)[number] & { metric: MetricValue } => row.metric !== undefined,
  );

  const sessions = findMetric(metrics, METRIC.sessionsHeld);

  return (
    <Card style={styles.card}>
      <SectionHeader title="Doluluk & Katılım" />

      {sessions ? (
        <Text style={styles.subtitle}>
          {sessions.value === null
            ? absentLabel(sessions.insufficientData)
            : `${metricLabel(METRIC.sessionsHeld)}: ${formatMetric(sessions)}`}
        </Text>
      ) : null}

      {trend.length > 1 && (
        <TrendChart
          series={[
            {
              points: trend,
              color: colors.primary,
              label: metricLabel(METRIC.bookedOccupancyRate),
              // The wire carries 0..1 and the axis is a percentage. Converted here, at the one edge
              // that renders it, matching every other chart in the panel.
              format: (value) => `%${Math.round(value * 100)}`,
            },
          ]}
        />
      )}

      <View style={styles.rows}>
        {visible.map((row) => {
          const value = formatMetric(row.metric);

          return (
            <View key={row.id} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.label}>{metricLabel(row.id)}</Text>
                <Text style={[styles.value, value === null && styles.absent]}>
                  {value ?? absentLabel(row.metric.insufficientData)}
                </Text>
              </View>

              {/* ProgressBar takes 0..100; the wire carries 0..1. Converted once, at the edge that
                  renders it, rather than in each of four chart components. */}
              <ProgressBar
                percentage={(row.metric.value ?? 0) * 100}
                accessibilityLabel={`${metricLabel(row.id)} ${value ?? 'yok'}`}
                height={8}
                color={row.color}
              />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.lg,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  rows: {
    gap: spacing.lg,
  },
  row: {
    gap: 6,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  absent: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
