import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DailyScheduleCard } from '@/components/dashboard/DailyScheduleCard';
import { ProspectFunnelCard } from '@/components/dashboard/ProspectFunnelCard';
import { PackageRenewalsCard } from '@/components/dashboard/PackageRenewalsCard';
import { CollectionStatusCard } from '@/components/dashboard/CollectionStatusCard';
import { OccupancyChartCard } from '@/components/dashboard/OccupancyChartCard';
import { TrainerPerformanceCard } from '@/components/dashboard/TrainerPerformanceCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { DateRangePickerModal } from '@/components/dashboard/DateRangePickerModal';
import { spacing } from '@/theme';
import { kpiItemsByPeriod } from '@/mock/dashboard';
import type { DashboardPeriod, QuickAction } from '@/types/dashboard';

const QUICK_ACTION_ROUTES: Record<string, string> = {
  'qa-new-member': '/uyeler',
  'qa-plan-trial': '/musteri-adaylari',
  'qa-record-payment': '/odemeler',
  'qa-create-class': '/dersler',
  'qa-send-message': '/mesajlar',
};

export default function OverviewScreen() {
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const [dateRangeVisible, setDateRangeVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null);
  const { isMobile, isTablet } = useResponsiveLayout();
  const { message, visible, show } = useToast();
  const router = useRouter();

  const kpiBasis = isMobile ? '47%' : isTablet ? '31%' : '15.2%';
  const kpiItems = kpiItemsByPeriod[period];

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
        subtitle="Merhaba Selin, stüdyonda neler oluyor bakalım. 👋"
        period={period}
        onPeriodChange={setPeriod}
        onCalendarPress={() => setDateRangeVisible(true)}
        selectedRangeLabel={selectedRange ? `${selectedRange.start} – ${selectedRange.end}` : undefined}
      />

      <View style={styles.kpiGrid}>
        {kpiItems.map((item) => (
          <View key={item.id} style={[styles.kpiItem, { flexBasis: kpiBasis }]}>
            <KpiCard item={item} />
          </View>
        ))}
      </View>

      {isMobile ? (
        <View style={styles.stack}>
          <DailyScheduleCard />
          <ProspectFunnelCard />
          <PackageRenewalsCard />
        </View>
      ) : isTablet ? (
        <View style={styles.stack}>
          <View style={styles.row}>
            <View style={styles.flexEqual}><DailyScheduleCard /></View>
            <View style={styles.flexEqual}><ProspectFunnelCard /></View>
          </View>
          <PackageRenewalsCard />
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.flex34}><DailyScheduleCard /></View>
          <View style={styles.flex32}><ProspectFunnelCard /></View>
          <View style={styles.flex34}><PackageRenewalsCard /></View>
        </View>
      )}

      {isMobile ? (
        <View style={styles.stack}>
          <CollectionStatusCard />
          <OccupancyChartCard />
          <TrainerPerformanceCard />
          <QuickActionsCard onActionPress={handleQuickAction} />
        </View>
      ) : isTablet ? (
        <View style={styles.stack}>
          <View style={styles.row}>
            <View style={styles.flexEqual}><CollectionStatusCard /></View>
            <View style={styles.flexEqual}><OccupancyChartCard /></View>
          </View>
          <View style={styles.row}>
            <View style={styles.flexEqual}><TrainerPerformanceCard /></View>
            <View style={styles.flexEqual}><QuickActionsCard onActionPress={handleQuickAction} /></View>
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.flex21}><CollectionStatusCard /></View>
          <View style={styles.flex29}><OccupancyChartCard /></View>
          <View style={styles.flex29}><TrainerPerformanceCard /></View>
          <View style={styles.flex21}><QuickActionsCard onActionPress={handleQuickAction} /></View>
        </View>
      )}

      <DateRangePickerModal
        visible={dateRangeVisible}
        onClose={() => setDateRangeVisible(false)}
        onApply={(range) => {
          setSelectedRange(range);
          setDateRangeVisible(false);
          show(`Tarih aralığı uygulandı: ${range.start} – ${range.end}`);
        }}
      />

      <Toast message={message} visible={visible} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
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
