import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TrendChart } from './TrendChart';
import { colors } from '@/theme';
import type { TrendPoint } from '@/api/analytics';

interface RevenueTrendCardProps {
  points: TrendPoint[];
}

/**
 * Collections over the trailing windows.
 *
 * <b>Cash basis, and the same number `/odemeler` reports</b> (ADR-0036). The panel drew this from
 * one constant array and put a different monthly figure on the dashboard under the same label; there
 * is exactly one revenue metric now and both screens read it.
 */
export function RevenueTrendCard({ points }: RevenueTrendCardProps) {
  return (
    <Card style={{ flex: 1 }}>
      <SectionHeader title="Gelir Trendi" icon="trending-up-outline" />

      <TrendChart
        series={[
          {
            points,
            color: colors.primary,
            label: 'Tahsil Edilen',
            format: (value) => `₺${Math.round(value / 1000)}bin`,
          },
        ]}
      />
    </Card>
  );
}
