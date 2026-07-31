import type {
  TaxInfo,
  SubscriptionInfo,
  PackageTemplate,
  GiftTemplate,
  LeadSourceOption,
  LeadStageOption,
  Invoice,
  WorkingHoursDay,
  NotificationPreference,
} from '@/types/settings';

export const studioProfile = {
  name: 'Fitbase Studio',
  address: 'Caferağa Mah. Moda Cad. No: 42, Kadıköy, İstanbul',
  phone: '+90 532 000 00 00',
  contactPerson: 'Selin Yılmaz',
};

export const taxInfo: TaxInfo = {
  taxOffice: 'Kadıköy Vergi Dairesi',
  taxNumber: '1234567890',
  companyTitle: 'Fitbase Spor Hizmetleri Ltd. Şti.',
  billingAddress: 'Caferağa Mah. Moda Cad. No: 42, Kadıköy, İstanbul',
  documentName: 'vergi_levhasi_2025.pdf',
};

export const subscriptionInfo: SubscriptionInfo = {
  planName: 'Fitbase Pro',
  price: '₺1.499 / ay',
  renewalDate: '14 Temmuz 2026',
  memberLimit: 500,
  memberUsage: 342,
};

export const invoices: Invoice[] = [
  { id: 'inv-1', date: '14 Temmuz 2026', amount: '₺1.499', status: 'odendi', fileName: 'fitbase_fatura_temmuz2026.pdf' },
  { id: 'inv-2', date: '14 Haziran 2026', amount: '₺1.499', status: 'odendi', fileName: 'fitbase_fatura_haziran2026.pdf' },
  { id: 'inv-3', date: '14 Mayıs 2026', amount: '₺1.499', status: 'odendi', fileName: 'fitbase_fatura_mayis2026.pdf' },
  { id: 'inv-4', date: '14 Nisan 2026', amount: '₺1.299', status: 'odendi', fileName: 'fitbase_fatura_nisan2026.pdf' },
  { id: 'inv-5', date: '14 Mart 2026', amount: '₺1.299', status: 'odendi', fileName: 'fitbase_fatura_mart2026.pdf' },
];

export const packageTemplates: PackageTemplate[] = [
  { id: 'pkg-1', name: 'Gold Paket', price: '₺2.400', sessionCount: null, durationDays: 30, status: 'aktif' },
  { id: 'pkg-2', name: 'Premium Paket', price: '₺4.500', sessionCount: null, durationDays: 30, status: 'aktif' },
  { id: 'pkg-3', name: 'Reformer 8 Seans', price: '₺3.200', sessionCount: 8, durationDays: 60, status: 'aktif' },
  { id: 'pkg-4', name: 'Yoga 12 Ders', price: '₺2.100', sessionCount: 12, durationDays: 60, status: 'aktif' },
  { id: 'pkg-5', name: 'PT 4 Seans', price: '₺1.800', sessionCount: 4, durationDays: 30, status: 'aktif' },
  { id: 'pkg-6', name: 'Deneme Paketi', price: '₺250', sessionCount: 1, durationDays: 7, status: 'pasif' },
];

export const leadSourceOptions: LeadSourceOption[] = [
  { id: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
  { id: 'telefon', label: 'Telefon', icon: 'call-outline' },
  { id: 'web-formu', label: 'Web Formu', icon: 'globe-outline' },
  { id: 'walk-in', label: 'Walk-in', icon: 'walk-outline' },
];

export const interestOptions: string[] = ['Pilates', 'Reformer', 'Yoga', 'PT'];

export const classCategoryOptions: string[] = ['Pilates', 'Yoga', 'Fonksiyonel', 'PT'];

export const responsibleOptions: string[] = ['Ece Yıldız', 'Can Demir', 'Melis Kara', 'Ayşe Kaya', 'Berkay Tuncel'];

export const leadStageOptions: LeadStageOption[] = [
  { id: 'yeni', title: 'Yeni', statusLabel: 'Yeni', tone: 'mint' },
  { id: 'aranacak', title: 'Aranacak', statusLabel: 'Aranacak', tone: 'mint' },
  { id: 'ulasilamadi', title: 'Ulaşılamadı', statusLabel: 'Ulaşılamadı', tone: 'warning' },
  { id: 'tekrar-ara', title: 'Tekrar Ara', statusLabel: 'Tekrar Aranacak', tone: 'warning' },
  { id: 'ilgileniyor', title: 'İlgileniyor', statusLabel: 'İlgileniyor', tone: 'mint' },
  { id: 'yuzyuze-gorusme', title: 'Yüzyüze Görüşme', statusLabel: 'Görüşme Planlandı', tone: 'info' },
  { id: 'deneme-planlandi', title: 'Deneme Planlandı', statusLabel: 'Planlandı', tone: 'mint' },
  { id: 'teklif-verildi', title: 'Teklif Verildi', statusLabel: 'Teklif Gönderildi', tone: 'mint' },
  { id: 'uye-oldu', title: 'Üye Oldu', statusLabel: 'Üye Oldu', tone: 'dark' },
];

export const giftTemplates: GiftTemplate[] = [
  { id: 'gift-1', name: '1 Ay Hediye Üyelik', description: 'Üyeliğin bitiş tarihine 1 ay ekler' },
  { id: 'gift-2', name: '3 Seans Hediye', description: 'Seans bakiyesine 3 seans ekler' },
  { id: 'gift-3', name: 'Arkadaşını Getir Hediyesi', description: 'Referans getiren üyeye 1 seans hediye' },
  { id: 'gift-4', name: 'Doğum Günü Hediyesi', description: 'Doğum günü ayında 1 ücretsiz PT seansı' },
];

export const workingHours: WorkingHoursDay[] = [
  { id: 'pzt', label: 'Pazartesi', isOpen: true, start: '08:00', end: '21:00' },
  { id: 'sal', label: 'Salı', isOpen: true, start: '08:00', end: '21:00' },
  { id: 'car', label: 'Çarşamba', isOpen: true, start: '08:00', end: '21:00' },
  { id: 'per', label: 'Perşembe', isOpen: true, start: '08:00', end: '21:00' },
  { id: 'cum', label: 'Cuma', isOpen: true, start: '08:00', end: '21:00' },
  { id: 'cmt', label: 'Cumartesi', isOpen: true, start: '09:00', end: '18:00' },
  { id: 'paz', label: 'Pazar', isOpen: false, start: '10:00', end: '16:00' },
];

export const notificationPreferences: NotificationPreference[] = [
  { id: 'notif-email', label: 'E-posta Bildirimleri', description: 'Yeni müşteri adayı ve ödeme bildirimleri', enabled: true },
  { id: 'notif-sms', label: 'SMS Bildirimleri', description: 'Randevu hatırlatmaları ve iptaller', enabled: true },
  { id: 'notif-push', label: 'Anlık Bildirimler', description: 'Uygulama içi push bildirimleri', enabled: false },
  { id: 'notif-weekly', label: 'Haftalık Özet Raporu', description: 'Her pazartesi performans özeti e-postası', enabled: true },
];
