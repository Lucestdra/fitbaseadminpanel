import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DailyScheduleCard } from '@/components/dashboard/DailyScheduleCard';
import { ProspectFunnelCard } from '@/components/dashboard/ProspectFunnelCard';
import { PackageRenewalsCard } from '@/components/dashboard/PackageRenewalsCard';
import { CollectionStatusCard } from '@/components/dashboard/CollectionStatusCard';
import { OccupancyCard } from '@/components/dashboard/OccupancyCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useDashboard } from '@/hooks/useAnalytics';
import { colors, spacing, typography } from '@/theme';
import { METRIC } from '@/api/analytics';
import type { AnalyticsPeriod } from '@/api/analytics';
import type { IconName, QuickAction } from '@/types/dashboard';

const QUICK_ACTION_ROUTES: Record<string, string> = {
  'qa-new-member': '/uyeler',
  'qa-plan-trial': '/musteri-adaylari',
  'qa-record-payment': '/odemeler',
  'qa-create-class': '/dersler',
  'qa-send-message': '/mesajlar',
};

/**
 * Which tiles get a place at the top, and where they lead.
 *
 * <b>The order is fixed here; the presence is not.</b> A tile appears only if the server returned
 * that metric, so a coach's dashboard is four cards and a manager's is six without either screen
 * hiding anything — hiding is a decision a debugger can undo.
 */
const TILES: { id: string; icon: IconName; href?: string }[] = [
  { id: METRIC.activeMembers, icon: 'people-outline', href: '/uyeler' },
  { id: METRIC.membersJoined, icon: 'person-add-outline', href: '/uyeler' },
  { id: METRIC.sessionsHeld, icon: 'barbell-outline', href: '/takvim' },
  { id: METRIC.bookedOccupancyRate, icon: 'pie-chart-outline', href: '/dersler' },
  { id: METRIC.leadsCreated, icon: 'sparkles-outline', href: '/musteri-adaylari' },
  { id: METRIC.revenueCollected, icon: 'wallet-outline', href: '/odemeler' },
];

export default function OverviewScreen() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('Today');
  const { isMobile, isTablet } = useResponsiveLayout();
  const { message, visible, show } = useToast();
  const router = useRouter();

  const { view, status } = useDashboard(period);

  const kpiBasis = isMobile ? '47%' : isTablet ? '31%' : '15.2%';

  const metrics = view?.metrics ?? [];

  // Empty under Own scope, and empty for a Day window — one point is not a line. The card decides
  // whether to draw it; this screen only passes it on.
  const occupancyTrend = view?.occupancyTrend ?? [];
  const tiles = TILES.map((tile) => ({
    ...tile,
    metric: metrics.find((entry) => entry.id === tile.id),
  })).filter((tile) => tile.metric !== undefined);

  // `Own` is a coach looking at their own teaching. Saying so is not decoration: the same four
  // numbers presented as the studio's would be wrong, and the panel had no way to tell them apart.
  const isOwnScope = view?.scope === 'Own';

  const handleQuickAction = (action: QuickAction) => {
    const route = QUICK_ACTION_ROUTES[action.id];
    if (route) {
      router.replace(route as never);
      return;
    }
    show(action.toastMessage);
  };

  return (
    <AppShell activeId="overview">
      <DashboardHeader
        title="Stüdyo Dashboard"
        subtitle={
          isOwnScope
            ? 'Kendi derslerinin özeti. Stüdyo geneli için yöneticine sor.'
            : 'Stüdyonda neler oluyor bakalım. 👋'
        }
        period={period}
        onPeriodChange={setPeriod}
      />

      {status === 'error' ? (
        <Text style={styles.notice}>Özet yüklenemedi. Sayfayı yenilemeyi dene.</Text>
      ) : null}

      {status === 'loading' && tiles.length === 0 ? (
        <Text style={styles.notice}>Yükleniyor…</Text>
      ) : null}

      <View style={styles.kpiGrid}>
        {tiles.map((tile) => (
          <View key={tile.id} style={[styles.kpiItem, { flexBasis: kpiBasis }]}>
            <MetricCard metric={tile.metric!} icon={tile.icon} href={tile.href} />
          </View>
        ))}
      </View>

      {isMobile ? (
        <View style={styles.stack}>
          <DailyScheduleCard />
          {!isOwnScope && <ProspectFunnelCard funnel={view?.funnel ?? []} metrics={metrics} />}
          <PackageRenewalsCard />
        </View>
      ) : isTablet ? (
        <View style={styles.stack}>
          <View style={styles.row}>
            <View style={styles.flexEqual}><DailyScheduleCard /></View>
            {!isOwnScope && (
              <View style={styles.flexEqual}>
                <ProspectFunnelCard funnel={view?.funnel ?? []} metrics={metrics} />
              </View>
            )}
          </View>
          <PackageRenewalsCard />
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.flex34}><DailyScheduleCard /></View>
          {!isOwnScope && (
            <View style={styles.flex32}>
              <ProspectFunnelCard funnel={view?.funnel ?? []} metrics={metrics} />
            </View>
          )}
          <View style={styles.flex34}><PackageRenewalsCard /></View>
        </View>
      )}

      {isMobile ? (
        <View style={styles.stack}>
          {!isOwnScope && <CollectionStatusCard metrics={metrics} />}
          <OccupancyCard metrics={metrics} trend={occupancyTrend} />
          <QuickActionsCard onActionPress={handleQuickAction} />
        </View>
      ) : (
        <View style={styles.row}>
          {!isOwnScope && (
            <View style={styles.flex29}><CollectionStatusCard metrics={metrics} /></View>
          )}
          <View style={styles.flex29}><OccupancyCard metrics={metrics} trend={occupancyTrend} /></View>
          <View style={styles.flex21}><QuickActionsCard onActionPress={handleQuickAction} /></View>
        </View>
      )}

      <Toast message={message} visible={visible} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
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
    minWidth: 155,
  },
  stack: {
    gap: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xxl,
    alignItems: 'stretch',
  },
  flexEqual: {
    flex: 1,
  },
  flex34: {
    flex: 34,
  },
  flex32: {
    flex: 32,
  },
  flex21: {
    flex: 21,
  },
  flex29: {
    flex: 29,
  },
});
