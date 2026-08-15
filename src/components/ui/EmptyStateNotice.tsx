import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIcon } from '@/components/ui/AppIcon';
import { settingsSectionHref, type SettingsSectionId } from '@/utils/settingsLinks';
import { colors, spacing, typography, radii } from '@/theme';
import type { IconName } from '@/types/dashboard';

interface EmptyStateNoticeProps {
  /** What is missing, said plainly. */
  message: string;
  /** The label on the way out of it. Omitted when there is nothing useful to press. */
  actionLabel?: string;
  /** Opens the settings screen with this section already expanded. */
  actionSection?: SettingsSectionId;
  /** Used instead of `actionSection` when the way out is on this screen. */
  onAction?: () => void;
  icon?: IconName;
}

/**
 * A dead end with a door in it.
 *
 * <b>"Satılabilir paket yok. Ayarlar ekranından paket tanımlayabilirsin."</b> was the whole
 * interaction: a sentence naming a screen, in a dialog the person then had to close, on a drawer
 * they then had to close, to reach a settings page they then had to find the right tile on. The
 * sentence was right and the screen was still a dead end.
 *
 * Anything that reports an empty catalog should offer the action that fills it.
 */
export function EmptyStateNotice({
  message,
  actionLabel,
  actionSection,
  onAction,
  icon = 'information-circle-outline',
}: EmptyStateNoticeProps) {
  const router = useRouter();

  const press = () => {
    if (onAction) {
      onAction();
      return;
    }

    if (actionSection) router.push(settingsSectionHref(actionSection) as never);
  };

  const hasAction = actionLabel !== undefined && (onAction !== undefined || actionSection !== undefined);

  return (
    <View style={styles.container}>
      <View style={styles.messageRow}>
        <AppIcon name={icon} size={16} color={colors.textSecondary} />
        <Text style={styles.message}>{message}</Text>
      </View>

      {hasAction ? (
        <Pressable
          onPress={press}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <AppIcon name="add" size={15} color={colors.primaryDark} />
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  message: {
    ...typography.caption,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  action: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.mintLight,
  },
  actionPressed: {
    backgroundColor: colors.cardBackground,
  },
  actionLabel: {
    ...typography.captionStrong,
    color: colors.primaryDark,
  },
});
