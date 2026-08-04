import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { SearchInput } from '@/components/ui/SearchInput';
import { colors, radii, spacing, typography } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { IconName } from '@/types/dashboard';

interface ListPageHeaderProps {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  /**
   * Opens the filter sheet. Omit it and the button is not rendered — a screen whose filtering is
   * done another way should not show a control that does nothing.
   */
  onFilterPress?: () => void;
  filterCount?: number;
  /**
   * The main action. Omit both this and {@link onPrimaryAction} and the button is not rendered —
   * which is how a permission-gated screen hides an action the server would refuse anyway. Hiding
   * it is a courtesy; the refusal is still enforced server-side (CLAUDE.md §35).
   */
  primaryActionLabel?: string;
  primaryActionIcon?: IconName;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionIcon?: IconName;
  onSecondaryAction?: () => void;
}

export function ListPageHeader({
  title,
  subtitle,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onFilterPress,
  filterCount = 0,
  primaryActionLabel,
  primaryActionIcon = 'add',
  onPrimaryAction,
  secondaryActionLabel,
  secondaryActionIcon = 'download-outline',
  onSecondaryAction,
}: ListPageHeaderProps) {
  const { isMobile } = useResponsiveLayout();

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <View style={styles.titleGroup}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={[styles.controls, isMobile && styles.controlsMobile]}>
        <SearchInput placeholder={searchPlaceholder} value={searchValue} onChangeText={onSearchChange} />

        {onFilterPress ? (
          <Pressable
            onPress={onFilterPress}
            accessibilityRole="button"
            accessibilityLabel="Filtrele"
            style={({ pressed }) => [styles.filterButton, pressed && styles.filterButtonPressed]}
          >
            <AppIcon name="filter-outline" size={16} color={colors.textPrimary} />
            <Text style={styles.filterLabel}>Filtrele</Text>
            {filterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            )}
          </Pressable>
        ) : null}

        {secondaryActionLabel && onSecondaryAction ? (
          <Pressable
            onPress={onSecondaryAction}
            accessibilityRole="button"
            accessibilityLabel={secondaryActionLabel}
            style={({ pressed }) => [styles.filterButton, pressed && styles.filterButtonPressed]}
          >
            <AppIcon name={secondaryActionIcon} size={16} color={colors.textPrimary} />
            <Text style={styles.filterLabel}>{secondaryActionLabel}</Text>
          </Pressable>
        ) : null}

        {primaryActionLabel && onPrimaryAction ? (
          <Pressable
            onPress={onPrimaryAction}
            accessibilityRole="button"
            accessibilityLabel={primaryActionLabel}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <AppIcon name={primaryActionIcon} size={16} color={colors.white} />
            <Text style={styles.primaryLabel} numberOfLines={1}>{primaryActionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  containerMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  titleGroup: {
    gap: 4,
    flexShrink: 1,
  },
  title: {
    ...typography.pageTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.pageSubtitle,
    color: colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  controlsMobile: {
    justifyContent: 'space-between',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  filterButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  filterLabel: {
    ...typography.button,
    color: colors.textPrimary,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryDark,
  },
  primaryLabel: {
    ...typography.button,
    color: colors.white,
  },
});
