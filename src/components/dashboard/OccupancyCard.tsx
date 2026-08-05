import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, spacing, typography } from '@/theme';
import { absentLabel, formatMetric, metricLabel } from '@/utils/metrics';
import { METRIC, metric as findMetric } from '@/api/analytics';
import type { MetricValue } from '@/api/analytics';

interface OccupancyCardProps {
  metrics: MetricValue[];
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
 * <b>What this is not: the panel's seven-day line chart.</b> That needed a per-day occupancy series,
 * and no endpoint returns one — the fact tables hold it, but `GET /analytics/dashboard` answers for
 * a window rather than for each day inside it. Rendering seven fabricated points would have been the
 * easier change and is exactly what this phase exists to stop. A daily series is a new endpoint.
 */
export function OccupancyCard({ metrics }: OccupancyCardProps) {
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
