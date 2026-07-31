export interface RevenueTrendPoint {
  month: string;
  revenue: number;
}

export interface MemberGrowthPoint {
  month: string;
  newMembers: number;
  churned: number;
}

export interface TrainerPerformance {
  id: string;
  name: string;
  sessionsCount: number;
  occupancyRate: number;
  revenue: number;
}

export interface PopularClassStat {
  id: string;
  name: string;
  bookings: number;
  occupancyRate: number;
}
