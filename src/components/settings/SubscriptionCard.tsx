import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AppIcon } from '@/components/ui/AppIcon';
import { colors, spacing, typography, radii } from '@/theme';
import type { SubscriptionInfo } from '@/types/settings';

interface SubscriptionCardProps {
  subscription: SubscriptionInfo;
  onUpgrade: () => void;
  onViewInvoices: () => void;
}

export function SubscriptionCard({ subscription, onUpgrade, onViewInvoices }: SubscriptionCardProps) {
  const usagePercentage = Math.round((subscription.memberUsage / subscription.memberLimit) * 100);

  return (
    <Card style={styles.card}>
      <SectionHeader title="Abonelik Bilgileri" icon="sparkles-outline" />

      <View style={styles.planRow}>
        <View>
          <Text style={styles.planName}>{subscription.planName}</Text>
          <Text style={styles.planPrice}>{subscription.price}</Text>
        </View>
        <Badge label="Aktif" tone="mint" />
      </View>

      <Text style={styles.renewalText}>Yenileme tarihi: {subscription.renewalDate}</Text>

      <View style={styles.usageGroup}>
        <View style={styles.usageHeader}>
          <Text style={styles.usageLabel}>Üye Kullanımı</Text>
          <Text style={styles.usageValue}>
            {subscription.memberUsage} / {subscription.memberLimit} (%{usagePercentage})
          </Text>
        </View>
        <ProgressBar percentage={usagePercentage} accessibilityLabel={`Üye kullanımı yüzde ${usagePercentage}`} />
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onUpgrade}
          accessibilityRole="button"
          accessibilityLabel="Planı yükselt"
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          <AppIcon name="arrow-up-circle-outline" size={16} color={colors.white} />
          <Text style={styles.primaryLabel}>Planı Yükselt</Text>
        </Pressable>
        <Pressable
          onPress={onViewInvoices}
          accessibilityRole="button"
          accessibilityLabel="Fatura geçmişini gör"
          style={({ pressed }) => [styles.outlineButton, pressed && styles.outlineButtonPressed]}
        >
          <Text style={styles.outlineLabel}>Fatura Geçmişi</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    ...typography.bodyStrong,
    fontSize: 18,
    color: colors.textPrimary,
  },
  planPrice: {
    ...typography.body,
    color: colors.textSecondary,
  },
  renewalText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  usageGroup: {
    gap: spacing.xs,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  usageLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  usageValue: {
    ...typography.captionStrong,
    color: colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
  outlineButton: {
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButtonPressed: {
    backgroundColor: colors.pageBackground,
  },
  outlineLabel: {
    ...typography.button,
    color: colors.textPrimary,
  },
});
