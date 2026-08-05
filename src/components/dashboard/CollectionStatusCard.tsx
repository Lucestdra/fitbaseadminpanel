import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, spacing, typography } from '@/theme';
import { absentLabel, formatMetric, metricLabel } from '@/utils/metrics';
import { METRIC, metric as findMetric } from '@/api/analytics';
import type { MetricValue } from '@/api/analytics';

interface CollectionStatusCardProps {
  metrics: MetricValue[];
}

const ROWS: { id: string; color: string }[] = [
  { id: METRIC.outstandingAmount, color: colors.warning },
  { id: METRIC.overdueAmount, color: colors.critical },
  { id: METRIC.revenueCollected, color: colors.primaryDark },
  { id: METRIC.revenueRefunded, color: colors.textPrimary },
];

/**
 * Money, on two date axes.
 *
 * <b>Collections are windowed on when the money moved; outstanding and overdue on when it fell
 * due</b> (ADR-0033). Forcing them onto one axis makes a report claim a studio is owed nothing in a
 * month where everything due happened to be paid early.
 *
 * <b>Refunds sit beside collections and are never netted into them.</b> A month that took ₺300,000
 * and gave ₺40,000 back is a different month from one that took ₺260,000, and only two numbers can
 * say so (ADR-0036).
 *
 * The panel's "Tahsilat Oranı" is gone, and its progress bar with it: collected over what? No
 * denominator existed anywhere in the product, and a percentage without one is a decoration.
 */
export function CollectionStatusCard({ metrics }: CollectionStatusCardProps) {
  const router = useRouter();

  const visible = ROWS.map((row) => ({ ...row, metric: findMetric(metrics, row.id) })).filter(
    (row): row is (typeof ROWS)[number] & { metric: MetricValue } => row.metric !== undefined,
  );

  return (
    <Card style={styles.card}>
      <SectionHeader
        title="Tahsilat Durumu"
        actionLabel="Tümünü Gör"
        actionIcon="chevron-forward"
        onActionPress={() => router.replace('/odemeler')}
      />

      {visible.length === 0 ? (
        <Text style={styles.absent}>Finansal özet için yetkin yok.</Text>
      ) : (
        <View style={styles.rows}>
          {visible.map((row) => {
            const value = formatMetric(row.metric);

            return (
              <View key={row.id} style={styles.row}>
                <Text style={styles.label}>{metricLabel(row.id)}</Text>

                {value === null ? (
                  <Text style={styles.absent}>{absentLabel(row.metric.insufficientData)}</Text>
                ) : (
                  <Text style={[styles.value, { color: row.color }]}>{value}</Text>
                )}
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
    flex: 1,
    gap: spacing.xl,
  },
  rows: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
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
