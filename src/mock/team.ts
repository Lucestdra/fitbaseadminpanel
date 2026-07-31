import type { TeamMember } from '@/types/team';
import type { DistributionSegment } from '@/types/shared';
import type { KpiItem, QuickAction } from '@/types/dashboard';
import { colors } from '@/theme';

export const teamMembers: TeamMember[] = [
  { id: 'team-1', name: 'Selin Yılmaz', avatarInitials: 'SY', role: 'yonetici', specialty: null, email: 'selin@fitbase.studio', phone: '+90 532 111 11 11', attendanceRate: null, status: 'aktif', joinedDate: '3 Ocak 2023' },
  { id: 'team-2', name: 'Ece Yıldız', avatarInitials: 'EY', role: 'egitmen', specialty: 'Reformer Pilates', email: 'ece@fitbase.studio', phone: '+90 532 222 22 22', attendanceRate: 92, status: 'aktif', joinedDate: '12 Mart 2023' },
  { id: 'team-3', name: 'Can Demir', avatarInitials: 'CD', role: 'egitmen', specialty: 'Fonksiyonel Antrenman', email: 'can@fitbase.studio', phone: '+90 532 333 33 33', attendanceRate: 88, status: 'aktif', joinedDate: '2 Haziran 2023' },
  { id: 'team-4', name: 'Melis Kara', avatarInitials: 'MK', role: 'egitmen', specialty: 'Vinyasa Yoga', email: 'melis@fitbase.studio', phone: '+90 532 444 44 44', attendanceRate: 85, status: 'aktif', joinedDate: '18 Ağustos 2023' },
  { id: 'team-5', name: 'Ayşe Kaya', avatarInitials: 'AK', role: 'egitmen', specialty: 'Hamile Yogası', email: 'ayse@fitbase.studio', phone: '+90 532 555 55 55', attendanceRate: 82, status: 'aktif', joinedDate: '9 Ekim 2023' },
  { id: 'team-6', name: 'Berkay Tuncel', avatarInitials: 'BT', role: 'egitmen', specialty: 'Core & Mat Pilates / PT', email: 'berkay@fitbase.studio', phone: '+90 532 666 66 66', attendanceRate: 79, status: 'izinli', joinedDate: '14 Ocak 2024' },
  { id: 'team-7', name: 'Zeynep Arslan', avatarInitials: 'ZA', role: 'satis', specialty: null, email: 'zeynep@fitbase.studio', phone: '+90 532 777 77 77', attendanceRate: null, status: 'aktif', joinedDate: '5 Mayıs 2025' },
];

export const teamKpis: KpiItem[] = [
  { id: 'total-team', title: 'Toplam Ekip Üyesi', value: '7', icon: 'people-circle-outline' },
  { id: 'active-trainers', title: 'Aktif Eğitmen', value: '5', icon: 'ribbon-outline' },
  { id: 'new-this-month', title: 'Bu Ay Katılan', value: '1', icon: 'person-add-outline' },
  { id: 'avg-attendance', title: 'Ortalama Katılım Oranı', value: '%85', icon: 'pie-chart-outline' },
];

export const teamRoleDistribution: DistributionSegment[] = [
  { id: 'role-egitmen', label: 'Eğitmen', count: 5, percentage: 71, color: colors.primary },
  { id: 'role-yonetici', label: 'Yönetici', count: 1, percentage: 15, color: colors.textPrimary },
  { id: 'role-satis', label: 'Satış', count: 1, percentage: 14, color: colors.info },
];

export const teamRoleTotal = 7;

export const teamQuickActions: QuickAction[] = [
  { id: 'qa-new-team-member', label: 'Yeni Ekip Üyesi', icon: 'person-add-outline', toastMessage: 'Yeni ekip üyesi ekleme işlemi yakında açılacak.' },
  { id: 'qa-plan-shift', label: 'Vardiya Planla', icon: 'calendar-outline', toastMessage: 'Vardiya planlama işlemi yakında açılacak.' },
  { id: 'qa-performance-report', label: 'Performans Raporu', icon: 'bar-chart-outline', toastMessage: 'Performans raporu yakında açılacak.' },
  { id: 'qa-send-announcement', label: 'Duyuru Gönder', icon: 'megaphone-outline', toastMessage: 'Duyuru gönderme işlemi yakında açılacak.' },
];
