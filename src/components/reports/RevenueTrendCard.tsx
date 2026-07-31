import { useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors } from '@/theme';
import { revenueTrend } from '@/mock/reports';

const CHART_HEIGHT = 200;
const PADDING_TOP = 26;
const PADDING_BOTTOM = 26;
const PADDING_X = 18;
const GRID_LINES = [0, 25, 50, 75, 100];

function formatCurrency(value: number) {
  return `₺${Math.round(value / 1000)}bin`;
}

export function RevenueTrendCard() {
  const [chartWidth, setChartWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  };

  const maxRevenue = Math.max(...revenueTrend.map((point) => point.revenue));
  const minRevenue = Math.min(...revenueTrend.map((point) => point.revenue));
  const range = maxRevenue - minRevenue || 1;

  const innerWidth = Math.max(chartWidth - PADDING_X * 2, 0);
  const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const stepX = revenueTrend.length > 1 ? innerWidth / (revenueTrend.length - 1) : 0;

  const toX = (index: number) => PADDING_X + index * stepX;
  const toY = (value: number) => PADDING_TOP + (1 - (value - minRevenue) / range) * innerHeight;

  const points = revenueTrend.map((point, index) => `${toX(index)},${toY(point.revenue)}`).join(' ');

  return (
    <Card style={styles.card}>
      <SectionHeader title="Gelir Trendi" icon="trending-up-outline" />

      <View onLayout={handleLayout} style={styles.chartArea}>
        {chartWidth > 0 && (
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            {GRID_LINES.map((value) => (
              <Line
                key={value}
                x1={PADDING_X}
                x2={chartWidth - PADDING_X}
                y1={PADDING_TOP + (1 - value / 100) * innerHeight}
                y2={PADDING_TOP + (1 - value / 100) * innerHeight}
                stroke={colors.border}
                strokeWidth={1}
              />
            ))}

            <Polyline points={points} fill="none" stroke={colors.primary} strokeWidth={2.5} />

            {revenueTrend.map((point, index) => (
              <SvgText
                key={`label-${point.month}`}
                x={toX(index)}
                y={toY(point.revenue) - 10}
                fontSize={11}
                fontWeight="600"
                fill={colors.primaryDark}
                textAnchor="middle"
              >
                {formatCurrency(point.revenue)}
              </SvgText>
            ))}
            {revenueTrend.map((point, index) => (
              <Circle key={`dot-${point.month}`} cx={toX(index)} cy={toY(point.revenue)} r={4} fill={colors.primary} />
            ))}

            {revenueTrend.map((point, index) => (
              <SvgText
                key={`month-${point.month}`}
                x={toX(index)}
                y={CHART_HEIGHT - 6}
                fontSize={12}
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {point.month}
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
  chartArea: {
    width: '100%',
  },
});
