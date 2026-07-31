import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '@/theme';

export type BadgeTone = 'mint' | 'warning' | 'critical' | 'neutral' | 'dark' | 'info';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

const TONE_STYLES: Record<BadgeTone, { backgroundColor: string; color: string }> = {
  mint: { backgroundColor: colors.mintLight, color: colors.primaryDark },
  warning: { backgroundColor: '#FDF1DC', color: colors.warning },
  critical: { backgroundColor: '#FCE8E8', color: colors.critical },
  neutral: { backgroundColor: colors.pageBackground, color: colors.textSecondary },
  dark: { backgroundColor: colors.textPrimary, color: colors.white },
  info: { backgroundColor: '#E3EEFD', color: colors.info },
};

export function Badge({ label, tone = 'mint' }: BadgeProps) {
  const toneStyle = TONE_STYLES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: toneStyle.backgroundColor }]}>
      <Text style={[styles.label, { color: toneStyle.color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.captionStrong,
  },
});
