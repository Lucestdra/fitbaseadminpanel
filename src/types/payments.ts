export type PaymentMethod = 'kredi-karti' | 'nakit' | 'havale' | 'diger';

export type PaymentStatus = 'tahsil-edildi' | 'bekliyor' | 'gecikti';

export interface Payment {
  id: string;
  memberName: string;
  avatarInitials: string;
  description: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  status: PaymentStatus;
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  'kredi-karti': 'Kredi Kartı',
  nakit: 'Nakit',
  havale: 'Havale',
  diger: 'Diğer',
};
