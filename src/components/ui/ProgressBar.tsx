import { View, StyleSheet } from 'react-native';
import { colors, radii } from '@/theme';

interface ProgressBarProps {
  percentage: number;
  color?: string;
  trackColor?: string;
  height?: number;
  accessibilityLabel?: string;
}

export function ProgressBar({
  percentage,
  color = colors.primary,
  trackColor = colors.mintLight,
  height = 6,
  accessibilityLabel,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));

  return (
    <View
      style={[styles.track, { height, borderRadius: radii.pill, backgroundColor: trackColor }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? `Doluluk yüzde ${clamped}`}
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
    >
      <View
        style={[
          styles.fill,
          { width: `${clamped}%`, borderRadius: radii.pill, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
