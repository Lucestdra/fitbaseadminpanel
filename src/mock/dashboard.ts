import type {
  CollectionSummary,
  DashboardPeriod,
  FunnelItem,
  KpiItem,
  OccupancyDayPoint,
  QuickAction,
  RenewalItem,
  ScheduleItem,
  TrainerPerformance,
} from '@/types/dashboard';

export const kpiItemsByPeriod: Record<DashboardPeriod, KpiItem[]> = {
  today: [
    { id: 'appointments-today', title: 'Bugünkü Randevular', value: '18', change: '↑ %12 vs dün', icon: 'calendar-outline', href: '/takvim' },
    { id: 'classes-today', title: 'Bugünkü Dersler', value: '7', change: '↑ %8 vs dün', icon: 'barbell-outline', href: '/dersler' },
    { id: 'new-prospects', title: 'Yeni Müşteri Adayları', value: '14', change: '↑ %27 vs dün', icon: 'person-add-outline', href: '/musteri-adaylari' },
    { id: 'trial-classes', title: 'Deneme Dersi', value: '6', change: '↑ %20 vs dün', icon: 'sparkles-outline', href: '/musteri-adaylari' },
    { id: 'active-members', title: 'Aktif Üyeler', value: '342', change: '↑ %5 vs geçen ay', icon: 'people-outline', href: '/uyeler' },
    { id: 'monthly-revenue', title: 'Aylık Gelir', value: '₺328.450', change: '↑ %18 vs geçen ay', icon: 'wallet-outline', href: '/odemeler' },
  ],
  week: [
    { id: 'appointments-today', title: 'Bu Hafta Randevular', value: '94', change: '↑ %9 vs geçen hafta', icon: 'calendar-outline', href: '/takvim' },
    { id: 'classes-today', title: 'Bu Hafta Dersler', value: '42', change: '↑ %6 vs geçen hafta', icon: 'barbell-outline', href: '/dersler' },
    { id: 'new-prospects', title: 'Bu Hafta Yeni Müşteri Adayları', value: '61', change: '↑ %15 vs geçen hafta', icon: 'person-add-outline', href: '/musteri-adaylari' },
    { id: 'trial-classes', title: 'Bu Hafta Deneme Dersi', value: '23', change: '↑ %11 vs geçen hafta', icon: 'sparkles-outline', href: '/musteri-adaylari' },
    { id: 'active-members', title: 'Aktif Üyeler', value: '342', change: '↑ %5 vs geçen ay', icon: 'people-outline', href: '/uyeler' },
    { id: 'monthly-revenue', title: 'Haftalık Gelir', value: '₺76.200', change: '↑ %14 vs geçen hafta', icon: 'wallet-outline', href: '/odemeler' },
  ],
  month: [
    { id: 'appointments-today', title: 'Bu Ay Randevular', value: '386', change: '↑ %11 vs geçen ay', icon: 'calendar-outline', href: '/takvim' },
    { id: 'classes-today', title: 'Bu Ay Dersler', value: '168', change: '↑ %7 vs geçen ay', icon: 'barbell-outline', href: '/dersler' },
    { id: 'new-prospects', title: 'Bu Ay Yeni Müşteri Adayları', value: '214', change: '↑ %22 vs geçen ay', icon: 'person-add-outline', href: '/musteri-adaylari' },
    { id: 'trial-classes', title: 'Bu Ay Deneme Dersi', value: '89', change: '↑ %16 vs geçen ay', icon: 'sparkles-outline', href: '/musteri-adaylari' },
    { id: 'active-members', title: 'Aktif Üyeler', value: '342', change: '↑ %5 vs geçen ay', icon: 'people-outline', href: '/uyeler' },
    { id: 'monthly-revenue', title: 'Aylık Gelir', value: '₺328.450', change: '↑ %18 vs geçen ay', icon: 'wallet-outline', href: '/odemeler' },
  ],
};

export const dailySchedule: ScheduleItem[] = [
  { id: 'sch-1', time: '08:00', title: 'Reformer Pilates', trainer: 'Ece Yıldız', booked: 8, capacity: 10 },
  { id: 'sch-2', time: '09:00', title: 'Vinyasa Yoga', trainer: 'Melis Kara', booked: 10, capacity: 12 },
  { id: 'sch-3', time: '10:30', title: 'Fonksiyonel Antrenman', trainer: 'Can Demir', booked: 9, capacity: 12 },
  { id: 'sch-4', time: '12:00', title: 'Hamile Yogası', trainer: 'Ayşe Kaya', booked: 6, capacity: 8 },
  { id: 'sch-5', time: '18:30', title: 'Reformer Pilates', trainer: 'Ece Yıldız', booked: 7, capacity: 10 },
];

export const additionalScheduleCount = 2;

export const prospectFunnelByPeriod: Record<DashboardPeriod, FunnelItem[]> = {
  today: [
    { id: 'funnel-new', label: 'Yeni', count: 5, percentage: 100 },
    { id: 'funnel-contacted', label: 'İletişimde', count: 3, percentage: 60 },
    { id: 'funnel-trial', label: 'Deneme', count: 2, percentage: 40 },
    { id: 'funnel-offer', label: 'Teklif', count: 1, percentage: 20 },
    { id: 'funnel-won', label: 'Üye Oldu', count: 1, percentage: 20 },
  ],
  week: [
    { id: 'funnel-new', label: 'Yeni', count: 15, percentage: 100 },
    { id: 'funnel-contacted', label: 'İletişimde', count: 9, percentage: 60 },
    { id: 'funnel-trial', label: 'Deneme', count: 5, percentage: 33 },
    { id: 'funnel-offer', label: 'Teklif', count: 3, percentage: 20 },
    { id: 'funnel-won', label: 'Üye Oldu', count: 2, percentage: 13 },
  ],
  month: [
    { id: 'funnel-new', label: 'Yeni', count: 56, percentage: 100 },
    { id: 'funnel-contacted', label: 'İletişimde', count: 34, percentage: 61 },
    { id: 'funnel-trial', label: 'Deneme', count: 18, percentage: 32 },
    { id: 'funnel-offer', label: 'Teklif', count: 11, percentage: 20 },
    { id: 'funnel-won', label: 'Üye Oldu', count: 8, percentage: 14 },
  ],
};

export const packageRenewals: RenewalItem[] = [
  { id: 'renew-1', memberName: 'Zeynep Aydın', packageName: 'Gold Paket', remainingDays: 3, renewalDate: '31 Mayıs 2025', avatarInitials: 'ZA' },
  { id: 'renew-2', memberName: 'Mert Yılmaz', packageName: 'Reformer 8 Seans', remainingDays: 7, renewalDate: '4 Haziran 2025', avatarInitials: 'MY' },
  { id: 'renew-3', memberName: 'Nazlı Demir', packageName: 'Premium Paket', remainingDays: 9, renewalDate: '6 Haziran 2025', avatarInitials: 'ND' },
  { id: 'renew-4', memberName: 'Berkay Tuncel', packageName: 'Gold Paket', remainingDays: 12, renewalDate: '9 Haziran 2025', avatarInitials: 'BT' },
  { id: 'renew-5', memberName: 'Aslı Çelik', packageName: 'Reformer 4 Seans', remainingDays: 15, renewalDate: '12 Haziran 2025', avatarInitials: 'AÇ' },
];

export const collectionSummary: CollectionSummary = {
  outstanding: 67850,
  overdue: 23400,
  collectedThisMonth: 304250,
  collectionRate: 92,
};

export const occupancyWeek: OccupancyDayPoint[] = [
  { day: 'Pzt', occupancyRate: 78, noShowRate: 6 },
  { day: 'Sal', occupancyRate: 82, noShowRate: 4 },
  { day: 'Çar', occupancyRate: 76, noShowRate: 5 },
  { day: 'Per', occupancyRate: 84, noShowRate: 3 },
  { day: 'Cum', occupancyRate: 80, noShowRate: 4 },
  { day: 'Cmt', occupancyRate: 71, noShowRate: 6 },
  { day: 'Paz', occupancyRate: 65, noShowRate: 8 },
];

export const trainerPerformance: TrainerPerformance[] = [
  { id: 'trainer-1', name: 'Ece Yıldız', attendanceRate: 92, rating: 4.9, avatarInitials: 'EY' },
  { id: 'trainer-2', name: 'Can Demir', attendanceRate: 88, rating: 4.8, avatarInitials: 'CD' },
  { id: 'trainer-3', name: 'Melis Kara', attendanceRate: 85, rating: 4.7, avatarInitials: 'MK' },
  { id: 'trainer-4', name: 'Ayşe Kaya', attendanceRate: 82, rating: 4.6, avatarInitials: 'AK' },
  { id: 'trainer-5', name: 'Berkay Tuncel', attendanceRate: 79, rating: 4.5, avatarInitials: 'BT' },
];

export const quickActions: QuickAction[] = [
  { id: 'qa-new-member', label: 'Yeni Üye Ekle', icon: 'person-add-outline', toastMessage: 'Yeni üye işlemi yakında açılacak.' },
  { id: 'qa-plan-trial', label: 'Deneme Planla', icon: 'sparkles-outline', toastMessage: 'Deneme planlama işlemi yakında açılacak.' },
  { id: 'qa-record-payment', label: 'Ödeme Kaydet', icon: 'card-outline', toastMessage: 'Ödeme kaydetme işlemi yakında açılacak.' },
  { id: 'qa-create-class', label: 'Ders Oluştur', icon: 'add-circle-outline', toastMessage: 'Ders oluşturma işlemi yakında açılacak.' },
  { id: 'qa-send-message', label: 'Mesaj Gönder', icon: 'paper-plane-outline', toastMessage: 'Mesaj gönderme işlemi yakında açılacak.' },
];
