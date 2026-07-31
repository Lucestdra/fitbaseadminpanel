import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, radii, spacing, typography, cardShadow } from '@/theme';
import type { IconName } from '@/types/dashboard';

interface SettingsTileProps {
  title: string;
  summary: string;
  icon: IconName;
  onPress: () => void;
}

export function SettingsTile({ title, summary, icon, onPress }: SettingsTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title} ayarlarını aç`}
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
    >
      <View style={styles.iconWrap}>
        <AppIcon name={icon} size={18} color={colors.primaryDark} />
      </View>
      <View style={styles.textGroup}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.summary} numberOfLines={1}>{summary}</Text>
      </View>
      <AppIcon name="chevron-forward" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 76,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.cardBackground,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  tilePressed: {
    backgroundColor: colors.mintLight,
    borderColor: colors.primary,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.mintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  summary: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
