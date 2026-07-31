import { useState } from 'react';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Card } from '@/components/ui/Card';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { colors, spacing, typography, radii } from '@/theme';
import { prospectFunnelByPeriod } from '@/mock/dashboard';
import type { DashboardPeriod } from '@/types/dashboard';

const BAR_HEIGHT = 10;
const STAGE_TONES: [string, string][] = [
  ['#BFF3DA', '#7FE3B4'],
  ['#A8EEC9', '#5FDB9C'],
  ['#8FE6B9', '#3FD088'],
  ['#6FDBA3', '#22C377'],
  [colors.primary, colors.primaryDark],
];

const periodOptions: SegmentOption<DashboardPeriod>[] = [
  { value: 'today', label: 'Bugün' },
  { value: 'week', label: 'Bu Hafta' },
  { value: 'month', label: 'Bu Ay' },
];

export function ProspectFunnelCard() {
  const [period, setPeriod] = useState<DashboardPeriod>('month');
  const [barAreaWidth, setBarAreaWidth] = useState(0);
  const funnel = prospectFunnelByPeriod[period];
  const firstStage = funnel[0];
  const lastStage = funnel[funnel.length - 1];

  const handleLayout = (event: LayoutChangeEvent) => {
    setBarAreaWidth(event.nativeEvent.layout.width);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Müşteri Adayı Hunisi</Text>
      </View>
      <View style={styles.toggleRow}>
        <SegmentedControl options={periodOptions} value={period} onChange={setPeriod} />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroValue}>%{lastStage.percentage}</Text>
        <Text style={styles.heroLabel}>
          Genel dönüşüm oranı · {firstStage.count} adaydan {lastStage.count} üyeliğe
        </Text>
      </View>

      <View style={styles.chart}>
        {funnel.map((stage, index) => {
          const [fillStart, fillEnd] = STAGE_TONES[index % STAGE_TONES.length];
          const fillWidth = barAreaWidth * (stage.percentage / 100);
          return (
            <View key={stage.id} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={styles.stageLabel}>{stage.label}</Text>
                <View style={styles.rowMetaGroup}>
                  <Text style={styles.stageCount}>{stage.count} kişi</Text>
                  <Text style={styles.stagePercentage}>%{stage.percentage}</Text>
                </View>
              </View>

              <View style={styles.barArea} onLayout={index === 0 ? handleLayout : undefined}>
                {barAreaWidth > 0 && (
                  <Svg width={barAreaWidth} height={BAR_HEIGHT}>
                    <Defs>
                      <LinearGradient id={`funnel-gradient-${stage.id}`} x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0" stopColor={fillStart} />
                        <Stop offset="1" stopColor={fillEnd} />
                      </LinearGradient>
                    </Defs>
                    <Rect x={0} y={0} width={barAreaWidth} height={BAR_HEIGHT} rx={BAR_HEIGHT / 2} fill={colors.pageBackground} />
                    <Rect
                      x={0}
                      y={0}
                      width={Math.max(fillWidth, BAR_HEIGHT)}
                      height={BAR_HEIGHT}
                      rx={BAR_HEIGHT / 2}
                      fill={`url(#funnel-gradient-${stage.id})`}
                    />
                  </Svg>
                )}
              </View>
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
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  toggleRow: {
    marginBottom: spacing.lg,
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
    minWidth: 34,
    textAlign: 'right',
  },
  barArea: {
    width: '100%',
  },
});
