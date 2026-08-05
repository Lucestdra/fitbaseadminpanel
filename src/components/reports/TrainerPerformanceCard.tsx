import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, spacing, typography } from '@/theme';
import { formatMetric, metricLabel } from '@/utils/metrics';
import { METRIC } from '@/api/analytics';
import type { TrainerRow } from '@/api/analytics';

interface TrainerPerformanceCardProps {
  trainers: TrainerRow[];
  /** Studio revenue in the window that no coach's SessionShare accounts for. */
  residual: number;
}

const COLUMNS = [
  METRIC.trainerSessions,
  METRIC.trainerOccupancyRate,
  METRIC.trainerNoShowRate,
  METRIC.trainerAttributedRevenue,
];

/**
 * Per-coach figures, behind `analytics.reports.read`.
 *
 * <b>`rating` is gone and is not coming back</b> (D3, ADR-0038). No capture mechanism exists
 * anywhere in the product, so the panel's 4.9 was fabricated — and a fabricated rating is worse than
 * an absent one because it looks like feedback. Its column is now `noShowRate`, which is measured.
 *
 * <b>The revenue column does not sum to studio revenue, and the residual row says so.</b> A member
 * who paid and never attended attributes to nobody; letting the columns quietly not add up is how a
 * manager ends up reconciling them by hand, once, badly.
 *
 * Attribution is provisional while any contributing unlimited term is open and does not converge on
 * its own (ADR-0066) — each cell carries the mark rather than the card carrying a footnote.
 */
export function TrainerPerformanceCard({ trainers, residual }: TrainerPerformanceCardProps) {
  return (
    <Card style={styles.card} noPadding>
      <View style={styles.headerWrap}>
        <SectionHeader title="Antrenör Performansı" icon="ribbon-outline" />
      </View>

      {trainers.length === 0 ? (
        <View style={styles.headerWrap}>
          <Text style={styles.empty}>Bu dönemde ders veren antrenör yok.</Text>
        </View>
      ) : (
        <>
          <View style={styles.headerRow}>
            <Text style={[styles.headerLabel, columnStyles.name]}>Antrenör</Text>
            {COLUMNS.map((id) => (
              <Text key={id} style={[styles.headerLabel, columnStyles.metric]} numberOfLines={1}>
                {metricLabel(id)}
              </Text>
            ))}
          </View>

          {trainers.map((trainer, index) => (
            <View
              key={trainer.staffMemberId}
              style={[styles.row, index === trainers.length - 1 && styles.rowLast]}
            >
              <Text style={[styles.cellTextStrong, columnStyles.name]} numberOfLines={1}>
                {trainer.fullName}
              </Text>

              {COLUMNS.map((id) => {
                const metric = trainer.metrics.find((entry) => entry.id === id);
                const value = metric ? formatMetric(metric) : null;

                return (
                  <Text
                    key={id}
                    style={[styles.cellText, columnStyles.metric, value === null && styles.absent]}
                    numberOfLines={1}
                  >
                    {value ?? '—'}
                    {metric?.isProvisional && value !== null ? ' *' : ''}
                  </Text>
                );
              })}
            </View>
          ))}

          <View style={styles.residualRow}>
            <Text style={styles.residualLabel}>Antrenöre pay edilmeyen gelir</Text>
            <Text style={styles.residualValue}>
              ₺{Math.round(residual).toLocaleString('tr-TR')}
            </Text>
          </View>

          <View style={styles.footnoteWrap}>
            <Text style={styles.footnote}>
              * Süresi dolmamış sınırsız üyelikler paya dahil olduğu sürece rakam geçicidir.
            </Text>
          </View>
        </>
      )}
    </Card>
  );
}

const columnStyles = StyleSheet.create({
  name: { flex: 1.8 },
  metric: { flex: 1.1, textAlign: 'right' },
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  headerWrap: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 52,
    gap: spacing.sm,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  cellTextStrong: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  cellText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  absent: {
    color: colors.textSecondary,
  },
  residualRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    backgroundColor: colors.pageBackground,
  },
  residualLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  residualValue: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  footnoteWrap: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.sm,
  },
  footnote: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    paddingBottom: spacing.xxl,
  },
});
