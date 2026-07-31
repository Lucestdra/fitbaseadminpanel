import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, spacing, typography } from '@/theme';
import type { MemberStatusCount } from '@/types/members';

interface MemberStatusSummaryProps {
  items: MemberStatusCount[];
}

export function MemberStatusSummary({ items }: MemberStatusSummaryProps) {
  return (
    <Card>
      <SectionHeader title="Üye Durumları" />
      <View style={styles.row}>
        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.count}>{item.count}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
  },
  count: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
});
