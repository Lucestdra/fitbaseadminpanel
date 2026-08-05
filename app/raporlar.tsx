import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RevenueTrendCard } from '@/components/reports/RevenueTrendCard';
import { MemberGrowthCard } from '@/components/reports/MemberGrowthCard';
import { TrainerPerformanceCard } from '@/components/reports/TrainerPerformanceCard';
import { PopularClassesCard } from '@/components/reports/PopularClassesCard';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useReports } from '@/hooks/useAnalytics';
import { colors, spacing, typography } from '@/theme';
import { METRIC } from '@/api/analytics';
import type { AnalyticsPeriod } from '@/api/analytics';
import type { IconName } from '@/types/dashboard';

const TILES: { id: string; icon: IconName }[] = [
  { id: METRIC.revenueCollected, icon: 'wallet-outline' },
  { id: METRIC.membersJoined, icon: 'person-add-outline' },
  { id: METRIC.churnRate, icon: 'trending-down-outline' },
  { id: METRIC.bookedOccupancyRate, icon: 'pie-chart-outline' },
  { id: METRIC.leadConversionRate, icon: 'filter-outline' },
];

/**
 * The reports screen.
 *
 * <b>Export is not here.</b> The panel's four quick actions — PDF, Excel, scheduled report, share —
 * every one of them showed a toast saying the feature was coming. Buttons that do nothing are worse
 * than absent ones: they teach a studio that the product is unreliable rather than incomplete.
 * Export is Phase 2.5 work still blocked on a licence decision (plan decision D24).
 */
export default function ReportsScreen() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('Month');
  const { isMobile, isTablet } = useResponsiveLayout();

  const { view, status } = useReports(period);

  const kpiBasis = isMobile ? '47%' : isTablet ? '31%' : '18.4%';

  const metrics = view?.metrics ?? [];
  const tiles = TILES.map((tile) => ({
    ...tile,
    metric: metrics.find((entry) => entry.id === tile.id),
  })).filter((tile) => tile.metric !== undefined);

  // A refusal is not a failure. A consultant opening this route is looking at a screen that is not
  // theirs, and saying so beats "bir şeyler ters gitti" — which would send them to support.
  if (status === 'forbidden') {
    return (
      <AppShell activeId="reports">
        <View style={styles.header}>
          <Text style={styles.title}>Raporlar</Text>
          <Text style={styles.subtitle}>
            Bu ekran stüdyo yöneticilerine açık. Antrenör bazlı gelir dağılımı bordroya yakın bir
            bilgi olduğu için varsayılan olarak paylaşılmıyor.
          </Text>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell activeId="reports">
      <DashboardHeader
        title="Raporlar"
        subtitle="Gelir, üye hareketi ve ekip performansını tek ekrandan izle."
        period={period}
        onPeriodChange={setPeriod}
      />

      {status === 'error' ? (
        <Text style={styles.notice}>Rapor yüklenemedi. Sayfayı yenilemeyi dene.</Text>
      ) : null}

      {status === 'loading' && tiles.length === 0 ? (
        <Text style={styles.notice}>Yükleniyor…</Text>
      ) : null}

      <View style={styles.kpiGrid}>
        {tiles.map((tile) => (
          <View key={tile.id} style={[styles.kpiItem, { flexBasis: kpiBasis }]}>
            <MetricCard metric={tile.metric!} icon={tile.icon} />
          </View>
        ))}
      </View>

      {isMobile || isTablet ? (
        <View style={styles.stack}>
          <RevenueTrendCard points={view?.revenueTrend ?? []} />
          <MemberGrowthCard
            joined={view?.membersJoinedTrend ?? []}
            lapsed={view?.membersLapsedTrend ?? []}
          />
          <TrainerPerformanceCard
            trainers={view?.trainers ?? []}
            residual={view?.attributionResidual ?? 0}
          />
          <PopularClassesCard classes={view?.classes ?? []} />
        </View>
      ) : (
        <>
          <View style={styles.chartRow}>
            <RevenueTrendCard points={view?.revenueTrend ?? []} />
            <MemberGrowthCard
              joined={view?.membersJoinedTrend ?? []}
              lapsed={view?.membersLapsedTrend ?? []}
            />
          </View>
          <View style={styles.row}>
            <View style={styles.mainCol}>
              <TrainerPerformanceCard
                trainers={view?.trainers ?? []}
                residual={view?.attributionResidual ?? 0}
              />
            </View>
            <View style={styles.sideCol}>
              <PopularClassesCard classes={view?.classes ?? []} />
            </View>
          </View>
        </>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 4,
  },
  title: {
    ...typography.pageTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.pageSubtitle,
    color: colors.textSecondary,
  },
  notice: {
    ...typography.body,
    color: colors.textSecondary,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  kpiItem: {
    flexGrow: 1,
    minWidth: 150,
  },
  stack: {
    gap: spacing.xxl,
  },
  chartRow: {
    flexDirection: 'row',
    gap: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xxl,
    alignItems: 'flex-start',
  },
  mainCol: {
    flex: 68,
  },
  sideCol: {
    flex: 32,
    gap: spacing.xxl,
  },
});
