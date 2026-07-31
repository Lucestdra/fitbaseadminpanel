import { useState } from 'react';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { G, Rect, Text as SvgText } from 'react-native-svg';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, spacing, typography, radii } from '@/theme';
import { memberGrowth } from '@/mock/reports';

const CHART_HEIGHT = 200;
const PADDING_TOP = 24;
const PADDING_BOTTOM = 26;
const PADDING_X = 12;
const BAR_GAP = 6;
const GROUP_GAP = 18;

export function MemberGrowthCard() {
  const [chartWidth, setChartWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  };

  const maxValue = Math.max(...memberGrowth.map((point) => Math.max(point.newMembers, point.churned)));
  const innerWidth = Math.max(chartWidth - PADDING_X * 2, 0);
  const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const groupWidth = memberGrowth.length > 0 ? (innerWidth - GROUP_GAP * (memberGrowth.length - 1)) / memberGrowth.length : 0;
  const barWidth = Math.max((groupWidth - BAR_GAP) / 2, 0);

  const toBarHeight = (value: number) => (maxValue > 0 ? (value / maxValue) * innerHeight : 0);

  return (
    <Card style={styles.card}>
      <SectionHeader title="Üye Büyümesi" icon="people-outline" />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendLabel}>Yeni Üye</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.critical }]} />
          <Text style={styles.legendLabel}>Ayrılan Üye</Text>
        </View>
      </View>

      <View onLayout={handleLayout} style={styles.chartArea}>
        {chartWidth > 0 && (
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            {memberGrowth.map((point, index) => {
              const groupX = PADDING_X + index * (groupWidth + GROUP_GAP);
              const newHeight = toBarHeight(point.newMembers);
              const churnHeight = toBarHeight(point.churned);
              const baseY = CHART_HEIGHT - PADDING_BOTTOM;
              return (
                <G key={point.month}>
                  <Rect
                    x={groupX}
                    y={baseY - newHeight}
                    width={barWidth}
                    height={newHeight}
                    rx={3}
                    fill={colors.primary}
                  />
                  <Rect
                    x={groupX + barWidth + BAR_GAP}
                    y={baseY - churnHeight}
                    width={barWidth}
                    height={churnHeight}
                    rx={3}
                    fill={colors.critical}
                  />
                  <SvgText
                    x={groupX + groupWidth / 2}
                    y={CHART_HEIGHT - 6}
                    fontSize={12}
                    fill={colors.textSecondary}
                    textAnchor="middle"
                  >
                    {point.month}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chartArea: {
    width: '100%',
  },
});
