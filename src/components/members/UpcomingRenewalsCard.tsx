import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { colors, spacing, typography } from '@/theme';
import type { RenewalItem } from '@/types/dashboard';

interface UpcomingRenewalsCardProps {
  items: RenewalItem[];
}

const URGENT_THRESHOLD_DAYS = 7;

export function UpcomingRenewalsCard({ items }: UpcomingRenewalsCardProps) {
  return (
    <Card style={styles.card}>
      <SectionHeader title="Yaklaşan Yenilemeler" />

      <View style={styles.list}>
        {items.map((item) => {
          const urgent = item.remainingDays <= URGENT_THRESHOLD_DAYS;
          return (
            <View key={item.id} style={styles.row}>
              <Avatar initials={item.avatarInitials} />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.memberName}</Text>
                <Text style={styles.packageName} numberOfLines={1}>{item.packageName}</Text>
              </View>
              <View style={styles.meta}>
                <Badge label={`${item.remainingDays} gün kaldı`} tone={urgent ? 'warning' : 'neutral'} />
                <Text style={styles.date}>{item.renewalDate}</Text>
              </View>
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
