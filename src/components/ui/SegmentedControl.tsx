import { Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      accessibilityRole="tablist"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.segment,
              isActive && styles.segmentActive,
              pressed && !isActive && styles.segmentPressed,
            ]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.textPrimary,
    borderRadius: radii.pill,
    padding: 4,
    gap: 2,
  },
  segment: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.captionStrong,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  labelActive: {
    color: colors.textPrimary,
  },
});
