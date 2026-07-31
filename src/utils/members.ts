import type { BadgeTone } from '@/components/ui/Badge';
import type { Member } from '@/types/members';

export interface MemberDisplayStatus {
  label: string;
  tone: BadgeTone;
}

export function getMemberDisplayStatus(member: Member): MemberDisplayStatus {
  if (member.status === 'donduruldu') return { label: 'Donduruldu', tone: 'info' };
  if (member.status === 'pasif') return { label: 'Pasif', tone: 'neutral' };

  if (member.renewalDaysLeft < 0) return { label: 'Gecikmiş', tone: 'critical' };
  if (member.renewalDaysLeft <= 7) return { label: 'Yenileme Yakın', tone: 'warning' };
  return { label: 'Aktif', tone: 'mint' };
}

export function isMemberOverdue(member: Member): boolean {
  return member.status === 'aktif' && member.renewalDaysLeft < 0;
}

export function isMemberRenewalSoon(member: Member): boolean {
  return member.status === 'aktif' && member.renewalDaysLeft >= 0 && member.renewalDaysLeft <= 7;
}
