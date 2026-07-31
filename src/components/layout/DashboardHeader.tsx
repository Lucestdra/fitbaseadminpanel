import { View, Text, Pressable, StyleSheet } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl';
import { colors, radii, spacing, typography } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { DashboardPeriod } from '@/types/dashboard';

const periodOptions: SegmentOption<DashboardPeriod>[] = [
  { value: 'today', label: 'Bugün' },
  { value: 'week', label: 'Bu Hafta' },
  { value: 'month', label: 'Bu Ay' },
];

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  onCalendarPress?: () => void;
  selectedRangeLabel?: string;
}

export function DashboardHeader({
  title,
  subtitle,
  period,
  onPeriodChange,
  onCalendarPress,
  selectedRangeLabel,
}: DashboardHeaderProps) {
  const { isMobile } = useResponsiveLayout();

  return (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      <View style={styles.titleGroup}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={[styles.controls, isMobile && styles.controlsMobile]}>
        <SegmentedControl options={periodOptions} value={period} onChange={onPeriodChange} />
        <Pressable
          onPress={onCalendarPress}
          accessibilityRole="button"
          accessibilityLabel={selectedRangeLabel ? `Seçili tarih aralığı: ${selectedRangeLabel}, değiştir` : 'Tarih aralığı seç'}
          style={({ pressed }) => [
            styles.calendarButton,
            Boolean(selectedRangeLabel) && styles.calendarButtonWithLabel,
            pressed && styles.calendarButtonPressed,
          ]}
        >
          <AppIcon name="calendar-outline" size={18} color={colors.textPrimary} />
          {selectedRangeLabel && <Text style={styles.calendarLabel} numberOfLines={1}>{selectedRangeLabel}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  controlsMobile: {
    justifyContent: 'space-between',
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
  },
  calendarButtonWithLabel: {
    width: 'auto',
    paddingHorizontal: spacing.md,
  },
  calendarButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  calendarLabel: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
});
