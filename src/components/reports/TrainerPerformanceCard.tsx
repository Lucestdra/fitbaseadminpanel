import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors, spacing, typography } from '@/theme';
import { trainerPerformance } from '@/mock/reports';

function formatCurrency(value: number) {
  return `₺${value.toLocaleString('tr-TR')}`;
}

export function TrainerPerformanceCard() {
  return (
    <Card style={styles.card} noPadding>
      <View style={styles.headerWrap}>
        <SectionHeader title="Antrenör Performansı" icon="ribbon-outline" />
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.headerLabel, columnStyles.name]}>Antrenör</Text>
        <Text style={[styles.headerLabel, columnStyles.sessions]}>Seans</Text>
        <Text style={[styles.headerLabel, columnStyles.occupancy]}>Doluluk</Text>
        <Text style={[styles.headerLabel, columnStyles.revenue]}>Gelir</Text>
      </View>

      {trainerPerformance.map((trainer, index) => (
        <View key={trainer.id} style={[styles.row, index === trainerPerformance.length - 1 && styles.rowLast]}>
          <Text style={[styles.cellTextStrong, columnStyles.name]} numberOfLines={1}>{trainer.name}</Text>
          <Text style={[styles.cellText, columnStyles.sessions]}>{trainer.sessionsCount}</Text>
          <Text style={[styles.cellText, columnStyles.occupancy]}>%{trainer.occupancyRate}</Text>
          <Text style={[styles.cellText, columnStyles.revenue]} numberOfLines={1}>{formatCurrency(trainer.revenue)}</Text>
        </View>
      ))}
    </Card>
  );
}

const columnStyles = StyleSheet.create({
  name: { flex: 1.8 },
  sessions: { flex: 1 },
  occupancy: { flex: 1.1 },
  revenue: { flex: 1.3 },
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  headerWrap: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 52,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  cellTextStrong: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  cellText: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
