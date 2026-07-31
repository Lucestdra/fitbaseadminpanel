import type { DistributionSegment } from '@/types/shared';
import type { Member, MemberStatusCount } from '@/types/members';
import { colors } from '@/theme';
import type { KpiItem, QuickAction, RenewalItem } from '@/types/dashboard';

export const members: Member[] = [
  { id: 'mem-1', name: 'Zeynep Aydın', avatarInitials: 'ZA', phone: '+90 532 701 11 01', packageName: 'Gold Paket', sessionsRemaining: 8, sessionsTotal: 10, lastVisit: '29 Mayıs 2025', renewalDate: '31 Mayıs 2025', renewalDaysLeft: 3, status: 'aktif', assignedTrainer: 'Ece Yıldız' },
  { id: 'mem-2', name: 'Mert Yılmaz', avatarInitials: 'MY', phone: '+90 532 701 11 02', packageName: 'Reformer 8 Seans', sessionsRemaining: 3, sessionsTotal: 8, lastVisit: '28 Mayıs 2025', renewalDate: '4 Haziran 2025', renewalDaysLeft: 7, status: 'aktif', assignedTrainer: 'Can Demir' },
  { id: 'mem-3', name: 'Aslı Çelik', avatarInitials: 'AÇ', phone: '+90 532 701 11 03', packageName: 'Premium Paket', sessionsRemaining: null, sessionsTotal: null, lastVisit: '27 Mayıs 2025', renewalDate: '12 Haziran 2025', renewalDaysLeft: 15, status: 'aktif', assignedTrainer: 'Melis Kara' },
  { id: 'mem-4', name: 'Berkay Tuncel', avatarInitials: 'BT', phone: '+90 532 701 11 04', packageName: 'Reformer 4 Seans', sessionsRemaining: 1, sessionsTotal: 4, lastVisit: '25 Mayıs 2025', renewalDate: '9 Haziran 2025', renewalDaysLeft: 5, status: 'aktif', assignedTrainer: 'Ece Yıldız' },
  { id: 'mem-5', name: 'Melis Kara', avatarInitials: 'MK', phone: '+90 532 701 11 05', packageName: 'Yoga 12 Ders', sessionsRemaining: 5, sessionsTotal: 12, lastVisit: '24 Mayıs 2025', renewalDate: '18 Haziran 2025', renewalDaysLeft: 21, status: 'aktif', assignedTrainer: 'Ayşe Kaya' },
  { id: 'mem-6', name: 'Can Demir', avatarInitials: 'CD', phone: '+90 532 701 11 06', packageName: 'PT 4 Seans', sessionsRemaining: 0, sessionsTotal: 4, lastVisit: '12 Mayıs 2025', renewalDate: '2 Mayıs 2025', renewalDaysLeft: -9, status: 'aktif', assignedTrainer: 'Berkay Tuncel' },
  { id: 'mem-7', name: 'Ayşe Kaya', avatarInitials: 'AK', phone: '+90 532 701 11 07', packageName: 'Gold Paket', sessionsRemaining: 4, sessionsTotal: 10, lastVisit: '18 Mayıs 2025', renewalDate: '30 Mayıs 2025', renewalDaysLeft: 2, status: 'aktif', assignedTrainer: 'Can Demir' },
  { id: 'mem-8', name: 'Kerem Demir', avatarInitials: 'KD', phone: '+90 532 701 11 08', packageName: 'Premium Paket', sessionsRemaining: null, sessionsTotal: null, lastVisit: '21 Mayıs 2025', renewalDate: '25 Haziran 2025', renewalDaysLeft: 28, status: 'donduruldu', assignedTrainer: 'Ece Yıldız' },
];

export const memberKpis: KpiItem[] = [
  { id: 'active-members', title: 'Aktif Üyeler', value: '342', icon: 'people-outline' },
  { id: 'new-members-month', title: 'Bu Ay Yeni Üyeler', value: '18', icon: 'person-add-outline' },
  { id: 'package-ending', title: 'Paket Bitiyor', value: '24', icon: 'calendar-outline' },
  { id: 'overdue-payment', title: 'Geciken Ödeme', value: '9', icon: 'card-outline' },
  { id: 'frozen-members', title: 'Dondurulmuş Üyeler', value: '12', icon: 'pause-circle-outline' },
];

export const packageDistribution: DistributionSegment[] = [
  { id: 'pkg-gold', label: 'Gold Paket', count: 120, percentage: 35, color: colors.primary },
  { id: 'pkg-premium', label: 'Premium Paket', count: 98, percentage: 29, color: colors.primaryDark },
  { id: 'pkg-reformer8', label: 'Reformer 8 Seans', count: 64, percentage: 19, color: colors.info },
  { id: 'pkg-yoga12', label: 'Yoga 12 Ders', count: 36, percentage: 11, color: '#8FE2B9' },
  { id: 'pkg-pt4', label: 'PT 4 Seans', count: 24, percentage: 7, color: colors.border },
];

export const packageDistributionTotal = 342;

export const upcomingRenewals: RenewalItem[] = [
  { id: 'renewal-1', memberName: 'Zeynep Aydın', packageName: 'Gold Paket', remainingDays: 3, renewalDate: '31 Mayıs 2025', avatarInitials: 'ZA' },
  { id: 'renewal-2', memberName: 'Mert Yılmaz', packageName: 'Reformer 8 Seans', remainingDays: 7, renewalDate: '4 Haziran 2025', avatarInitials: 'MY' },
  { id: 'renewal-3', memberName: 'Berkay Tuncel', packageName: 'Reformer 4 Seans', remainingDays: 12, renewalDate: '9 Haziran 2025', avatarInitials: 'BT' },
  { id: 'renewal-4', memberName: 'Aslı Çelik', packageName: 'Premium Paket', remainingDays: 15, renewalDate: '12 Haziran 2025', avatarInitials: 'AÇ' },
  { id: 'renewal-5', memberName: 'Melis Kara', packageName: 'Yoga 12 Ders', remainingDays: 21, renewalDate: '18 Haziran 2025', avatarInitials: 'MK' },
];

export const memberStatusCounts: MemberStatusCount[] = [
  { id: 'status-aktif', label: 'Aktif', count: 342, color: colors.primary },
  { id: 'status-donduruldu', label: 'Dondurulmuş', count: 12, color: colors.info },
  { id: 'status-pasif', label: 'Pasif', count: 27, color: colors.textSecondary },
];

export const memberQuickActions: QuickAction[] = [
  { id: 'qa-new-member', label: 'Yeni Üye', icon: 'person-add-outline', toastMessage: 'Yeni üye işlemi yakında açılacak.' },
  { id: 'qa-add-package', label: 'Paket Ekle', icon: 'pricetag-outline', toastMessage: 'Paket ekleme işlemi yakında açılacak.' },
  { id: 'qa-record-payment', label: 'Ödeme Kaydet', icon: 'card-outline', toastMessage: 'Ödeme kaydetme işlemi yakında açılacak.' },
  { id: 'qa-send-message', label: 'Mesaj Gönder', icon: 'paper-plane-outline', toastMessage: 'Mesaj gönderme işlemi yakında açılacak.' },
];
