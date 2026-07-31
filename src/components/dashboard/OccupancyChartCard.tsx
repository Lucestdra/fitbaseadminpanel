import { useState } from 'react';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, spacing, typography } from '@/theme';
import { occupancyWeek } from '@/mock/dashboard';

const CHART_HEIGHT = 190;
const PADDING_TOP = 22;
const PADDING_BOTTOM = 26;
const PADDING_X = 18;
const GRID_LINES = [0, 25, 50, 75, 100];

export function OccupancyChartCard() {
  const [chartWidth, setChartWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  };

  const innerWidth = Math.max(chartWidth - PADDING_X * 2, 0);
  const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const stepX = occupancyWeek.length > 1 ? innerWidth / (occupancyWeek.length - 1) : 0;

  const toX = (index: number) => PADDING_X + index * stepX;
  const toY = (value: number) => PADDING_TOP + (1 - value / 100) * innerHeight;

  const occupancyPoints = occupancyWeek.map((d, i) => `${toX(i)},${toY(d.occupancyRate)}`).join(' ');
  const noShowPoints = occupancyWeek.map((d, i) => `${toX(i)},${toY(d.noShowRate)}`).join(' ');

  return (
    <Card style={styles.card}>
      <SectionHeader title="Doluluk & No-show" actionLabel="Bu Hafta" actionIcon="chevron-down" variant="pill" />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendLabel}>Doluluk Oranı (%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendLabel}>No-show Oranı (%)</Text>
        </View>
      </View>

      <View onLayout={handleLayout} style={styles.chartArea}>
        {chartWidth > 0 && (
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            {GRID_LINES.map((value) => (
              <Line
                key={value}
                x1={PADDING_X}
                x2={chartWidth - PADDING_X}
                y1={toY(value)}
                y2={toY(value)}
                stroke={colors.border}
                strokeWidth={1}
              />
            ))}

            <Polyline points={occupancyPoints} fill="none" stroke={colors.primary} strokeWidth={2.5} />
            <Polyline points={noShowPoints} fill="none" stroke={colors.warning} strokeWidth={2.5} />

            {occupancyWeek.map((d, i) => (
              <SvgText
                key={`occ-label-${d.day}`}
                x={toX(i)}
                y={toY(d.occupancyRate) - 10}
                fontSize={11}
                fontWeight="600"
                fill={colors.primaryDark}
                textAnchor="middle"
              >
                {`%${d.occupancyRate}`}
              </SvgText>
            ))}
            {occupancyWeek.map((d, i) => (
              <Circle key={`occ-dot-${d.day}`} cx={toX(i)} cy={toY(d.occupancyRate)} r={4} fill={colors.primary} />
            ))}
            {occupancyWeek.map((d, i) => (
              <Circle key={`ns-dot-${d.day}`} cx={toX(i)} cy={toY(d.noShowRate)} r={3.5} fill={colors.warning} />
            ))}

            {occupancyWeek.map((d, i) => (
              <SvgText
                key={`day-${d.day}`}
                x={toX(i)}
                y={CHART_HEIGHT - 6}
                fontSize={12}
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {d.day}
              </SvgText>
            ))}
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
    borderRadius: 4,
  },
  legendLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  chartArea: {
    width: '100%',
  },
});
