import { useState } from 'react';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { colors, spacing, typography } from '@/theme';
import { trendLabel } from '@/utils/metrics';
import type { TrendPoint } from '@/api/analytics';

const CHART_HEIGHT = 200;
const PADDING_TOP = 26;
const PADDING_BOTTOM = 26;
const PADDING_X = 18;
const GRID_LINES = 4;

export interface TrendSeries {
  points: TrendPoint[];
  color: string;
  label: string;
  /** Renders a value as text above its dot. Omitted for a series that would crowd the chart. */
  format?: (value: number) => string;
}

interface TrendChartProps {
  series: TrendSeries[];
}

/**
 * A trailing series, with gaps drawn as gaps.
 *
 * <b>A point whose value is `null` is a window nobody rolled up, not a month the studio took
 * nothing.</b> The line breaks there rather than dropping to the floor — a chart that plots a
 * missing month as zero is telling a studio it had a catastrophe.
 *
 * Labels come from the points' own dates. The panel stored `'Şub'` as data, which cannot be sorted,
 * cannot be compared across a year boundary, and cannot be localised.
 */
export function TrendChart({ series }: TrendChartProps) {
  const [chartWidth, setChartWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setChartWidth(event.nativeEvent.layout.width);
  };

  const values = series.flatMap((line) =>
    line.points.map((point) => point.value).filter((value): value is number => value !== null),
  );

  if (values.length === 0) {
    return (
      <View style={styles.emptyArea}>
        <Text style={styles.empty}>Bu dönem için henüz veri hesaplanmadı.</Text>
      </View>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const length = Math.max(...series.map((line) => line.points.length));
  const innerWidth = Math.max(chartWidth - PADDING_X * 2, 0);
  const innerHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const stepX = length > 1 ? innerWidth / (length - 1) : 0;

  const toX = (index: number) => PADDING_X + index * stepX;
  const toY = (value: number) => PADDING_TOP + (1 - (value - min) / range) * innerHeight;

  const axis = series[0]?.points ?? [];

  return (
    <View>
      <View style={styles.legend}>
        {series.map((line) => (
          <View key={line.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: line.color }]} />
            <Text style={styles.legendLabel}>{line.label}</Text>
          </View>
        ))}
      </View>

      <View onLayout={handleLayout} style={styles.chartArea}>
        {chartWidth > 0 && (
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            {Array.from({ length: GRID_LINES + 1 }, (_, step) => {
              const y = PADDING_TOP + (step / GRID_LINES) * innerHeight;

              return (
                <Line
                  key={step}
                  x1={PADDING_X}
                  x2={chartWidth - PADDING_X}
                  y1={y}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth={1}
                />
              );
            })}

            {series.flatMap((line) =>
              // One polyline per unbroken run. Joining across a null would draw a straight line
              // through a month nobody measured and make it look measured.
              runsOf(line.points).map((run, index) => (
                <Polyline
                  key={`${line.label}-${index}`}
                  points={run.map((entry) => `${toX(entry.index)},${toY(entry.value)}`).join(' ')}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={2.5}
                />
              )),
            )}

            {series.flatMap((line) =>
              line.points.flatMap((point, index) =>
                point.value === null
                  ? []
                  : [
                      <Circle
                        key={`${line.label}-dot-${index}`}
                        cx={toX(index)}
                        cy={toY(point.value)}
                        r={4}
                        fill={line.color}
                      />,
                    ],
              ),
            )}

            {series.flatMap((line) => {
              const format = line.format;

              if (!format) return [];

              return line.points.flatMap((point, index) =>
                point.value === null
                  ? []
                  : [
                      <SvgText
                        key={`${line.label}-label-${index}`}
                        x={toX(index)}
                        y={toY(point.value) - 10}
                        fontSize={11}
                        fontWeight="600"
                        fill={line.color}
                        textAnchor="middle"
                      >
                        {format(point.value)}
                      </SvgText>,
                    ],
              );
            })}

            {axis.map((point, index) => (
              <SvgText
                key={`axis-${point.from}`}
                x={toX(index)}
                y={CHART_HEIGHT - 6}
                fontSize={12}
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {trendLabel(point.from, point.through)}
              </SvgText>
            ))}
          </Svg>
        )}
      </View>
    </View>
  );
}

/** Splits a series into unbroken runs, so a gap is not bridged by a line. */
function runsOf(points: TrendPoint[]): { index: number; value: number }[][] {
  const runs: { index: number; value: number }[][] = [];
  let current: { index: number; value: number }[] = [];

  points.forEach((point, index) => {
    if (point.value === null) {
      if (current.length > 0) runs.push(current);
      current = [];
      return;
    }

    current.push({ index, value: point.value });
  });

  if (current.length > 0) runs.push(current);

  // A run of one point draws nothing as a polyline; its dot is rendered separately, so the point
  // is still visible and is visibly not connected to anything.
  return runs.filter((run) => run.length > 1);
}

const styles = StyleSheet.create({
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
  emptyArea: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
