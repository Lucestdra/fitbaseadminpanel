import type { RevenueTrendPoint, MemberGrowthPoint, TrainerPerformance, PopularClassStat } from '@/types/reports';
import type { KpiItem, QuickAction } from '@/types/dashboard';

export const reportKpis: KpiItem[] = [
  { id: 'monthly-revenue', title: 'Aylık Gelir', value: '₺304.250', change: '↑ %18 vs geçen ay', icon: 'wallet-outline' },
  { id: 'new-members', title: 'Yeni Üye (Bu Ay)', value: '18', change: '↑ %12 vs geçen ay', icon: 'person-add-outline' },
  { id: 'churn-rate', title: 'Churn Oranı', value: '%4.2', change: '↓ %0.8 vs geçen ay', icon: 'trending-down-outline' },
  { id: 'avg-occupancy', title: 'Ortalama Doluluk', value: '%81', change: '↑ %3 vs geçen ay', icon: 'pie-chart-outline' },
  { id: 'conversion-rate', title: 'Dönüşüm Oranı', value: '%32', change: '↑ %4 vs geçen ay', icon: 'filter-outline' },
];

export const revenueTrend: RevenueTrendPoint[] = [
  { month: 'Şub', revenue: 218000 },
  { month: 'Mar', revenue: 236000 },
  { month: 'Nis', revenue: 251000 },
  { month: 'May', revenue: 258000 },
  { month: 'Haz', revenue: 279000 },
  { month: 'Tem', revenue: 304250 },
];

export const memberGrowth: MemberGrowthPoint[] = [
  { month: 'Şub', newMembers: 14, churned: 6 },
  { month: 'Mar', newMembers: 16, churned: 7 },
  { month: 'Nis', newMembers: 12, churned: 5 },
  { month: 'May', newMembers: 19, churned: 8 },
  { month: 'Haz', newMembers: 15, churned: 6 },
  { month: 'Tem', newMembers: 18, churned: 5 },
];

export const trainerPerformance: TrainerPerformance[] = [
  { id: 'trainer-1', name: 'Ece Yıldız', sessionsCount: 84, occupancyRate: 88, revenue: 62400 },
  { id: 'trainer-2', name: 'Melis Kara', sessionsCount: 76, occupancyRate: 85, revenue: 54800 },
  { id: 'trainer-3', name: 'Can Demir', sessionsCount: 71, occupancyRate: 79, revenue: 49200 },
  { id: 'trainer-4', name: 'Berkay Tuncel', sessionsCount: 58, occupancyRate: 82, revenue: 41500 },
  { id: 'trainer-5', name: 'Ayşe Kaya', sessionsCount: 45, occupancyRate: 74, revenue: 31200 },
];

export const popularClasses: PopularClassStat[] = [
  { id: 'cls-1', name: 'Reformer Pilates', bookings: 312, occupancyRate: 88 },
  { id: 'cls-2', name: 'Vinyasa Yoga', bookings: 268, occupancyRate: 91 },
  { id: 'cls-3', name: 'Fonksiyonel Antrenman', bookings: 224, occupancyRate: 79 },
  { id: 'cls-4', name: 'Core & Mat Pilates', bookings: 198, occupancyRate: 92 },
  { id: 'cls-5', name: 'Hamile Yogası', bookings: 96, occupancyRate: 75 },
];

export const reportQuickActions: QuickAction[] = [
  { id: 'qa-export-pdf', label: 'PDF İndir', icon: 'document-text-outline', toastMessage: 'PDF indirme işlemi yakında açılacak.' },
  { id: 'qa-export-excel', label: 'Excel İndir', icon: 'download-outline', toastMessage: 'Excel indirme işlemi yakında açılacak.' },
  { id: 'qa-schedule-report', label: 'Otomatik Rapor', icon: 'time-outline', toastMessage: 'Otomatik rapor planlama yakında açılacak.' },
  { id: 'qa-share-report', label: 'Raporu Paylaş', icon: 'share-social-outline', toastMessage: 'Rapor paylaşma işlemi yakında açılacak.' },
];
