import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography } from '@/theme';
import { absentLabel, changeTone, formatChange, formatMetric, metricLabel } from '@/utils/metrics';
import type { MetricValue } from '@/api/analytics';
import type { IconName } from '@/types/dashboard';

interface MetricCardProps {
  metric: MetricValue;
  icon: IconName;
  href?: string;
  onPress?: () => void;
}

const TONE_COLORS: Record<string, string> = {
  good: colors.primaryDark,
  bad: colors.critical,
  neutral: colors.textSecondary,
};

/**
 * One registered metric, rendered honestly.
 *
 * <b>Separate from <c>KpiCard</c>, and the separation is the point.</b> A `KpiCard` shows a count
 * derived from a list already on the screen — "42 aktif ders" beside the class table. This shows a
 * number from the metric register, and only the register's numbers carry a definition, a polarity
 * and a statement of when they are incomplete. Letting both through one component would invite a
 * screen to give a locally-counted figure a green up-arrow it has not earned.
 *
 * Three things arrive from the server that the panel had to invent (ADR-0065): the polarity, so
 * churn falling is green and revenue falling is not; whether the value is provisional, so a figure
 * that will move says so; and why there is no number at all, so an unmeasurable rate reads as
 * "yeterli veri yok" rather than as 0%.
 *
 * The panel's equivalent took `change: '↑ %12 vs dün'` — an arrow, a number, a comparison and a
 * language in one string that could not be sorted, coloured or translated apart.
 */
export function MetricCard({ metric, icon, href, onPress }: MetricCardProps) {
  const router = useRouter();
  const isPressable = Boolean(href) || Boolean(onPress);

  const value = formatMetric(metric);
  const change = formatChange(metric.comparison);
  const tone = TONE_COLORS[changeTone(metric)] ?? colors.textSecondary;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (href) router.replace(href as never);
  };

  return (
    <Pressable
      disabled={!isPressable}
      onPress={handlePress}
      accessibilityRole={isPressable ? 'button' : undefined}
      accessibilityLabel={isPressable ? `${metricLabel(metric.id)} detayına git` : undefined}
      style={({ pressed, hovered }: any) => [
        styles.pressWrapper,
        isPressable && hovered && styles.hovered,
        isPressable && pressed && styles.pressed,
      ]}
    >
      <Card style={styles.card}>
        <AppIcon name={icon} withBackground size={19} />

        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {metricLabel(metric.id)}
          </Text>

          {/* Knowably incomplete and will move — a churn cohort still inside its 30-day grace, a
              window only today has answered for. Marked rather than footnoted, because a
              provisional number a studio plans against is worse than no number at all. */}
          {metric.isProvisional && value !== null ? (
            <View style={styles.provisionalBadge}>
              <Text style={styles.provisionalText}>geçici</Text>
            </View>
          ) : null}
        </View>

        {value === null ? (
          <Text style={styles.absent} numberOfLines={2}>
            {absentLabel(metric.insufficientData)}
          </Text>
        ) : (
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
            {value}
          </Text>
        )}

        {change && value !== null ? (
          <View style={styles.changeRow}>
            <AppIcon
              name={(metric.comparison?.change ?? 0) < 0 ? 'arrow-down-outline' : 'arrow-up-outline'}
              size={12}
              color={tone}
            />
            <Text style={[styles.change, { color: tone }]} numberOfLines={1}>
              {change.replace(/^[↑↓·]\s*/, '')}
            </Text>
          </View>
        ) : (
          // No comparison is a real state: the previous window has no coverage, so there is nothing
          // to compare against. An empty row keeps the cards level without inventing one.
          <View style={styles.changeRow} />
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressWrapper: {
    flex: 1,
    minWidth: 150,
    borderRadius: 16,
  },
  hovered: {
    transform: [{ translateY: -2 }],
  },
  pressed: {
    opacity: 0.85,
  },
  card: {
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.kpiTitle,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  provisionalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: colors.warningLight,
  },
  provisionalText: {
    ...typography.caption,
    color: colors.warning,
  },
  value: {
    ...typography.kpiValue,
    color: colors.textPrimary,
  },
  absent: {
    ...typography.kpiChange,
    color: colors.textSecondary,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 16,
  },
  change: {
    ...typography.kpiChange,
  },
});
