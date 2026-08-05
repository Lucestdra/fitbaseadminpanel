import { useState } from 'react';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Card } from '@/components/ui/Card';
import { colors, spacing, typography, radii } from '@/theme';
import { formatMetric, metricLabel } from '@/utils/metrics';
import { METRIC, metric as findMetric } from '@/api/analytics';
import type { FunnelStage, MetricValue } from '@/api/analytics';

const BAR_HEIGHT = 10;
const STAGE_TONES: [string, string][] = [
  ['#BFF3DA', '#7FE3B4'],
  ['#A8EEC9', '#5FDB9C'],
  ['#8FE6B9', '#3FD088'],
  ['#6FDBA3', '#22C377'],
  [colors.primary, colors.primaryDark],
];

interface ProspectFunnelCardProps {
  funnel: FunnelStage[];
  metrics: MetricValue[];
}

/**
 * The lead funnel for the window's cohort.
 *
 * <b>A cohort of movements, not a snapshot of positions</b> (ADR-0063). Each row is the share of
 * leads that entered in this window and have <i>ever reached</i> that stage — so a lead that went
 * Interested → Converted counts in both, the shares do not sum to 1, and the column is not meant to.
 * A funnel of current positions changes shape when somebody drags a card and cannot be compared
 * across two months.
 *
 * The period selector moved to the page header. The panel gave this card its own, so it could show
 * a month's funnel beside a day's KPI tiles with nothing saying so.
 */
export function ProspectFunnelCard({ funnel, metrics }: ProspectFunnelCardProps) {
  const [barAreaWidth, setBarAreaWidth] = useState(0);

  const conversion = findMetric(metrics, METRIC.leadConversionRate);
  const created = findMetric(metrics, METRIC.leadsCreated);
  const converted = funnel.find((stage) => stage.semanticRole === 'Converted');

  const conversionText = conversion ? formatMetric(conversion) : null;

  const handleLayout = (event: LayoutChangeEvent) => {
    setBarAreaWidth(event.nativeEvent.layout.width);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Müşteri Adayı Hunisi</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroValue}>{conversionText ?? '—'}</Text>
        <Text style={styles.heroLabel}>
          {conversionText
            ? `${metricLabel(METRIC.leadConversionRate)} · ${created?.value ?? 0} adaydan ${converted?.count ?? 0} üyeliğe`
            : 'Bu dönemde oran hesaplanacak kadar aday yok'}
        </Text>
      </View>

      {funnel.length === 0 ? (
        <Text style={styles.empty}>Bu dönemde huniye giren aday yok.</Text>
      ) : (
        <View style={styles.chart}>
          {funnel.map((stage, index) => {
            const [fillStart, fillEnd] = STAGE_TONES[index % STAGE_TONES.length];

            // `share` arrives in 0..1 and is scaled once, here. The panel's four chart components
            // each took a percentage and each divided by 100 at a different point.
            const fillWidth = barAreaWidth * stage.share;
            const percent = (stage.share * 100).toLocaleString('tr-TR', {
              maximumFractionDigits: 1,
            });

            return (
              <View key={stage.semanticRole} style={styles.row}>
                <View style={styles.rowHeader}>
                  {/* The studio's own label, resolved server-side from the stage's semantic role.
                      Renaming a column renames it here and changes no funnel. */}
                  <Text style={styles.stageLabel}>{stage.label}</Text>
                  <View style={styles.rowMetaGroup}>
                    <Text style={styles.stageCount}>{stage.count} kişi</Text>
                    <Text style={styles.stagePercentage}>%{percent}</Text>
                  </View>
                </View>

                <View style={styles.barArea} onLayout={index === 0 ? handleLayout : undefined}>
                  {barAreaWidth > 0 && (
                    <Svg width={barAreaWidth} height={BAR_HEIGHT}>
                      <Defs>
                        <LinearGradient
                          id={`funnel-gradient-${stage.semanticRole}`}
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <Stop offset="0" stopColor={fillStart} />
                          <Stop offset="1" stopColor={fillEnd} />
                        </LinearGradient>
                      </Defs>
                      <Rect
                        x={0}
                        y={0}
                        width={barAreaWidth}
                        height={BAR_HEIGHT}
                        rx={BAR_HEIGHT / 2}
                        fill={colors.pageBackground}
                      />
                      <Rect
                        x={0}
                        y={0}
                        width={Math.max(fillWidth, BAR_HEIGHT)}
                        height={BAR_HEIGHT}
                        rx={BAR_HEIGHT / 2}
                        fill={`url(#funnel-gradient-${stage.semanticRole})`}
                      />
                    </Svg>
                  )}
                </View>
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
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  hero: {
    backgroundColor: colors.mintLight,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    gap: 2,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  heroLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
  },
  chart: {
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
  stageLabel: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  rowMetaGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  stageCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  stagePercentage: {
    ...typography.captionStrong,
    color: colors.primaryDark,
    minWidth: 40,
    textAlign: 'right',
  },
  barArea: {
    width: '100%',
  },
});
