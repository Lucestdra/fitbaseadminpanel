import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors, spacing, typography } from '@/theme';
import { collectionSummary } from '@/mock/dashboard';

function formatCurrency(value: number) {
  return `₺${value.toLocaleString('tr-TR')}`;
}

export function CollectionStatusCard() {
  const router = useRouter();

  return (
    <Card style={styles.card}>
      <SectionHeader
        title="Tahsilat Durumu"
        actionLabel="Tümünü Gör"
        actionIcon="chevron-forward"
        onActionPress={() => router.replace('/odemeler')}
      />

      <View style={styles.rows}>
        <View style={styles.row}>
          <Text style={styles.label}>Ödenmesi Gereken</Text>
          <Text style={[styles.value, { color: colors.warning }]}>
            {formatCurrency(collectionSummary.outstanding)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Geciken (7 gün+)</Text>
          <Text style={[styles.value, { color: colors.critical }]}>
            {formatCurrency(collectionSummary.overdue)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tahsil Edilen (Bu Ay)</Text>
          <Text style={[styles.value, { color: colors.primaryDark }]}>
            {formatCurrency(collectionSummary.collectedThisMonth)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tahsilat Oranı</Text>
          <Text style={styles.value}>%{collectionSummary.collectionRate}</Text>
        </View>
      </View>

      <ProgressBar
        percentage={collectionSummary.collectionRate}
        accessibilityLabel={`Tahsilat oranı yüzde ${collectionSummary.collectionRate}`}
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
