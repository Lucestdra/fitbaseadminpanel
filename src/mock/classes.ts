import type { ClassDefinition } from '@/types/classes';
import type { DistributionSegment } from '@/types/shared';
import type { KpiItem, QuickAction } from '@/types/dashboard';
import { colors } from '@/theme';

export const classDefinitions: ClassDefinition[] = [
  { id: 'cls-1', name: 'Reformer Pilates', category: 'Pilates', trainer: 'Ece Yıldız', schedule: 'Pzt, Sal, Çar, Cum 08:00', capacity: 10, averageOccupancy: 82, status: 'aktif' },
  { id: 'cls-2', name: 'Vinyasa Yoga', category: 'Yoga', trainer: 'Melis Kara', schedule: 'Pzt, Çar, Cum 09:00', capacity: 12, averageOccupancy: 88, status: 'aktif' },
  { id: 'cls-3', name: 'Fonksiyonel Antrenman', category: 'Fonksiyonel', trainer: 'Can Demir', schedule: 'Pzt, Çar, Cmt 10:30', capacity: 12, averageOccupancy: 79, status: 'aktif' },
  { id: 'cls-4', name: 'Hamile Yogası', category: 'Yoga', trainer: 'Ayşe Kaya', schedule: 'Çar, Cum 12:00', capacity: 8, averageOccupancy: 75, status: 'aktif' },
  { id: 'cls-5', name: 'Core & Mat Pilates', category: 'Pilates', trainer: 'Berkay Tuncel', schedule: 'Sal, Cmt 12:00', capacity: 10, averageOccupancy: 92, status: 'aktif' },
  { id: 'cls-6', name: 'Gentle Vinyasa Yoga', category: 'Yoga', trainer: 'Melis Kara', schedule: 'Per 09:00', capacity: 12, averageOccupancy: 68, status: 'aktif' },
  { id: 'cls-7', name: '1-on-1 PT Randevusu', category: 'PT', trainer: 'Berkay Tuncel, Can Demir', schedule: 'Randevu bazlı', capacity: 1, averageOccupancy: 95, status: 'aktif' },
  { id: 'cls-8', name: 'Aile Yogası (Deneme)', category: 'Yoga', trainer: 'Melis Kara', schedule: 'Paz 11:00', capacity: 10, averageOccupancy: 40, status: 'pasif' },
];

export const classKpis: KpiItem[] = [
  { id: 'total-classes', title: 'Toplam Ders Tipi', value: '8', icon: 'albums-outline' },
  { id: 'week-sessions', title: 'Bu Hafta Planlanan Seans', value: '42', icon: 'repeat-outline' },
  { id: 'avg-occupancy', title: 'Ortalama Doluluk', value: '%82', icon: 'pie-chart-outline' },
  { id: 'active-trainers', title: 'Aktif Eğitmen Sayısı', value: '5', icon: 'ribbon-outline' },
  { id: 'inactive-classes', title: 'Pasif Dersler', value: '1', icon: 'pause-circle-outline' },
];

export const classCategoryDistribution: DistributionSegment[] = [
  { id: 'cat-pilates', label: 'Pilates', count: 14, percentage: 33, color: colors.primary },
  { id: 'cat-yoga', label: 'Yoga', count: 12, percentage: 29, color: colors.primaryDark },
  { id: 'cat-fonksiyonel', label: 'Fonksiyonel', count: 8, percentage: 19, color: colors.info },
  { id: 'cat-pt', label: 'PT', count: 8, percentage: 19, color: '#8FE2B9' },
];

export const classCategoryTotal = 42;

export const classQuickActions: QuickAction[] = [
  { id: 'qa-new-class', label: 'Yeni Ders', icon: 'add-circle-outline', toastMessage: 'Yeni ders oluşturma işlemi yakında açılacak.' },
  { id: 'qa-build-schedule', label: 'Program Oluştur', icon: 'calendar-outline', toastMessage: 'Program oluşturma işlemi yakında açılacak.' },
  { id: 'qa-assign-trainer', label: 'Eğitmen Ata', icon: 'person-outline', toastMessage: 'Eğitmen atama işlemi yakında açılacak.' },
];
