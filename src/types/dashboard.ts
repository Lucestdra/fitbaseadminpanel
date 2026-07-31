import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type DashboardPeriod = 'today' | 'week' | 'month';

export interface KpiItem {
  id: string;
  title: string;
  value: string;
  change?: string;
  icon: IconName;
  href?: string;
}

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  trainer: string;
  booked: number;
  capacity: number;
}

export interface FunnelItem {
  id: string;
  label: string;
  count: number;
  percentage: number;
}

export interface RenewalItem {
  id: string;
  memberName: string;
  packageName: string;
  remainingDays: number;
  renewalDate: string;
  avatarInitials: string;
}

export interface CollectionSummary {
  outstanding: number;
  overdue: number;
  collectedThisMonth: number;
  collectionRate: number;
}

export interface OccupancyDayPoint {
  day: string;
  occupancyRate: number;
  noShowRate: number;
}

export interface TrainerPerformance {
  id: string;
  name: string;
  attendanceRate: number;
  rating: number;
  avatarInitials: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: IconName;
  toastMessage: string;
}
