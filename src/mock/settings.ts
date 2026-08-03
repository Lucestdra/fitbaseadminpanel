import type { SubscriptionInfo, PackageTemplate, GiftTemplate, Invoice } from '@/types/settings';

/**
 * What is left of the settings mocks after Phase 2.1.
 *
 * The catalogs, working hours, notification matrix, studio profile and tax details are server-
 * backed now, and their arrays are gone — `CatalogsContext` and the settings screen read them from
 * the API. Anything still here is data whose own phase has not arrived:
 *
 * - `subscriptionInfo` and `invoices` belong to `platform_billing`, which is Phase 2.5.
 * - `packageTemplates` and `giftTemplates` are still read by the members and payments screens,
 *   which are Phase 2.2 and 2.5. The settings screen no longer uses them; it shows the real ones.
 *   Two shapes for "a package" exist for exactly as long as those two screens are mocks.
 * - `responsibleOptions` never becomes a server concept at all: assignments key on
 *   `staff_member.id` rather than on a name (backend ADR-0016), and the vocabulary register bans
 *   the word. The four screens that use it import it from here directly rather than through
 *   `CatalogsContext`, which now talks only to the server — deliberately uglier at the call site
 *   than a hidden fallback would be.
 */

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

export const responsibleOptions: string[] = ['Ece Yıldız', 'Can Demir', 'Melis Kara', 'Ayşe Kaya', 'Berkay Tuncel'];

export const giftTemplates: GiftTemplate[] = [
  { id: 'gift-1', name: '1 Ay Hediye Üyelik', description: 'Üyeliğin bitiş tarihine 1 ay ekler' },
  { id: 'gift-2', name: '3 Seans Hediye', description: 'Seans bakiyesine 3 seans ekler' },
  { id: 'gift-3', name: 'Arkadaşını Getir Hediyesi', description: 'Referans getiren üyeye 1 seans hediye' },
  { id: 'gift-4', name: 'Doğum Günü Hediyesi', description: 'Doğum günü ayında 1 ücretsiz PT seansı' },
];

