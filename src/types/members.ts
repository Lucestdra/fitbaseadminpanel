export type MemberStatus = 'aktif' | 'donduruldu' | 'pasif';

export interface MemberGift {
  id: string;
  label: string;
  dateLabel: string;
}

export interface Member {
  id: string;
  name: string;
  avatarInitials: string;
  packageName: string;
  sessionsRemaining: number | null;
  sessionsTotal: number | null;
  lastVisit: string;
  renewalDate: string;
  renewalDaysLeft: number;
  status: MemberStatus;
  phone?: string;
  email?: string;
  birthDate?: string;
  membershipStartDate?: string;
  membershipEndDate?: string;
  gifts?: MemberGift[];
  assignedTrainer?: string;
}

export interface MemberStatusCount {
  id: string;
  label: string;
  count: number;
  color: string;
}
