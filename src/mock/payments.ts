import type { Payment } from '@/types/payments';
import type { DistributionSegment } from '@/types/shared';
import type { KpiItem, QuickAction, CollectionSummary } from '@/types/dashboard';
import { colors } from '@/theme';

export const payments: Payment[] = [
  { id: 'pay-1', memberName: 'Zeynep Aydın', avatarInitials: 'ZA', description: 'Gold Paket Yenileme', amount: 2400, method: 'kredi-karti', date: '20 Mayıs 2025', status: 'tahsil-edildi' },
  { id: 'pay-2', memberName: 'Mert Yılmaz', avatarInitials: 'MY', description: 'Reformer 8 Seans', amount: 3200, method: 'havale', date: '18 Mayıs 2025', status: 'tahsil-edildi' },
  { id: 'pay-3', memberName: 'Can Demir', avatarInitials: 'CD', description: 'PT 4 Seans', amount: 1800, method: 'kredi-karti', date: '2 Mayıs 2025', status: 'gecikti' },
  { id: 'pay-4', memberName: 'Ayşe Kaya', avatarInitials: 'AK', description: 'Gold Paket Yenileme', amount: 2400, method: 'nakit', date: '30 Mayıs 2025', status: 'bekliyor' },
  { id: 'pay-5', memberName: 'Berkay Tuncel', avatarInitials: 'BT', description: 'Reformer 4 Seans', amount: 1600, method: 'kredi-karti', date: '9 Haziran 2025', status: 'bekliyor' },
  { id: 'pay-6', memberName: 'Aslı Çelik', avatarInitials: 'AÇ', description: 'Premium Paket Yenileme', amount: 4500, method: 'havale', date: '27 Mayıs 2025', status: 'tahsil-edildi' },
  { id: 'pay-7', memberName: 'Melis Kara', avatarInitials: 'MK', description: 'Yoga 12 Ders', amount: 2100, method: 'kredi-karti', date: '24 Mayıs 2025', status: 'tahsil-edildi' },
  { id: 'pay-8', memberName: 'Kerem Demir', avatarInitials: 'KD', description: 'Premium Paket Yenileme', amount: 4500, method: 'kredi-karti', date: '25 Haziran 2025', status: 'bekliyor' },
];

export const paymentKpis: KpiItem[] = [
  { id: 'collected-month', title: 'Bu Ay Tahsil Edilen', value: '₺304.250', change: '↑ %18 vs geçen ay', icon: 'wallet-outline' },
  { id: 'outstanding', title: 'Bekleyen Ödemeler', value: '₺67.850', change: '↑ %5 vs geçen ay', icon: 'time-outline' },
  { id: 'overdue', title: 'Geciken Ödemeler', value: '₺23.400', change: '↑ %2 vs geçen ay', icon: 'alert-circle-outline' },
  { id: 'collection-rate', title: 'Tahsilat Oranı', value: '%92', change: '↑ %1 vs geçen ay', icon: 'checkmark-circle-outline' },
  { id: 'transactions-month', title: 'Bu Ay İşlem Sayısı', value: '186', change: '↑ %9 vs geçen ay', icon: 'receipt-outline' },
];

export const collectionSummary: CollectionSummary = {
  outstanding: 67850,
  overdue: 23400,
  collectedThisMonth: 304250,
  collectionRate: 92,
};

export const paymentMethodDistribution: DistributionSegment[] = [
  { id: 'method-kredi', label: 'Kredi Kartı', count: 132, percentage: 71, color: colors.primary },
  { id: 'method-havale', label: 'Havale', count: 34, percentage: 18, color: colors.primaryDark },
  { id: 'method-nakit', label: 'Nakit', count: 15, percentage: 8, color: colors.info },
  { id: 'method-diger', label: 'Diğer', count: 5, percentage: 3, color: colors.border },
];

export const paymentMethodTotal = 186;

export const paymentQuickActions: QuickAction[] = [
  { id: 'qa-record-payment', label: 'Ödeme Kaydet', icon: 'card-outline', toastMessage: 'Ödeme kaydetme işlemi yakında açılacak.' },
  { id: 'qa-create-invoice', label: 'Fatura Oluştur', icon: 'document-text-outline', toastMessage: 'Fatura oluşturma işlemi yakında açılacak.' },
  { id: 'qa-send-reminder', label: 'Hatırlatma Gönder', icon: 'notifications-outline', toastMessage: 'Hatırlatma gönderme işlemi yakında açılacak.' },
  { id: 'qa-export-report', label: 'Rapor İndir', icon: 'download-outline', toastMessage: 'Rapor indirme işlemi yakında açılacak.' },
];
