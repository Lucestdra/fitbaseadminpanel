export type TeamRole = 'yonetici' | 'egitmen' | 'satis';

export type TeamStatus = 'aktif' | 'izinli' | 'pasif';

export interface TeamMember {
  id: string;
  name: string;
  avatarInitials: string;
  role: TeamRole;
  specialty: string | null;
  email: string;
  phone: string;
  attendanceRate: number | null;
  status: TeamStatus;
  joinedDate: string;
}
