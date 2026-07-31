import type { DistributionSegment } from '@/types/shared';
import type { Lead, TrialToday } from '@/types/leads';
import type { KpiItem, QuickAction } from '@/types/dashboard';
import { colors } from '@/theme';

export const leadStageCounts: Record<string, number> = {
  yeni: 12,
  aranacak: 7,
  ulasilamadi: 4,
  'tekrar-ara': 2,
  ilgileniyor: 3,
  'yuzyuze-gorusme': 2,
  'deneme-planlandi': 8,
  'teklif-verildi': 6,
  'uye-oldu': 9,
};

export const leads: Lead[] = [
  { id: 'lead-1', name: 'Cemre Altun', source: 'instagram', interest: 'Pilates', assignedTrainer: 'Ece Yıldız', stage: 'yeni', statusLabel: 'Yeni', dateLabel: '2 saat önce' },
  { id: 'lead-2', name: 'Mert Doğan', source: 'web-formu', interest: 'Reformer', assignedTrainer: 'Can Demir', stage: 'yeni', statusLabel: 'Yeni', dateLabel: '5 saat önce' },
  { id: 'lead-3', name: 'Büşra Kaya', source: 'whatsapp', interest: 'Pilates', assignedTrainer: 'Melis Kara', stage: 'yeni', statusLabel: 'Yeni', dateLabel: '1 gün önce' },
  { id: 'lead-4', name: 'Emre Yılmaz', source: 'walk-in', interest: 'PT', assignedTrainer: 'Berkay Tuncel', stage: 'yeni', statusLabel: 'Yeni', dateLabel: '1 gün önce' },

  { id: 'lead-5', name: 'Zeynep Arslan', source: 'whatsapp', interest: 'Reformer', assignedTrainer: 'Ece Yıldız', stage: 'aranacak', statusLabel: 'Aranacak', dateLabel: 'Bugün 11:00' },
  { id: 'lead-6', name: 'Ali Güneş', source: 'telefon', interest: 'PT', assignedTrainer: 'Can Demir', stage: 'aranacak', statusLabel: 'Aranacak', dateLabel: 'Bugün 14:00' },

  { id: 'lead-19', name: 'Gizem Polat', source: 'instagram', interest: 'Pilates', assignedTrainer: 'Ece Yıldız', stage: 'ulasilamadi', statusLabel: 'Ulaşılamadı', dateLabel: 'Bugün 09:15' },
  { id: 'lead-20', name: 'Emirhan Şahin', source: 'web-formu', interest: 'PT', assignedTrainer: 'Berkay Tuncel', stage: 'ulasilamadi', statusLabel: 'Ulaşılamadı', dateLabel: 'Dün 16:40' },

  { id: 'lead-7', name: 'Seda İnce', source: 'instagram', interest: 'Yoga', assignedTrainer: 'Melis Kara', stage: 'tekrar-ara', statusLabel: 'Tekrar Aranacak', dateLabel: 'Yarın 10:30' },
  { id: 'lead-8', name: 'Burak Şahin', source: 'web-formu', interest: 'Reformer', assignedTrainer: 'Berkay Tuncel', stage: 'tekrar-ara', statusLabel: 'Tekrar Aranacak', dateLabel: 'Yarın 15:00' },

  { id: 'lead-21', name: 'Yağmur Çelik', source: 'whatsapp', interest: 'Yoga', assignedTrainer: 'Melis Kara', stage: 'ilgileniyor', statusLabel: 'İlgileniyor', dateLabel: '2 saat önce' },

  { id: 'lead-22', name: 'Kaan Yıldırım', source: 'walk-in', interest: 'Reformer', assignedTrainer: 'Ece Yıldız', stage: 'yuzyuze-gorusme', statusLabel: 'Görüşme Planlandı', dateLabel: 'Yarın 13:00' },

  { id: 'lead-9', name: 'Ayşe Korkmaz', source: 'instagram', interest: 'Pilates', assignedTrainer: 'Ece Yıldız', stage: 'deneme-planlandi', statusLabel: 'Planlandı', dateLabel: '25 Mayıs 10:00' },
  { id: 'lead-10', name: 'Tolga Özkan', source: 'whatsapp', interest: 'Reformer', assignedTrainer: 'Can Demir', stage: 'deneme-planlandi', statusLabel: 'Planlandı', dateLabel: '25 Mayıs 12:00' },
  { id: 'lead-11', name: 'İrem Aksoy', source: 'instagram', interest: 'Yoga', assignedTrainer: 'Melis Kara', stage: 'deneme-planlandi', statusLabel: 'Planlandı', dateLabel: '26 Mayıs 09:30' },
  { id: 'lead-12', name: 'Kerem Demir', source: 'web-formu', interest: 'PT', assignedTrainer: 'Berkay Tuncel', stage: 'deneme-planlandi', statusLabel: 'Planlandı', dateLabel: '26 Mayıs 16:00' },

  { id: 'lead-13', name: 'Cansu Aydın', source: 'instagram', interest: 'Pilates', assignedTrainer: 'Ece Yıldız', stage: 'teklif-verildi', statusLabel: 'Teklif Gönderildi', dateLabel: '22 Mayıs' },
  { id: 'lead-14', name: 'Onur Kara', source: 'telefon', interest: 'Reformer', assignedTrainer: 'Can Demir', stage: 'teklif-verildi', statusLabel: 'Teklif Gönderildi', dateLabel: '21 Mayıs' },
  { id: 'lead-15', name: 'Neslihan Yıldız', source: 'web-formu', interest: 'PT', assignedTrainer: 'Melis Kara', stage: 'teklif-verildi', statusLabel: 'Teklif Gönderildi', dateLabel: '20 Mayıs' },

  { id: 'lead-16', name: 'Merve Taş', source: 'instagram', interest: 'Pilates', assignedTrainer: 'Ece Yıldız', stage: 'uye-oldu', statusLabel: 'Üye Oldu', dateLabel: '20 Mayıs' },
  { id: 'lead-17', name: 'Ahmet Yıldırım', source: 'web-formu', interest: 'Reformer', assignedTrainer: 'Can Demir', stage: 'uye-oldu', statusLabel: 'Üye Oldu', dateLabel: '19 Mayıs' },
  { id: 'lead-18', name: 'Elif Demir', source: 'whatsapp', interest: 'Yoga', assignedTrainer: 'Melis Kara', stage: 'uye-oldu', statusLabel: 'Üye Oldu', dateLabel: '18 Mayıs' },
];

export const additionalLeadsByStage: Record<string, number> = {
  yeni: 8,
  aranacak: 5,
  ulasilamadi: 2,
  'tekrar-ara': 1,
  ilgileniyor: 2,
  'yuzyuze-gorusme': 1,
  'deneme-planlandi': 4,
  'teklif-verildi': 3,
  'uye-oldu': 6,
};

export const trialsToday: TrialToday[] = [
  { id: 'trial-1', time: '10:00', memberName: 'Ayşe Korkmaz', interest: 'Reformer', trainer: 'Ece Yıldız', status: 'bekliyor' },
  { id: 'trial-2', time: '12:00', memberName: 'Tolga Özkan', interest: 'Pilates', trainer: 'Can Demir', status: 'onaylandi' },
  { id: 'trial-3', time: '14:00', memberName: 'Bahar Eren', interest: 'Yoga', trainer: 'Melis Kara', status: 'bekliyor' },
  { id: 'trial-4', time: '16:00', memberName: 'Kerem Demir', interest: 'PT', trainer: 'Berkay Tuncel', status: 'onaylandi' },
];

export const additionalTrialsToday = 2;

export const leadSourceDistribution: DistributionSegment[] = [
  { id: 'src-instagram', label: 'Instagram', count: 20, percentage: 36, color: colors.primary },
  { id: 'src-whatsapp', label: 'WhatsApp', count: 14, percentage: 25, color: colors.primaryDark },
  { id: 'src-telefon', label: 'Telefon', count: 8, percentage: 14, color: colors.info },
  { id: 'src-web-formu', label: 'Web Formu', count: 9, percentage: 16, color: '#8FE2B9' },
  { id: 'src-walk-in', label: 'Walk-in', count: 5, percentage: 9, color: colors.border },
];

export const leadSourceTotal = 56;

export const leadKpis: KpiItem[] = [
  { id: 'new-leads', title: 'Yeni Müşteri Adayları', value: '14', change: '↑ %27 vs dün', icon: 'person-add-outline' },
  { id: 'todays-trials', title: 'Bugünkü Deneme Dersleri', value: '6', change: '↑ %20 vs dün', icon: 'calendar-outline' },
  { id: 'conversion-rate', title: 'Dönüşüm Oranı', value: '%32', change: '↑ %4 vs geçen ay', icon: 'filter-outline' },
  { id: 'awaiting-contact', title: 'İletişim Bekleyenler', value: '9', change: '↑ %12 vs dün', icon: 'chatbubble-ellipses-outline' },
  { id: 'won-this-month', title: 'Bu Ay Kazanılan Üye', value: '18', change: '↑ %38 vs geçen ay', icon: 'person-outline' },
];

export const leadQuickActions: QuickAction[] = [
  { id: 'qa-new-lead', label: 'Yeni Müşteri Adayı', icon: 'person-add-outline', toastMessage: 'Yeni müşteri adayı işlemi yakında açılacak.' },
  { id: 'qa-send-whatsapp', label: 'WhatsApp Gönder', icon: 'logo-whatsapp', toastMessage: 'WhatsApp gönderme işlemi yakında açılacak.' },
];
