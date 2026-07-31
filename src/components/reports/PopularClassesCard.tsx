import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, spacing, typography } from '@/theme';
import { popularClasses } from '@/mock/reports';

export function PopularClassesCard() {
  return (
    <Card style={styles.card}>
      <SectionHeader title="Popüler Dersler" icon="flame-outline" />

      <View style={styles.list}>
        {popularClasses.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.bookings}>{item.bookings} rezervasyon</Text>
            </View>
            <ProgressBar percentage={item.occupancyRate} />
            <Text style={styles.occupancyLabel}>%{item.occupancyRate} doluluk</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  row: {
    gap: 6,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  bookings: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  occupancyLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
