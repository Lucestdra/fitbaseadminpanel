import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TrendChart } from './TrendChart';
import { colors } from '@/theme';
import type { TrendPoint } from '@/api/analytics';

interface MemberGrowthCardProps {
  joined: TrendPoint[];
  lapsed: TrendPoint[];
}

/**
 * Joins and lapses, plotted beside each other and never netted.
 *
 * <b>A month that gained nineteen and lost eight is a different month from one that gained
 * eleven</b>, and only two lines can say so.
 *
 * The lapse line is understated for any window inside the 30-day grace (ADR-0037): a member who
 * stops coming is known to have gone thirty days later, so the most recent points only ever rise.
 * The card says so rather than letting a flattering tail read as retention.
 */
export function MemberGrowthCard({ joined, lapsed }: MemberGrowthCardProps) {
  return (
    <Card style={{ flex: 1 }}>
      <SectionHeader title="Üye Hareketi" icon="people-outline" />

      <TrendChart
        series={[
          { points: joined, color: colors.primary, label: 'Yeni Üye' },
          { points: lapsed, color: colors.warning, label: 'Ayrılan Üye' },
        ]}
      />
    </Card>
  );
}
