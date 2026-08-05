import { client, withAuth } from './client';
import type { components } from './schema';

export type AnalyticsPeriod = components['schemas']['AnalyticsPeriod'];
export type AnalyticsWindow = components['schemas']['AnalyticsWindow'];
export type MetricValue = components['schemas']['MetricValue'];
export type MetricComparison = components['schemas']['MetricComparison'];
export type MetricPolarity = components['schemas']['MetricPolarity'];
export type MetricUnit = components['schemas']['MetricUnit'];
export type InsufficientDataReason = components['schemas']['InsufficientDataReason'];
export type DashboardView = components['schemas']['DashboardView'];
export type ReportView = components['schemas']['ReportView'];
export type FunnelStage = components['schemas']['FunnelStage'];
export type TrainerRow = components['schemas']['TrainerRow'];
export type ClassRow = components['schemas']['ClassRow'];
export type TrendPoint = components['schemas']['TrendPoint'];

/**
 * Every metric id the server may return.
 *
 * <b>Mirrors `docs/contracts/metrics.md`, and the server is the authority.</b> Nothing here decides
 * what a number means; these are lookup keys, so that a screen asking for a tile that no longer
 * exists is a compile error rather than a card that renders blank.
 */
export const METRIC = {
  activeMembers: 'activeMembers',
  membersJoined: 'membersJoined',
  membersLapsed: 'membersLapsed',
  churnRate: 'churnRate',
  revenueCollected: 'revenueCollected',
  revenueRefunded: 'revenueRefunded',
  outstandingAmount: 'outstandingAmount',
  overdueAmount: 'overdueAmount',
  sessionsHeld: 'sessionsHeld',
  bookedOccupancyRate: 'bookedOccupancyRate',
  attendanceRate: 'attendanceRate',
  noShowRate: 'noShowRate',
  leadsCreated: 'leadsCreated',
  leadConversionRate: 'leadConversionRate',
  programCoverageRate: 'programCoverageRate',
  trainerSessions: 'trainerSessions',
  trainerOccupancyRate: 'trainerOccupancyRate',
  trainerNoShowRate: 'trainerNoShowRate',
  trainerAttributedRevenue: 'trainerAttributedRevenue',
  classBookings: 'classBookings',
  classOccupancyRate: 'classOccupancyRate',
} as const;

/**
 * The dashboard for a period.
 *
 * <b>The response shape depends on the caller and not on anything sent from here.</b> A manager gets
 * the studio; a coach gets four numbers about their own teaching and no money at all. There is no
 * scope parameter to pass and no trainer id to spoof — `view.scope` says which shape came back so
 * the screen can label it honestly, rather than a coach's own figures being presented as the
 * studio's.
 */
export async function getDashboard(period: AnalyticsPeriod): Promise<DashboardView> {
  return withAuth(() =>
    client.GET('/api/v1/analytics/dashboard', { params: { query: { period } } }),
  );
}

/**
 * The reports screen for a period.
 *
 * Behind `analytics.reports.read`, which by default only a manager holds — trainer attribution is
 * payroll-adjacent (ADR-0038). A caller without it gets 403 from the server, not a hidden tab.
 */
export async function getReports(period: AnalyticsPeriod): Promise<ReportView> {
  return withAuth(() => client.GET('/api/v1/analytics/reports', { params: { query: { period } } }));
}

/** Finds one metric in a list, or `undefined` when the caller may not see it. */
export function metric(metrics: MetricValue[], id: string): MetricValue | undefined {
  return metrics.find((entry) => entry.id === id);
}
