import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from './AppIcon';
import { colors, radii, spacing, typography } from '@/theme';
import type { IconName } from '@/types/dashboard';

interface SectionHeaderProps {
  title: string;
  icon?: IconName;
  actionLabel?: string;
  onActionPress?: () => void;
  actionIcon?: IconName;
  variant?: 'link' | 'pill';
}

export function SectionHeader({
  title,
  icon,
  actionLabel,
  onActionPress,
  actionIcon = 'chevron-down',
  variant = 'link',
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {icon ? <AppIcon name={icon} size={18} color={colors.textSecondary} /> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel ? (
        <Pressable
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          style={({ pressed }) => [
            styles.action,
            variant === 'pill' && styles.actionPill,
            pressed && (variant === 'pill' ? styles.actionPillPressed : styles.actionPressed),
          ]}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
          <AppIcon name={actionIcon} size={14} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    minHeight: 44,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  title: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  actionPressed: {
    backgroundColor: colors.pageBackground,
  },
  actionPill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.pageBackground,
  },
  actionPillPressed: {
    backgroundColor: colors.mintLight,
    borderColor: colors.primary,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
