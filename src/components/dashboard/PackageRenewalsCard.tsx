import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { AppIcon } from '@/components/ui/AppIcon';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography } from '@/theme';
import { packageRenewals } from '@/mock/dashboard';
import type { RenewalItem } from '@/types/dashboard';

const URGENT_THRESHOLD_DAYS = 7;

function isUrgent(item: RenewalItem) {
  return item.remainingDays <= URGENT_THRESHOLD_DAYS;
}

export function PackageRenewalsCard() {
  const router = useRouter();

  return (
    <Card style={styles.card}>
      <SectionHeader
        title="Paket Yenilemeleri"
        actionLabel="Tümünü Gör"
        actionIcon="chevron-forward"
        onActionPress={() => router.replace('/uyeler')}
      />

      <View style={styles.list}>
        {packageRenewals.map((item) => {
          const urgent = isUrgent(item);
          return (
            <View
              key={item.id}
              accessibilityLabel={`${item.memberName}, ${item.packageName}, ${item.remainingDays} gün kaldı`}
              style={styles.row}
            >
              <Avatar initials={item.avatarInitials} />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.memberName}</Text>
                <Text style={styles.packageName} numberOfLines={1}>{item.packageName}</Text>
              </View>
              <View style={styles.meta}>
                <Badge label={`${item.remainingDays} gün kaldı`} tone={urgent ? 'warning' : 'neutral'} />
                <Text style={styles.date}>{item.renewalDate}</Text>
              </View>
              <AppIcon name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  list: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  packageName: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  meta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  date: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
