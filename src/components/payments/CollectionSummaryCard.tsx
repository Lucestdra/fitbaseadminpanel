import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, spacing, typography } from '@/theme';
import type { CollectionSummary } from '@/types/dashboard';

interface CollectionSummaryCardProps {
  summary: CollectionSummary;
}

function formatCurrency(value: number) {
  return `₺${value.toLocaleString('tr-TR')}`;
}

export function CollectionSummaryCard({ summary }: CollectionSummaryCardProps) {
  return (
    <Card style={styles.card}>
      <SectionHeader title="Tahsilat Özeti" />

      <View style={styles.rows}>
        <View style={styles.row}>
          <Text style={styles.label}>Ödenmesi Gereken</Text>
          <Text style={[styles.value, { color: colors.warning }]}>{formatCurrency(summary.outstanding)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Geciken (7 gün+)</Text>
          <Text style={[styles.value, { color: colors.critical }]}>{formatCurrency(summary.overdue)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tahsil Edilen (Bu Ay)</Text>
          <Text style={[styles.value, { color: colors.primaryDark }]}>{formatCurrency(summary.collectedThisMonth)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tahsilat Oranı</Text>
          <Text style={styles.value}>%{summary.collectionRate}</Text>
        </View>
      </View>

      <ProgressBar
        percentage={summary.collectionRate}
        accessibilityLabel={`Tahsilat oranı yüzde ${summary.collectionRate}`}
        height={8}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.xl,
  },
  rows: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
  },
  value: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
});
