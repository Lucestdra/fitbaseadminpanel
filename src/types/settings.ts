import type { IconName } from './dashboard';
import type { BadgeTone } from '@/components/ui/Badge';

export interface TaxInfo {
  taxOffice: string;
  taxNumber: string;
  companyTitle: string;
  billingAddress: string;
  documentName: string | null;
}

export interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: 'odendi' | 'bekliyor';
  fileName: string;
}

export interface SubscriptionInfo {
  planName: string;
  price: string;
  renewalDate: string;
  memberLimit: number;
  memberUsage: number;
}

export type PackageStatus = 'aktif' | 'pasif';

export interface PackageTemplate {
  id: string;
  name: string;
  price: string;
  sessionCount: number | null;
  durationDays: number;
  status: PackageStatus;
}

export interface GiftTemplate {
  id: string;
  name: string;
  description: string;
}

export interface LeadSourceOption {
  id: string;
  label: string;
  icon: IconName;
}

export interface LeadStageOption {
  id: string;
  title: string;
  statusLabel: string;
  tone: BadgeTone;
}

export interface WorkingHoursDay {
  id: string;
  label: string;
  isOpen: boolean;
  start: string;
  end: string;
}

export interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}
