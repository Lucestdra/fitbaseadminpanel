import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, typography } from '@/theme';

export interface DonutSegment {
  id: string;
  percentage: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue: string;
  centerUnit?: string;
}

export function DonutChart({
  segments,
  size = 144,
  strokeWidth = 20,
  centerLabel,
  centerValue,
  centerUnit,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const arcs = segments.reduce<{ segment: DonutSegment; length: number; dashOffset: number }[]>((acc, segment) => {
    const priorLength = acc.reduce((sum, arc) => sum + arc.length, 0);
    const length = (segment.percentage / 100) * circumference;
    return [...acc, { segment, length, dashOffset: -priorLength }];
  }, []);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.pageBackground} strokeWidth={strokeWidth} fill="none" />
          {arcs.map(({ segment, length, dashOffset }) => (
            <Circle
              key={segment.id}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={dashOffset}
              fill="none"
            />
          ))}
        </G>
      </Svg>
      <View style={styles.centerOverlay}>
        {centerLabel ? <Text style={styles.centerLabel}>{centerLabel}</Text> : null}
        <Text style={styles.centerValue}>{centerValue}</Text>
        {centerUnit ? <Text style={styles.centerLabel}>{centerUnit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  centerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  centerValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
});
