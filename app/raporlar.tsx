import { View, Text, StyleSheet } from 'react-native';
import { AppShell } from '@/components/layout/AppShell';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { RevenueTrendCard } from '@/components/reports/RevenueTrendCard';
import { MemberGrowthCard } from '@/components/reports/MemberGrowthCard';
import { TrainerPerformanceCard } from '@/components/reports/TrainerPerformanceCard';
import { PopularClassesCard } from '@/components/reports/PopularClassesCard';
import { QuickActionsGrid } from '@/components/shared/QuickActionsGrid';
import { Toast } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { colors, spacing, typography } from '@/theme';
import { reportKpis, reportQuickActions } from '@/mock/reports';

export default function ReportsScreen() {
  const { isMobile, isTablet } = useResponsiveLayout();
  const { message, visible, show } = useToast();

  const kpiBasis = isMobile ? '47%' : isTablet ? '31%' : '18.4%';

  const sidebar = (
    <>
      <PopularClassesCard />
      <QuickActionsGrid actions={reportQuickActions} onActionPress={(action) => show(action.toastMessage)} />
    </>
  );

  return (
    <AppShell activeId="reports">
      <View style={styles.header}>
        <Text style={styles.title}>Raporlar</Text>
        <Text style={styles.subtitle}>Gelir, üye büyümesi ve ekip performansını tek ekrandan izle.</Text>
      </View>

      <View style={styles.kpiGrid}>
        {reportKpis.map((item) => (
          <View key={item.id} style={[styles.kpiItem, { flexBasis: kpiBasis }]}>
            <KpiCard item={item} />
          </View>
        ))}
      </View>

      {isMobile || isTablet ? (
        <View style={styles.stack}>
          <RevenueTrendCard />
          <MemberGrowthCard />
          <TrainerPerformanceCard />
          {sidebar}
        </View>
      ) : (
        <>
          <View style={styles.chartRow}>
            <RevenueTrendCard />
            <MemberGrowthCard />
          </View>
          <View style={styles.row}>
            <View style={styles.mainCol}>
              <TrainerPerformanceCard />
            </View>
            <View style={styles.sideCol}>{sidebar}</View>
          </View>
        </>
      )}

      <Toast message={message} visible={visible} />
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
