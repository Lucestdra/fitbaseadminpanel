import type { MetricComparison, MetricValue } from '@/api/analytics';

/**
 * The Turkish label for a metric id.
 *
 * <b>Labels live here; definitions live on the server.</b> ADR-0012 puts English enums and ids on
 * the wire and Turkish in this adapter, so renaming a tile is a one-line change on one side and
 * never a silent change of meaning on the other.
 */
const LABELS: Record<string, string> = {
  activeMembers: 'Aktif Üyeler',
  membersJoined: 'Yeni Üye',
  membersLapsed: 'Ayrılan Üye',
  churnRate: 'Churn Oranı',
  revenueCollected: 'Tahsil Edilen',
  revenueRefunded: 'İade Edilen',
  outstandingAmount: 'Bekleyen Alacak',
  overdueAmount: 'Gecikmiş',
  sessionsHeld: 'Yapılan Ders',
  bookedOccupancyRate: 'Doluluk',
  attendanceRate: 'Gelme Oranı',
  noShowRate: 'Gelmeyen Oranı',
  leadsCreated: 'Yeni Müşteri Adayı',
  leadConversionRate: 'Aday Dönüşüm Oranı',
  programCoverageRate: 'Program Yazılma Oranı',
  trainerSessions: 'Ders Sayısı',
  trainerOccupancyRate: 'Doluluk',
  trainerNoShowRate: 'Gelmeyen Oranı',
  trainerAttributedRevenue: 'Pay Edilen Gelir',
  classBookings: 'Rezervasyon',
  classOccupancyRate: 'Doluluk',
};

/** What a comparison is being compared against. Tokens, turned into words here. */
const BASIS_LABELS: Record<string, string> = {
  previousDay: 'düne göre',
  previousWeek: 'geçen haftaya göre',
  previousMonthToDate: 'geçen ayın aynı dönemine göre',
};

/**
 * Why a metric has no number.
 *
 * <b>Each reason gets its own sentence.</b> "Yeterli veri yok" for a studio in its first fortnight
 * and for a month nobody has rolled up are different facts, and one phrase for both would tell a
 * manager to wait when they should be asking why the job has not run.
 */
const ABSENT_LABELS: Record<string, string> = {
  TooFewObservations: 'Yeterli veri yok',
  NoPriorPeriod: 'Karşılaştırılacak önceki dönem yok',
  NotRolledUp: 'Bu dönem için veri henüz hesaplanmadı',
};

export function metricLabel(id: string): string {
  return LABELS[id] ?? id;
}

export function absentLabel(reason: string): string {
  return ABSENT_LABELS[reason] ?? 'Veri yok';
}

export function basisLabel(basis: string): string {
  return BASIS_LABELS[basis] ?? basis;
}

/**
 * A metric's value as text, or `null` when there is no number.
 *
 * <b>Ratios arrive in 0..1 and are multiplied here, once.</b> The panel's four chart components each
 * took percentages and each divided by 100 at a different point, which is how the same rate rendered
 * as 32 in one place and 0.32 in another.
 */
export function formatMetric(metric: MetricValue, currency = '₺'): string | null {
  if (metric.value === null || metric.value === undefined) return null;

  switch (metric.unit) {
    case 'Money':
      return `${currency}${Math.round(metric.value).toLocaleString('tr-TR')}`;

    case 'Ratio':
      return `%${(metric.value * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;

    default:
      return metric.value.toLocaleString('tr-TR');
  }
}

/** How a delta should be coloured, from the server's polarity and the direction of travel. */
export type ChangeTone = 'good' | 'bad' | 'neutral';

/**
 * Whether a movement is good news.
 *
 * <b>Polarity comes from the server and is not derived here</b> (ADR-0065). The panel drew a green
 * up-arrow for revenue and the same green up-arrow for churn, because a number was all it had.
 */
export function changeTone(metric: MetricValue): ChangeTone {
  const change = metric.comparison?.change ?? 0;

  if (change === 0 || metric.polarity === 'Neutral') return 'neutral';

  const rising = change > 0;

  return metric.polarity === 'HigherIsBetter'
    ? rising
      ? 'good'
      : 'bad'
    : rising
      ? 'bad'
      : 'good';
}

/**
 * A comparison as text, or `null` when there is nothing to say.
 *
 * A change with no ratio — the previous window was zero — renders as the absolute movement rather
 * than as a percentage nobody could defend. Going from no members to five is not a 500% rise.
 */
export function formatChange(comparison: MetricComparison | null | undefined): string | null {
  if (!comparison) return null;

  const arrow = comparison.change > 0 ? '↑' : comparison.change < 0 ? '↓' : '·';

  if (comparison.changeRatio === null || comparison.changeRatio === undefined) {
    return comparison.previousValue === 0
      ? `${arrow} yeni · ${basisLabel(comparison.basis)}`
      : `${arrow} ${basisLabel(comparison.basis)}`;
  }

  const percent = Math.abs(comparison.changeRatio * 100).toLocaleString('tr-TR', {
    maximumFractionDigits: 1,
  });

  return `${arrow} %${percent} ${basisLabel(comparison.basis)}`;
}

/** A trend point's span as a short Turkish label, from real dates rather than a stored string. */
export function trendLabel(from: string, through: string): string {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${through}T00:00:00Z`);

  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

  // A span inside one month is named by the month; one crossing a boundary is named by both ends,
  // because "Şub" for 28 January to 27 February would be wrong twice over.
  if (start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear()) {
    return months[start.getUTCMonth()];
  }

  return `${start.getUTCDate()} ${months[start.getUTCMonth()]} – ${end.getUTCDate()} ${months[end.getUTCMonth()]}`;
}
